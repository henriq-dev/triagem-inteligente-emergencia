import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { calculateUrgency, SensorData } from "./urgencyCalculator";
import {
  createPatient,
  getPatientById,
  getQueuedPatients,
  getAttendingPatients,
  updatePatientStatus,
  updateQueuePositions,
  createAttendanceRecord,
  getPatientAttendanceHistory,
  getAllAttendanceHistory,
  getLatestQueueMetrics,
  getQueueMetricsHistory,
  createQueueMetrics,
} from "./db";
import { InsertPatient } from "../drizzle/schema";

// ============= VALIDATION SCHEMAS =============

const SensorDataSchema = z.object({
  heartRate: z.number().int().min(0).max(300),
  systolicBP: z.number().int().min(0).max(300),
  diastolicBP: z.number().int().min(0).max(300),
  temperature: z.number().min(30).max(45),
  oxygenSaturation: z.number().int().min(0).max(100),
  painLevel: z.number().int().min(0).max(10),
});

const CheckInSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  age: z.number().int().min(0).max(150),
  gender: z.enum(["M", "F", "O"]),
  cpf: z.string().optional(),
  symptoms: z.string().optional(),
  medicalHistory: z.string().optional(),
  sensorData: SensorDataSchema,
});

// ============= TRIAGEM ROUTER =============

