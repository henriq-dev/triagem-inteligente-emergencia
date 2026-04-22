/**
 * Algoritmo de cálculo de nível de urgência baseado em dados de sensores IoT
 * 
 * Classificações:
 * - Crítico: Situação de risco imediato de vida
 * - Urgente: Situação que requer atendimento rápido
 * - Pouco urgente: Situação que pode esperar, mas requer avaliação
 * - Não urgente: Situação que pode ser agendada
 */

export type UrgencyLevel = "crítico" | "urgente" | "pouco urgente" | "não urgente";

export interface SensorData {
  heartRate: number; // bpm
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  temperature: number; // °C
  oxygenSaturation: number; // %
  painLevel: number; // 0-10
}

export interface UrgencyResult {
  level: UrgencyLevel;
  score: number; // 0-100, higher = more urgent
  reasoning: string;
}

/**
 * Calculate urgency level based on sensor data
 * Returns a score from 0-100 where higher values indicate more urgent cases
 */
export function calculateUrgency(data: SensorData): UrgencyResult {
  let score = 0;
  const reasons: string[] = [];

  // ============= HEART RATE ANALYSIS =============
  // Normal: 60-100 bpm
  if (data.heartRate < 40 || data.heartRate > 140) {
    score += 35;
    reasons.push(`Frequência cardíaca crítica: ${data.heartRate} bpm`);
  } else if (data.heartRate < 50 || data.heartRate > 120) {
    score += 25;
    reasons.push(`Frequência cardíaca alterada: ${data.heartRate} bpm`);
  } else if (data.heartRate < 60 || data.heartRate > 100) {
    score += 12;
    reasons.push(`Frequência cardíaca ligeiramente alterada: ${data.heartRate} bpm`);
  }

  // ============= BLOOD PRESSURE ANALYSIS =============
  // Normal: < 120/80 mmHg
  // Elevated: 120-129/<80
  // Stage 1 Hypertension: 130-139/80-89
  // Stage 2 Hypertension: ≥140/≥90
  // Hypotension: <90/60
  
  const systolic = data.systolicBP;
  const diastolic = data.diastolicBP;

  if (systolic < 90 || diastolic < 60) {
    score += 30;
    reasons.push(`Hipotensão: ${systolic}/${diastolic} mmHg`);
  } else if (systolic >= 180 || diastolic >= 120) {
    score += 30;
    reasons.push(`Hipertensão crítica: ${systolic}/${diastolic} mmHg`);
  } else if (systolic >= 160 || diastolic >= 100) {
    score += 20;
    reasons.push(`Hipertensão grave: ${systolic}/${diastolic} mmHg`);
  } else if (systolic >= 140 || diastolic >= 90) {
    score += 12;
    reasons.push(`Hipertensão estágio 2: ${systolic}/${diastolic} mmHg`);
  }

  // ============= TEMPERATURE ANALYSIS =============
  // Normal: 36.5-37.5°C
  if (data.temperature < 35 || data.temperature > 39.5) {
    score += 30;
    reasons.push(`Temperatura crítica: ${data.temperature}°C`);
  } else if (data.temperature < 36 || data.temperature > 39) {
    score += 20;
    reasons.push(`Temperatura elevada/baixa: ${data.temperature}°C`);
  } else if (data.temperature < 36.5 || data.temperature > 38.5) {
    score += 10;
    reasons.push(`Temperatura ligeiramente alterada: ${data.temperature}°C`);
  }

  // ============= OXYGEN SATURATION ANALYSIS =============
  // Normal: ≥95%
  if (data.oxygenSaturation < 90) {
    score += 40;
    reasons.push(`Saturação de oxigênio crítica: ${data.oxygenSaturation}%`);
  } else if (data.oxygenSaturation < 94) {
    score += 30;
    reasons.push(`Saturação de oxigênio baixa: ${data.oxygenSaturation}%`);
  } else if (data.oxygenSaturation < 95) {
    score += 12;
    reasons.push(`Saturação de oxigênio ligeiramente baixa: ${data.oxygenSaturation}%`);
  }

  // ============= PAIN LEVEL ANALYSIS =============
  // 0-3: Mild
  // 4-6: Moderate
  // 7-9: Severe
  // 10: Extreme
  if (data.painLevel >= 10) {
    score += 25;
    reasons.push(`Dor extrema: ${data.painLevel}/10`);
  } else if (data.painLevel >= 8) {
    score += 20;
    reasons.push(`Dor severa: ${data.painLevel}/10`);
  } else if (data.painLevel >= 5) {
    score += 12;
    reasons.push(`Dor moderada: ${data.painLevel}/10`);
  } else if (data.painLevel >= 3) {
    score += 5;
    reasons.push(`Dor leve: ${data.painLevel}/10`);
  }

  // ============= COMPOSITE RISK ASSESSMENT =============
  // Check for multiple abnormalities (synergistic effect)
  let abnormalCount = 0;
  
  if (data.heartRate < 40 || data.heartRate > 140) abnormalCount++;
  if (systolic < 90 || diastolic < 60 || systolic >= 180 || diastolic >= 120) abnormalCount++;
  if (data.temperature < 35 || data.temperature > 39) abnormalCount++;
  if (data.oxygenSaturation < 94) abnormalCount++;
  if (data.painLevel >= 7) abnormalCount++;

  // Multiple critical abnormalities increase urgency significantly
  if (abnormalCount >= 3) {
    score += 20;
    reasons.push(`Múltiplas alterações críticas detectadas (${abnormalCount} parâmetros)`);
  } else if (abnormalCount === 2) {
    score += 12;
    reasons.push(`Duas alterações significativas detectadas`);
  }

  // Cap score at 100
  score = Math.min(100, score);

  // Determine urgency level based on score
  let level: UrgencyLevel;
  if (score >= 60) {
    level = "crítico";
  } else if (score >= 40) {
    level = "urgente";
  } else if (score >= 20) {
    level = "pouco urgente";
  } else {
    level = "não urgente";
  }

  return {
    level,
    score,
    reasoning: reasons.length > 0 ? reasons.join("; ") : "Parâmetros vitais normais",
  };
}

/**
 * Get color code for urgency level (for UI display)
 */
export function getUrgencyColor(level: UrgencyLevel): string {
  switch (level) {
    case "crítico":
      return "#ef4444"; // red
    case "urgente":
      return "#f97316"; // orange
    case "pouco urgente":
      return "#eab308"; // yellow
    case "não urgente":
      return "#22c55e"; // green
  }
}

/**
 * Get estimated wait time multiplier based on urgency
 * Used to calculate estimated wait time for each patient
 */
export function getWaitTimeMultiplier(level: UrgencyLevel): number {
  switch (level) {
    case "crítico":
      return 0.1; // Immediate
    case "urgente":
      return 0.5; // 50% of average wait time
    case "pouco urgente":
      return 1.0; // Average wait time
    case "não urgente":
      return 1.5; // 150% of average wait time
  }
}
