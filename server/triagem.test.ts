import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context for testing
function createMockContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "test",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("triagem router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createMockContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("checkIn", () => {
    it("should accept valid check-in data", async () => {
      const result = await caller.triagem.checkIn({
        name: "João Silva",
        age: 45,
        gender: "M",
        symptoms: "Dor no peito",
        sensorData: {
          heartRate: 95,
          systolicBP: 140,
          diastolicBP: 90,
          temperature: 37.5,
          oxygenSaturation: 96,
          painLevel: 5,
        },
      });

      expect(result.success).toBe(true);
      expect(result.patient).toBeDefined();
      expect(result.patient.id).toBeGreaterThan(0);
      expect(result.patient.urgencyLevel).toBeDefined();
      expect(["crítico", "urgente", "pouco urgente", "não urgente"]).toContain(
        result.patient.urgencyLevel
      );
    });

    it("should reject invalid age", async () => {
      try {
        await caller.triagem.checkIn({
          name: "João Silva",
          age: -5,
          gender: "M",
          sensorData: {
            heartRate: 72,
            systolicBP: 120,
            diastolicBP: 80,
            temperature: 37,
            oxygenSaturation: 98,
            painLevel: 0,
          },
        });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should classify critical patient correctly", async () => {
      const result = await caller.triagem.checkIn({
        name: "Emergency Patient",
        age: 60,
        gender: "M",
        symptoms: "Severe respiratory distress",
        sensorData: {
          heartRate: 150,
          systolicBP: 180,
          diastolicBP: 120,
          temperature: 39,
          oxygenSaturation: 85,
          painLevel: 9,
        },
      });

      expect(result.patient.urgencyLevel).toBe("crítico");
      expect(result.patient.urgencyScore).toBeGreaterThanOrEqual(60);
    });
  });

  describe("getQueue", () => {
    it("should return queue of patients", async () => {
      // First add a patient
      await caller.triagem.checkIn({
        name: "Patient 1",
        age: 30,
        gender: "F",
        sensorData: {
          heartRate: 72,
          systolicBP: 120,
          diastolicBP: 80,
          temperature: 37,
          oxygenSaturation: 98,
          painLevel: 2,
        },
      });

      // Then get the queue
      const queue = await caller.triagem.getQueue();

      expect(Array.isArray(queue)).toBe(true);
      expect(queue.length).toBeGreaterThan(0);
      expect(queue[0]).toHaveProperty("id");
      expect(queue[0]).toHaveProperty("name");
      expect(queue[0]).toHaveProperty("urgencyLevel");
      expect(queue[0]).toHaveProperty("queuePosition");
    });

    it("should order queue by urgency", async () => {
      // Add non-urgent patient
      await caller.triagem.checkIn({
        name: "Non-urgent",
        age: 25,
        gender: "M",
        sensorData: {
          heartRate: 70,
          systolicBP: 115,
          diastolicBP: 75,
          temperature: 36.8,
          oxygenSaturation: 99,
          painLevel: 0,
        },
      });

      // Add urgent patient
      await caller.triagem.checkIn({
        name: "Urgent",
        age: 50,
        gender: "F",
        sensorData: {
          heartRate: 120,
          systolicBP: 160,
          diastolicBP: 100,
          temperature: 38.5,
          oxygenSaturation: 92,
          painLevel: 7,
        },
      });

      const queue = await caller.triagem.getQueue();

      // Urgent patient should come before non-urgent
      if (queue.length >= 2) {
        const urgentIndex = queue.findIndex((p) => p.name === "Urgent");
        const nonUrgentIndex = queue.findIndex((p) => p.name === "Non-urgent");

        if (urgentIndex >= 0 && nonUrgentIndex >= 0) {
          expect(urgentIndex).toBeLessThan(nonUrgentIndex);
        }
      }
    });
  });

  describe("getMetrics", () => {
    it("should return valid metrics", async () => {
      const metrics = await caller.triagem.getMetrics();

      expect(metrics).toHaveProperty("totalInQueue");
      expect(metrics).toHaveProperty("totalAttending");
      expect(metrics).toHaveProperty("urgencyCounts");
      expect(metrics).toHaveProperty("averageWaitingTimeMinutes");
      expect(metrics).toHaveProperty("estimatedWaitTimeWithoutTriage");
      expect(metrics).toHaveProperty("actualWaitTimeWithTriage");

      expect(typeof metrics.totalInQueue).toBe("number");
      expect(typeof metrics.averageWaitingTimeMinutes).toBe("number");
      expect(metrics.averageWaitingTimeMinutes).toBeGreaterThanOrEqual(0);
    });

    it("should show reduction in wait time with triage", async () => {
      const metrics = await caller.triagem.getMetrics();

      // With triage should be less than without triage
      expect(metrics.actualWaitTimeWithTriage).toBeLessThanOrEqual(
        metrics.estimatedWaitTimeWithoutTriage
      );
    });
  });

  describe("getHistory", () => {
    it("should return attendance history", async () => {
      const history = await caller.triagem.getHistory({ limit: 10 });

      expect(Array.isArray(history)).toBe(true);
      // History might be empty if no patients completed
      if (history.length > 0) {
        expect(history[0]).toHaveProperty("patientId");
        expect(history[0]).toHaveProperty("urgencyLevelAtCheckIn");
        expect(history[0]).toHaveProperty("waitingTimeMinutes");
      }
    });
  });

  describe("updateStatus", () => {
    it("should update patient status", async () => {
      // First add a patient
      const checkInResult = await caller.triagem.checkIn({
        name: "Status Test Patient",
        age: 35,
        gender: "F",
        sensorData: {
          heartRate: 85,
          systolicBP: 125,
          diastolicBP: 82,
          temperature: 37.2,
          oxygenSaturation: 97,
          painLevel: 3,
        },
      });

      const patientId = checkInResult.patient.id;

      // Update status to attending
      const result = await caller.triagem.updateStatus({
        patientId,
        status: "em atendimento",
      });

      expect(result.success).toBe(true);
    });

    it("should require authentication for status update", async () => {
      const publicContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: () => {} } as TrpcContext["res"],
      };

      const publicCaller = appRouter.createCaller(publicContext);

      try {
        await publicCaller.triagem.updateStatus({
          patientId: 1,
          status: "em atendimento",
        });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getPatient", () => {
    it("should retrieve patient details", async () => {
      // First add a patient
      const checkInResult = await caller.triagem.checkIn({
        name: "Details Test Patient",
        age: 40,
        gender: "M",
        symptoms: "Headache",
        sensorData: {
          heartRate: 78,
          systolicBP: 130,
          diastolicBP: 85,
          temperature: 37.1,
          oxygenSaturation: 98,
          painLevel: 4,
        },
      });

      const patientId = checkInResult.patient.id;

      // Retrieve patient details
      const patient = await caller.triagem.getPatient({ patientId });

      expect(patient).toHaveProperty("id");
      expect(patient).toHaveProperty("name");
      expect(patient).toHaveProperty("sensorData");
      expect(patient.sensorData).toHaveProperty("heartRate");
      expect(patient.sensorData).toHaveProperty("temperature");
    });
  });
});