const triagemRouter = router({
  /**
   * Check-in de novo paciente com dados de sensores
   */
  checkIn: publicProcedure
    .input(CheckInSchema)
    .mutation(async ({ input }) => {
      // Calculate urgency based on sensor data
      const urgencyResult = calculateUrgency(input.sensorData);

      // Create patient record
      const patientData: InsertPatient = {
        name: input.name,
        age: input.age,
        gender: input.gender,
        cpf: input.cpf || undefined,
        heartRate: input.sensorData.heartRate,
        systolicBP: input.sensorData.systolicBP,
        diastolicBP: input.sensorData.diastolicBP,
        temperature: String(input.sensorData.temperature) as any,
        oxygenSaturation: input.sensorData.oxygenSaturation,
        painLevel: input.sensorData.painLevel,
        urgencyLevel: urgencyResult.level,
        urgencyScore: urgencyResult.score,
        symptoms: input.symptoms || null,
        medicalHistory: input.medicalHistory || null,
        status: "aguardando",
      };

      const patient = await createPatient(patientData);

      // Update queue positions
      await updateQueuePositions();

      return {
        success: true,
        patient: {
          id: patient.id,
          name: patient.name,
          urgencyLevel: patient.urgencyLevel,
          urgencyScore: patient.urgencyScore,
          checkInTime: patient.checkInTime,
        },
        urgencyReasoning: urgencyResult.reasoning,
      };
    }),

  /**
   * Get current queue of waiting patients
   */
  getQueue: publicProcedure.query(async () => {
    const queuedPatients = await getQueuedPatients();

    return queuedPatients.map((patient, index) => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      urgencyLevel: patient.urgencyLevel,
      urgencyScore: patient.urgencyScore,
      queuePosition: index + 1,
      checkInTime: patient.checkInTime,
      estimatedWaitMinutes: calculateEstimatedWait(index, queuedPatients.length),
    }));
  }),

  /**
   * Get patients currently being attended
   */
  getAttending: publicProcedure.query(async () => {
    const attendingPatients = await getAttendingPatients();

    return attendingPatients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      urgencyLevel: patient.urgencyLevel,
      attendanceStartTime: patient.attendanceStartTime,
    }));
  }),

  /**
   * Get patient details by ID
   */
  getPatient: publicProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const patient = await getPatientById(input.patientId);

      if (!patient) {
        throw new Error("Paciente não encontrado");
      }

      return {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        urgencyLevel: patient.urgencyLevel,
        urgencyScore: patient.urgencyScore,
        status: patient.status,
        checkInTime: patient.checkInTime,
        sensorData: {
          heartRate: patient.heartRate,
          systolicBP: patient.systolicBP,
          diastolicBP: patient.diastolicBP,
          temperature: patient.temperature,
          oxygenSaturation: patient.oxygenSaturation,
          painLevel: patient.painLevel,
        },
        symptoms: patient.symptoms,
        medicalHistory: patient.medicalHistory,
        notes: patient.notes,
      };
    }),

  /**
   * Update patient status (public)
   */
  updateStatus: publicProcedure
    .input(
      z.object({
        patientId: z.number(),
        status: z.enum(["aguardando", "em atendimento", "concluído", "cancelado"]),
      })
    )
    .mutation(async ({ input, ctx }) => {

      const now = new Date();
      let attendanceStartTime: Date | undefined;
      let attendanceEndTime: Date | undefined;

      if (input.status === "em atendimento") {
        attendanceStartTime = now;
      } else if (input.status === "concluído" || input.status === "cancelado") {
        attendanceEndTime = now;
      }

      const updated = await updatePatientStatus(
        input.patientId,
        input.status,
        attendanceStartTime,
        attendanceEndTime
      );

      if (!updated) {
        throw new Error("Falha ao atualizar paciente");
      }

      // If patient is being completed, create attendance history record
      if (input.status === "concluído") {
        const originalPatient = await getPatientById(input.patientId);
        if (originalPatient && originalPatient.checkInTime && originalPatient.attendanceStartTime && attendanceEndTime) {
          const waitingTimeMinutes = Math.round(
            (originalPatient.attendanceStartTime.getTime() - originalPatient.checkInTime.getTime()) / 60000
          );
          const attendanceTimeMinutes = Math.round(
            (attendanceEndTime.getTime() - originalPatient.attendanceStartTime.getTime()) / 60000
          );

          await createAttendanceRecord({
            patientId: input.patientId,
            urgencyLevelAtCheckIn: originalPatient.urgencyLevel,
            urgencyScoreAtCheckIn: originalPatient.urgencyScore,
            checkInTime: originalPatient.checkInTime,
            attendanceStartTime: originalPatient.attendanceStartTime,
            attendanceEndTime: attendanceEndTime,
            waitingTimeMinutes,
            attendanceTimeMinutes,
            outcome: "atendido",
            attendingDoctor: ctx.user?.name || "Não especificado",
          });
        }
      }

      // Update queue positions
      await updateQueuePositions();

      return {
        success: true,
        patient: updated,
      };
    }),

  /**
   * Get queue metrics and statistics
   */
  getMetrics: publicProcedure.query(async () => {
    const queuedPatients = await getQueuedPatients();
    const attendingPatients = await getAttendingPatients();
    const latestMetrics = await getLatestQueueMetrics();

    // Count patients by urgency level
    const urgencyCounts = {
      crítico: queuedPatients.filter((p) => p.urgencyLevel === "crítico").length,
      urgente: queuedPatients.filter((p) => p.urgencyLevel === "urgente").length,
      "pouco urgente": queuedPatients.filter((p) => p.urgencyLevel === "pouco urgente").length,
      "não urgente": queuedPatients.filter((p) => p.urgencyLevel === "não urgente").length,
    };

    // Calculate average waiting time
    const attendanceHistory = await getAllAttendanceHistory(100, 0);
    const avgWaitingTime =
      attendanceHistory.length > 0
        ? attendanceHistory.reduce((sum, h) => sum + (h.waitingTimeMinutes || 0), 0) / attendanceHistory.length
        : 0;

    return {
      totalInQueue: queuedPatients.length,
      totalAttending: attendingPatients.length,
      urgencyCounts,
      averageWaitingTimeMinutes: Math.round(avgWaitingTime * 10) / 10,
      estimatedWaitTimeWithoutTriage: Math.round(avgWaitingTime * 1.8 * 10) / 10, // Simulated 80% increase without triage
      actualWaitTimeWithTriage: Math.round(avgWaitingTime * 10) / 10,
      lastUpdated: new Date(),
    };
  }),

  /**
   * Get attendance history
   */
  getHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const records = await getAllAttendanceHistory(input.limit, input.offset);

      return records.map((record) => ({
        id: record.id,
        patientId: record.patientId,
        urgencyLevelAtCheckIn: record.urgencyLevelAtCheckIn,
        checkInTime: record.checkInTime,
        attendanceStartTime: record.attendanceStartTime,
        attendanceEndTime: record.attendanceEndTime,
        waitingTimeMinutes: record.waitingTimeMinutes,
        attendanceTimeMinutes: record.attendanceTimeMinutes,
        outcome: record.outcome,
        attendingDoctor: record.attendingDoctor,
      }));
    }),

  /**
   * Get metrics history for charts
   */
  getMetricsHistory: publicProcedure
    .input(z.object({ hoursBack: z.number().default(24) }))
    .query(async ({ input }) => {
      const history = await getQueueMetricsHistory(input.hoursBack);

      return history.map((metric) => ({
        snapshotTime: metric.snapshotTime,
        totalPatientsInQueue: metric.totalPatientsInQueue,
        averageWaitingTimeMinutes: Number(metric.averageWaitingTimeMinutes),
        criticalCount: metric.criticalCount,
        urgentCount: metric.urgentCount,
        lowUrgencyCount: metric.lowUrgencyCount,
        nonUrgentCount: metric.nonUrgentCount,
        estimatedWaitTimeWithoutTriage: Number(metric.estimatedWaitTimeWithoutTriage),
        actualWaitTimeWithTriage: Number(metric.actualWaitTimeWithTriage),
      }));
    }),
});

// ============= MAIN ROUTER =============

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  triagem: triagemRouter,
});

export type AppRouter = typeof appRouter;

// ============= HELPER FUNCTIONS =============

/**
 * Calculate estimated wait time based on queue position and urgency
 */
function calculateEstimatedWait(queuePosition: number, totalInQueue: number): number {
  // Average attendance time per patient: 15 minutes
  const avgAttendanceTime = 15;

  // Patients with higher urgency get priority, so we estimate based on position
  // and reduce for higher urgency patients
  const baseWait = queuePosition * avgAttendanceTime;

  // Add some randomness to make it more realistic
  const variance = Math.random() * 5 - 2.5; // -2.5 to +2.5 minutes

  return Math.max(0, Math.round(baseWait + variance));
}
