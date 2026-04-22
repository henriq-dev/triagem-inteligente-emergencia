import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with additional tables for triagem system.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "doctor", "triager"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Pacientes em triagem - dados de sensores IoT simulados
 */
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  // Dados pessoais
  name: varchar("name", { length: 255 }).notNull(),
  age: int("age").notNull(),
  gender: mysqlEnum("gender", ["M", "F", "O"]).notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(),
  
  // Dados de sensores IoT
  heartRate: int("heartRate").notNull(), // bpm
  systolicBP: int("systolicBP").notNull(), // mmHg
  diastolicBP: int("diastolicBP").notNull(), // mmHg
  temperature: decimal("temperature", { precision: 5, scale: 2 }).notNull(), // °C
  oxygenSaturation: int("oxygenSaturation").notNull(), // %
  painLevel: int("painLevel").notNull(), // 0-10
  
  // Classificação de urgência
  urgencyLevel: mysqlEnum("urgencyLevel", ["crítico", "urgente", "pouco urgente", "não urgente"]).notNull(),
  urgencyScore: int("urgencyScore").notNull(), // Score numérico para ordenação
  
  // Status na fila
  status: mysqlEnum("status", ["aguardando", "em atendimento", "concluído", "cancelado"]).default("aguardando").notNull(),
  queuePosition: int("queuePosition"), // Posição na fila
  
  // Timestamps
  checkInTime: timestamp("checkInTime").defaultNow().notNull(),
  attendanceStartTime: timestamp("attendanceStartTime"),
  attendanceEndTime: timestamp("attendanceEndTime"),
  
  // Informações adicionais
  symptoms: text("symptoms"), // Descrição de sintomas
  medicalHistory: text("medicalHistory"), // Histórico médico relevante
  notes: text("notes"), // Notas do triador
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

/**
 * Histórico de atendimentos - para análise de tempo de espera e métricas
 */
export const attendanceHistory = mysqlTable("attendanceHistory", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(), // Referência ao paciente
  
  // Dados de urgência no momento do check-in
  urgencyLevelAtCheckIn: mysqlEnum("urgencyLevelAtCheckIn", ["crítico", "urgente", "pouco urgente", "não urgente"]).notNull(),
  urgencyScoreAtCheckIn: int("urgencyScoreAtCheckIn").notNull(),
  
  // Tempos
  checkInTime: timestamp("checkInTime").notNull(),
  attendanceStartTime: timestamp("attendanceStartTime"),
  attendanceEndTime: timestamp("attendanceEndTime"),
  
  // Cálculos de tempo
  waitingTimeMinutes: int("waitingTimeMinutes"), // Tempo de espera em minutos
  attendanceTimeMinutes: int("attendanceTimeMinutes"), // Tempo de atendimento em minutos
  
  // Desfecho
  outcome: mysqlEnum("outcome", ["atendido", "encaminhado", "cancelado", "não compareceu"]).notNull(),
  
  // Dados do atendimento
  attendingDoctor: varchar("attendingDoctor", { length: 255 }),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AttendanceHistory = typeof attendanceHistory.$inferSelect;
export type InsertAttendanceHistory = typeof attendanceHistory.$inferInsert;

/**
 * Métricas de fila para gráficos comparativos
 * Armazena snapshots de métricas para análise histórica
 */
export const queueMetrics = mysqlTable("queueMetrics", {
  id: int("id").autoincrement().primaryKey(),
  
  // Timestamp do snapshot
  snapshotTime: timestamp("snapshotTime").defaultNow().notNull(),
  
  // Métricas gerais
  totalPatientsInQueue: int("totalPatientsInQueue").notNull(),
  averageWaitingTimeMinutes: decimal("averageWaitingTimeMinutes", { precision: 8, scale: 2 }).notNull(),
  
  // Distribuição por urgência
  criticalCount: int("criticalCount").notNull(),
  urgentCount: int("urgentCount").notNull(),
  lowUrgencyCount: int("lowUrgencyCount").notNull(),
  nonUrgentCount: int("nonUrgentCount").notNull(),
  
  // Métricas de redução (com vs sem triagem automatizada)
  estimatedWaitTimeWithoutTriage: decimal("estimatedWaitTimeWithoutTriage", { precision: 8, scale: 2 }).notNull(),
  actualWaitTimeWithTriage: decimal("actualWaitTimeWithTriage", { precision: 8, scale: 2 }).notNull(),
  
  // Eficiência
  patientsAttendedToday: int("patientsAttendedToday").notNull(),
  averageAttendanceTimeMinutes: decimal("averageAttendanceTimeMinutes", { precision: 8, scale: 2 }).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QueueMetrics = typeof queueMetrics.$inferSelect;
export type InsertQueueMetrics = typeof queueMetrics.$inferInsert;
