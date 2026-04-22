import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, Patient, InsertPatient, patients, AttendanceHistory, InsertAttendanceHistory, attendanceHistory, QueueMetrics, InsertQueueMetrics, queueMetrics } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER OPERATIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= PATIENT OPERATIONS =============

export async function createPatient(data: InsertPatient): Promise<Patient> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(patients).values(data);
  const patientId = result[0].insertId;
  
  const created = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  if (!created.length) {
    throw new Error("Failed to create patient");
  }
  
  return created[0];
}

export async function getPatientById(id: number): Promise<Patient | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all patients in queue, ordered by urgency score (descending) and check-in time (ascending)
 */
export async function getQueuedPatients(): Promise<Patient[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(patients)
    .where(eq(patients.status, "aguardando"))
    .orderBy(desc(patients.urgencyScore), patients.checkInTime);
}

/**
 * Get patients currently being attended
 */
export async function getAttendingPatients(): Promise<Patient[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(patients)
    .where(eq(patients.status, "em atendimento"))
    .orderBy(patients.attendanceStartTime);
}

/**
 * Update patient status and optionally attendance times
 */
export async function updatePatientStatus(
  id: number,
  status: "aguardando" | "em atendimento" | "concluído" | "cancelado",
  attendanceStartTime?: Date,
  attendanceEndTime?: Date
): Promise<Patient | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updates: any = { status };
  if (attendanceStartTime) updates.attendanceStartTime = attendanceStartTime;
  if (attendanceEndTime) updates.attendanceEndTime = attendanceEndTime;

  await db.update(patients).set(updates).where(eq(patients.id, id));

  return getPatientById(id);
}

/**
 * Update queue positions for all waiting patients
 */
export async function updateQueuePositions(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const queuedPatients = await getQueuedPatients();
  
  for (let i = 0; i < queuedPatients.length; i++) {
    await db
      .update(patients)
      .set({ queuePosition: i + 1 })
      .where(eq(patients.id, queuedPatients[i].id));
  }
}

// ============= ATTENDANCE HISTORY OPERATIONS =============

export async function createAttendanceRecord(data: InsertAttendanceHistory): Promise<AttendanceHistory> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(attendanceHistory).values(data);
  const recordId = result[0].insertId;
  
  const created = await db.select().from(attendanceHistory).where(eq(attendanceHistory.id, recordId)).limit(1);
  if (!created.length) {
    throw new Error("Failed to create attendance record");
  }
  
  return created[0];
}

/**
 * Get attendance history for a specific patient
 */
export async function getPatientAttendanceHistory(patientId: number): Promise<AttendanceHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(attendanceHistory)
    .where(eq(attendanceHistory.patientId, patientId))
    .orderBy(desc(attendanceHistory.checkInTime));
}

/**
 * Get all attendance records (for history page)
 */
export async function getAllAttendanceHistory(limit: number = 100, offset: number = 0): Promise<AttendanceHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(attendanceHistory)
    .orderBy(desc(attendanceHistory.checkInTime))
    .limit(limit)
    .offset(offset);
}

// ============= QUEUE METRICS OPERATIONS =============

export async function createQueueMetrics(data: InsertQueueMetrics): Promise<QueueMetrics> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(queueMetrics).values(data);
  const metricsId = result[0].insertId;
  
  const created = await db.select().from(queueMetrics).where(eq(queueMetrics.id, metricsId)).limit(1);
  if (!created.length) {
    throw new Error("Failed to create queue metrics");
  }
  
  return created[0];
}

/**
 * Get the latest queue metrics snapshot
 */
export async function getLatestQueueMetrics(): Promise<QueueMetrics | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(queueMetrics)
    .orderBy(desc(queueMetrics.snapshotTime))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get queue metrics for the last N hours
 */
export async function getQueueMetricsHistory(hoursBack: number = 24): Promise<QueueMetrics[]> {
  const db = await getDb();
  if (!db) return [];

  const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  return db
    .select()
    .from(queueMetrics)
    .where(gte(queueMetrics.snapshotTime, startTime))
    .orderBy(queueMetrics.snapshotTime);
}
