import { MedicalValidator } from '../medical.validator';

describe('MedicalValidator', () => {
  describe('isValidTemperature', () => {
    it('should accept normal temperature 36.5', () => {
      expect(MedicalValidator.isValidTemperature(36.5)).toBe(true);
    });
    it('should reject hypothermic temperature 32', () => {
      expect(MedicalValidator.isValidTemperature(32)).toBe(false);
    });
    it('should reject hyperthermic temperature 43', () => {
      expect(MedicalValidator.isValidTemperature(43)).toBe(false);
    });
    it('should accept boundary values 34 and 42', () => {
      expect(MedicalValidator.isValidTemperature(34)).toBe(true);
      expect(MedicalValidator.isValidTemperature(42)).toBe(true);
    });
  });

  describe('isValidHeartRate', () => {
    it('should accept normal heart rate 72', () => {
      expect(MedicalValidator.isValidHeartRate(72)).toBe(true);
    });
    it('should reject too low rate', () => {
      expect(MedicalValidator.isValidHeartRate(15)).toBe(false);
    });
    it('should reject too high rate', () => {
      expect(MedicalValidator.isValidHeartRate(290)).toBe(false);
    });
    it('should accept boundary values 20 and 280', () => {
      expect(MedicalValidator.isValidHeartRate(20)).toBe(true);
      expect(MedicalValidator.isValidHeartRate(280)).toBe(true);
    });
  });

  describe('isValidBloodPressure', () => {
    it('should accept normal BP 120/80', () => {
      expect(MedicalValidator.isValidBloodPressure(120, 80)).toBe(true);
    });
    it('should reject invalid systolic', () => {
      expect(MedicalValidator.isValidBloodPressure(45, 80)).toBe(false);
      expect(MedicalValidator.isValidBloodPressure(310, 80)).toBe(false);
    });
    it('should reject diastolic >= systolic', () => {
      expect(MedicalValidator.isValidBloodPressure(120, 130)).toBe(false);
    });
    it('should accept boundary systolic 60 and 280', () => {
      expect(MedicalValidator.isValidBloodPressure(60, 30)).toBe(true);
      expect(MedicalValidator.isValidBloodPressure(280, 160)).toBe(true);
    });
  });

  describe('isValidSpO2', () => {
    it('should accept normal SpO2 98', () => {
      expect(MedicalValidator.isValidSpO2(98)).toBe(true);
    });
    it('should reject too low SpO2', () => {
      expect(MedicalValidator.isValidSpO2(45)).toBe(false);
    });
    it('should reject too high SpO2', () => {
      expect(MedicalValidator.isValidSpO2(105)).toBe(false);
    });
    it('should accept boundary values 50 and 100', () => {
      expect(MedicalValidator.isValidSpO2(50)).toBe(true);
      expect(MedicalValidator.isValidSpO2(100)).toBe(true);
    });
  });

  describe('isValidBMI', () => {
    it('should calculate BMI correctly', () => {
      const bmi = MedicalValidator.isValidBMI(70, 175);
      expect(bmi).toBeCloseTo(22.9, 1);
    });
    it('should return null for invalid height', () => {
      expect(MedicalValidator.isValidBMI(70, 0)).toBeNull();
    });
    it('should return null for invalid weight', () => {
      expect(MedicalValidator.isValidBMI(0, 175)).toBeNull();
    });
  });

  describe('isValidGlasgow', () => {
    it('should accept normal glasgow 15', () => {
      expect(MedicalValidator.isValidGlasgow(15)).toBe(true);
    });
    it('should reject invalid scores', () => {
      expect(MedicalValidator.isValidGlasgow(2)).toBe(false);
      expect(MedicalValidator.isValidGlasgow(16)).toBe(false);
    });
  });

  describe('isValidRespiratoryRate', () => {
    it('should accept normal rate 16', () => {
      expect(MedicalValidator.isValidRespiratoryRate(16)).toBe(true);
    });
    it('should reject invalid rates', () => {
      expect(MedicalValidator.isValidRespiratoryRate(3)).toBe(false);
      expect(MedicalValidator.isValidRespiratoryRate(81)).toBe(false);
    });
  });

  describe('isValidESI', () => {
    it('should accept ESI levels 1-5', () => {
      expect(MedicalValidator.isValidESI(1)).toBe(true);
      expect(MedicalValidator.isValidESI(3)).toBe(true);
      expect(MedicalValidator.isValidESI(5)).toBe(true);
    });
    it('should reject invalid levels', () => {
      expect(MedicalValidator.isValidESI(0)).toBe(false);
      expect(MedicalValidator.isValidESI(6)).toBe(false);
    });
  });

  describe('checkCriticalValues', () => {
    it('should return empty array for normal vitals', () => {
      const alerts = MedicalValidator.checkCriticalValues({
        temperatura: 36.5,
        frecuenciaCardiaca: 72,
        presionSistolica: 120,
        presionDiastolica: 80,
        spo2: 98,
        frecuenciaRespiratoria: 16,
      });
      expect(alerts).toEqual([]);
    });

    it('should detect hypotension', () => {
      const alerts = MedicalValidator.checkCriticalValues({
        presionSistolica: 75,
        presionDiastolica: 50,
      });
      expect(
        alerts.some(
          (a) =>
            a.parameter === 'presionSistolica' && a.severity === 'CRITICAL',
        ),
      ).toBe(true);
    });

    it('should detect severe hypoxemia', () => {
      const alerts = MedicalValidator.checkCriticalValues({
        spo2: 82,
      });
      expect(
        alerts.some((a) => a.parameter === 'spo2' && a.severity === 'HIGH'),
      ).toBe(true);
    });

    it('should detect critical hypoxemia', () => {
      const alerts = MedicalValidator.checkCriticalValues({
        spo2: 75,
      });
      expect(
        alerts.some((a) => a.parameter === 'spo2' && a.severity === 'CRITICAL'),
      ).toBe(true);
    });

    it('should detect hyperpyrexia', () => {
      const alerts = MedicalValidator.checkCriticalValues({
        temperatura: 41.5,
      });
      expect(
        alerts.some(
          (a) => a.parameter === 'temperatura' && a.severity === 'CRITICAL',
        ),
      ).toBe(true);
    });

    it('should detect tachycardia', () => {
      const alerts = MedicalValidator.checkCriticalValues({
        frecuenciaCardiaca: 190,
      });
      expect(
        alerts.some(
          (a) =>
            a.parameter === 'frecuenciaCardiaca' && a.severity === 'CRITICAL',
        ),
      ).toBe(true);
    });
  });

  describe('calculateESIVerified', () => {
    it('should return false for invalid ESI level', () => {
      expect(MedicalValidator.calculateESIVerified(0, {})).toBe(false);
    });
    it('should return true for ESI-1 regardless of vitals', () => {
      expect(MedicalValidator.calculateESIVerified(1, {})).toBe(true);
    });
    it('should return false for ESI-2 when vitals do not match', () => {
      expect(
        MedicalValidator.calculateESIVerified(2, {
          spo2: 95,
          frecuenciaCardiaca: 80,
          frecuenciaRespiratoria: 16,
          presionSistolica: 120,
        }),
      ).toBe(false);
    });
    it('should return true for ESI-2 with low SpO2', () => {
      expect(MedicalValidator.calculateESIVerified(2, { spo2: 82 })).toBe(true);
    });
    it('should return true for ESI-2 with high heart rate', () => {
      expect(
        MedicalValidator.calculateESIVerified(2, { frecuenciaCardiaca: 190 }),
      ).toBe(true);
    });
    it('should return true for ESI-2 with low systolic', () => {
      expect(
        MedicalValidator.calculateESIVerified(2, { presionSistolica: 70 }),
      ).toBe(true);
    });
    it('should return false for ESI-4 with low SpO2', () => {
      expect(MedicalValidator.calculateESIVerified(4, { spo2: 85 })).toBe(
        false,
      );
    });
  });

  describe('classifyBloodPressure', () => {
    it('should classify normal BP', () => {
      expect(MedicalValidator.classifyBloodPressure(110, 70)).toBe('Normal');
    });
    it('should classify hypertensive crisis', () => {
      expect(MedicalValidator.classifyBloodPressure(180, 120)).toBe(
        'Crisis hipertensiva',
      );
    });
    it('should classify hypertension', () => {
      expect(MedicalValidator.classifyBloodPressure(150, 95)).toBe(
        'Hipertensión',
      );
    });
    it('should classify prehypertension', () => {
      expect(MedicalValidator.classifyBloodPressure(135, 85)).toBe(
        'Prehipertensión',
      );
    });
    it('should classify hypotension', () => {
      expect(MedicalValidator.classifyBloodPressure(85, 55)).toBe(
        'Hipotensión',
      );
    });
  });
});
