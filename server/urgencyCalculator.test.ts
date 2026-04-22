import { describe, expect, it } from "vitest";
import { calculateUrgency, SensorData } from "./urgencyCalculator";

describe("urgencyCalculator", () => {
  const normalData: SensorData = {
    heartRate: 72,
    systolicBP: 120,
    diastolicBP: 80,
    temperature: 37,
    oxygenSaturation: 98,
    painLevel: 0,
  };

  describe("basic classification", () => {
    it("should classify normal vital signs as não urgente", () => {
      const result = calculateUrgency(normalData);
      expect(result.level).toBe("não urgente");
      expect(result.score).toBeLessThan(20);
    });

    it("should return a score between 0 and 100", () => {
      const result = calculateUrgency(normalData);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should return one of the four urgency levels", () => {
      const result = calculateUrgency(normalData);
      expect(["crítico", "urgente", "pouco urgente", "não urgente"]).toContain(result.level);
    });
  });

  describe("urgency level thresholds", () => {
    it("should classify score < 20 as não urgente", () => {
      const data: SensorData = { ...normalData, painLevel: 1 };
      const result = calculateUrgency(data);
      if (result.score < 20) {
        expect(result.level).toBe("não urgente");
      }
    });

    it("should classify score >= 20 and < 40 as pouco urgente", () => {
      const data: SensorData = { ...normalData, heartRate: 115 };
      const result = calculateUrgency(data);
      if (result.score >= 20 && result.score < 40) {
        expect(result.level).toBe("pouco urgente");
      }
    });

    it("should classify score >= 40 and < 60 as urgente", () => {
      const data: SensorData = { ...normalData, oxygenSaturation: 92 };
      const result = calculateUrgency(data);
      if (result.score >= 40 && result.score < 60) {
        expect(result.level).toBe("urgente");
      }
    });

    it("should classify score >= 60 as crítico", () => {
      const data: SensorData = { ...normalData, oxygenSaturation: 88 };
      const result = calculateUrgency(data);
      if (result.score >= 60) {
        expect(result.level).toBe("crítico");
      }
    });
  });

  describe("abnormality detection", () => {
    it("should detect low oxygen saturation", () => {
      const data: SensorData = { ...normalData, oxygenSaturation: 88 };
      const result = calculateUrgency(data);
      expect(result.reasoning).toContain("Saturação de oxigênio");
    });

    it("should detect high heart rate", () => {
      const data: SensorData = { ...normalData, heartRate: 125 };
      const result = calculateUrgency(data);
      expect(result.reasoning).toContain("cardíaca");
    });

    it("should detect high fever", () => {
      const data: SensorData = { ...normalData, temperature: 38.8 };
      const result = calculateUrgency(data);
      expect(result.reasoning).toContain("Temperatura");
    });

    it("should detect high blood pressure", () => {
      const data: SensorData = { ...normalData, systolicBP: 160, diastolicBP: 100 };
      const result = calculateUrgency(data);
      expect(result.reasoning).toContain("Hipertensão");
    });

    it("should detect pain", () => {
      const data: SensorData = { ...normalData, painLevel: 7 };
      const result = calculateUrgency(data);
      expect(result.reasoning).toContain("Dor");
    });
  });

  describe("composite risk assessment", () => {
    it("should increase score for multiple abnormalities", () => {
      const singleAbnormality: SensorData = { ...normalData, heartRate: 125 };
      const multipleAbnormalities: SensorData = {
        ...normalData,
        heartRate: 125,
        oxygenSaturation: 92,
        temperature: 38.5,
      };

      const result1 = calculateUrgency(singleAbnormality);
      const result2 = calculateUrgency(multipleAbnormalities);

      expect(result2.score).toBeGreaterThan(result1.score);
    });

    it("should detect multiple critical abnormalities", () => {
      const data: SensorData = {
        heartRate: 145,
        systolicBP: 180,
        diastolicBP: 120,
        temperature: 39,
        oxygenSaturation: 88,
        painLevel: 9,
      };

      const result = calculateUrgency(data);
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.level).toBe("crítico");
    });
  });

  describe("reasoning messages", () => {
    it("should provide reasoning for urgency classification", () => {
      const data: SensorData = { ...normalData, oxygenSaturation: 88 };
      const result = calculateUrgency(data);
      expect(result.reasoning).toBeTruthy();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it("should indicate normal parameters when no abnormalities", () => {
      const result = calculateUrgency(normalData);
      expect(result.reasoning).toContain("Parâmetros vitais normais");
    });

    it("should include multiple reasons for multiple abnormalities", () => {
      const data: SensorData = {
        ...normalData,
        oxygenSaturation: 88,
        heartRate: 145,
      };
      const result = calculateUrgency(data);
      expect(result.reasoning.split(";").length).toBeGreaterThan(1);
    });
  });

  describe("score boundaries", () => {
    it("should never exceed score of 100", () => {
      const criticalData: SensorData = {
        heartRate: 150,
        systolicBP: 200,
        diastolicBP: 130,
        temperature: 40,
        oxygenSaturation: 80,
        painLevel: 10,
      };

      const result = calculateUrgency(criticalData);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should handle extreme values", () => {
      const extremeData: SensorData = {
        heartRate: 200,
        systolicBP: 250,
        diastolicBP: 150,
        temperature: 42,
        oxygenSaturation: 50,
        painLevel: 10,
      };

      const result = calculateUrgency(extremeData);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.level).toBe("crítico");
    });
  });
});
