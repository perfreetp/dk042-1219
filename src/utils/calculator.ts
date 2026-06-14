import {
  Appliance,
  AVG_LIFESPAN_YEARS,
  CostAnalysisResult,
  EnergyComparison,
  NewApplianceCandidate,
  Reminder,
  ReminderType,
  USAGE_HOURS_MAP,
} from '@/types';

const ELECTRICITY_PRICE = 0.56;
const CO2_PER_KWH = 0.785;

export const calculateDailyHours = (
  frequency: Appliance['usageFrequency'],
  customHours?: number
): number => {
  if (customHours && customHours > 0) return customHours;
  return USAGE_HOURS_MAP[frequency] || 4;
};

export const calculateAnnualElectricityCost = (
  power: number,
  dailyHours: number
): number => {
  const dailyKWh = (power * dailyHours) / 1000;
  const annualKWh = dailyKWh * 365;
  return Math.round(annualKWh * ELECTRICITY_PRICE * 100) / 100;
};

export const calculateApplianceAge = (purchaseYear: number): number => {
  const currentYear = new Date().getFullYear();
  return currentYear - purchaseYear;
};

export const calculateRepairRisk = (appliance: Appliance): number => {
  const age = calculateApplianceAge(appliance.purchaseYear);
  const lifespan = AVG_LIFESPAN_YEARS[appliance.category] || 5;

  let risk = 0;

  const ageRatio = age / lifespan;
  if (ageRatio >= 1) risk += 40;
  else if (ageRatio >= 0.75) risk += 30;
  else if (ageRatio >= 0.5) risk += 20;
  else if (ageRatio >= 0.3) risk += 10;

  if (appliance.repairCount >= 5) risk += 25;
  else if (appliance.repairCount >= 3) risk += 18;
  else if (appliance.repairCount >= 2) risk += 12;
  else if (appliance.repairCount >= 1) risk += 6;

  if (appliance.currentFault) {
    if (appliance.currentFault.severity === 'severe') risk += 20;
    else if (appliance.currentFault.severity === 'moderate') risk += 12;
    else risk += 6;
  }

  if (appliance.totalRepairCost >= appliance.purchasePrice * 0.5) risk += 15;
  else if (appliance.totalRepairCost >= appliance.purchasePrice * 0.3) risk += 8;

  return Math.min(risk, 100);
};

export const getRiskLevel = (risk: number): 'low' | 'medium' | 'high' => {
  if (risk < 30) return 'low';
  if (risk < 60) return 'medium';
  return 'high';
};

export const analyzeCost = (
  appliance: Appliance,
  repairQuoteTotal: number,
  newCandidate: Partial<NewApplianceCandidate> = {}
): CostAnalysisResult => {
  const dailyHours = calculateDailyHours(
    appliance.usageFrequency,
    appliance.dailyUsageHours
  );
  const oldPower = appliance.power;
  const newPower = newCandidate.power || oldPower * 0.6;
  const newPrice = newCandidate.price || appliance.purchasePrice * 0.9;
  const subsidy = newCandidate.subsidyAmount || 0;
  const installation = newCandidate.installationFee || 0;

  const repairRisk = calculateRepairRisk(appliance);
  const riskLevel = getRiskLevel(repairRisk);

  const annualElectricityOld = calculateAnnualElectricityCost(oldPower, dailyHours);
  const annualElectricityNew = calculateAnnualElectricityCost(newPower, dailyHours);
  const annualSavings = Math.round((annualElectricityOld - annualElectricityNew) * 100) / 100;

  const riskPremiumMultiplier = 1 + repairRisk / 100;
  const repairTotalCost = Math.round(repairQuoteTotal * riskPremiumMultiplier * 100) / 100;
  const replaceTotalCost = Math.round((newPrice - subsidy + installation) * 100) / 100;

  const netDifference = replaceTotalCost - repairTotalCost;
  const paybackYears =
    annualSavings > 0 ? Math.round((netDifference / annualSavings) * 10) / 10 : 99;

  let recommendation: CostAnalysisResult['recommendation'] = 'maintain';
  let reasoning = '';

  const age = calculateApplianceAge(appliance.purchaseYear);
  const lifespan = AVG_LIFESPAN_YEARS[appliance.category] || 5;

  if (riskLevel === 'high' || age >= lifespan || appliance.repairCount >= 5) {
    recommendation = 'replace';
    reasoning = `设备已使用 ${age} 年（平均寿命 ${lifespan} 年），维修风险 ${repairRisk}%，建议更换新机。`;
  } else if (
    repairQuoteTotal >= appliance.purchasePrice * 0.5 ||
    repairRisk >= 50
  ) {
    recommendation = 'replace';
    reasoning = `维修费用较高（${repairQuoteTotal}元），已超过购买价的50%，更换更经济。`;
  } else if (
    repairQuoteTotal <= appliance.purchasePrice * 0.15 &&
    riskLevel === 'low'
  ) {
    recommendation = 'repair';
    reasoning = `维修费用较低（${repairQuoteTotal}元），设备状态良好，建议维修。`;
  } else if (paybackYears <= 3 && annualSavings >= 200) {
    recommendation = 'replace';
    reasoning = `预计 ${paybackYears} 年可通过电费节省（每年${annualSavings}元）回收换新成本，建议更换。`;
  } else if (repairQuoteTotal <= appliance.purchasePrice * 0.3) {
    recommendation = 'repair';
    reasoning = `维修费用合理（${repairQuoteTotal}元），维修后可继续使用。`;
  } else {
    recommendation = 'maintain';
    reasoning = `继续观察使用，定期保养，如故障频发再考虑更换。`;
  }

  return {
    repairTotalCost,
    replaceTotalCost,
    repairRisk,
    repairRiskLevel: riskLevel,
    annualElectricityOld,
    annualElectricityNew,
    annualSavings,
    paybackYears,
    recommendation,
    reasoning,
  };
};

export const compareEnergy = (
  appliance: Appliance,
  newPower: number
): EnergyComparison => {
  const dailyHours = calculateDailyHours(
    appliance.usageFrequency,
    appliance.dailyUsageHours
  );
  const oldDailyKWh = (appliance.power * dailyHours) / 1000;
  const newDailyKWh = (newPower * dailyHours) / 1000;

  const oldAnnualKWh = oldDailyKWh * 365;
  const newAnnualKWh = newDailyKWh * 365;

  return {
    applianceId: appliance.id,
    applianceName: appliance.name,
    oldPower: appliance.power,
    newPower,
    oldDailyKWh: Math.round(oldDailyKWh * 100) / 100,
    newDailyKWh: Math.round(newDailyKWh * 100) / 100,
    oldMonthlyCost: Math.round(oldAnnualKWh * ELECTRICITY_PRICE / 12 * 100) / 100,
    newMonthlyCost: Math.round(newAnnualKWh * ELECTRICITY_PRICE / 12 * 100) / 100,
    oldAnnualCost: Math.round(oldAnnualKWh * ELECTRICITY_PRICE * 100) / 100,
    newAnnualCost: Math.round(newAnnualKWh * ELECTRICITY_PRICE * 100) / 100,
    annualSavings: Math.round((oldAnnualKWh - newAnnualKWh) * ELECTRICITY_PRICE * 100) / 100,
    co2ReductionKg: Math.round((oldAnnualKWh - newAnnualKWh) * CO2_PER_KWH * 100) / 100,
  };
};

export const generateReminders = (appliances: Appliance[]): Reminder[] => {
  const reminders: Reminder[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  appliances.forEach((appliance) => {
    const age = calculateApplianceAge(appliance.purchaseYear);
    const lifespan = AVG_LIFESPAN_YEARS[appliance.category] || 5;
    const ageRatio = age / lifespan;

    if (appliance.warrantyEndDate) {
      const warrantyEnd = new Date(appliance.warrantyEndDate);
      const diffDays = Math.ceil(
        (warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays > 0 && diffDays <= 90) {
        reminders.push({
          id: `warranty-${appliance.id}`,
          type: 'warranty' as ReminderType,
          title: '保修即将到期',
          description: `${appliance.name} 的保修将在 ${diffDays} 天后到期，请提前检查设备状态。`,
          applianceId: appliance.id,
          applianceName: appliance.name,
          date: appliance.warrantyEndDate,
          severity: diffDays <= 30 ? 'warning' : 'info',
          isRead: false,
          enabled: true,
        });
      } else if (diffDays <= 0) {
        reminders.push({
          id: `warranty-${appliance.id}`,
          type: 'warranty' as ReminderType,
          title: '保修已过期',
          description: `${appliance.name} 的保修已于 ${appliance.warrantyEndDate} 到期，后续维修需自费。`,
          applianceId: appliance.id,
          applianceName: appliance.name,
          date: appliance.warrantyEndDate,
          severity: 'danger',
          isRead: false,
          enabled: true,
        });
      }
    }

    if (ageRatio >= 0.8) {
      reminders.push({
        id: `repair-${appliance.id}`,
        type: 'repair' as ReminderType,
        title: '设备接近寿命末期',
        description: `${appliance.name} 已使用 ${age} 年（平均寿命 ${lifespan} 年），故障率上升，建议考虑换新。`,
        applianceId: appliance.id,
        applianceName: appliance.name,
        date: `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        severity: ageRatio >= 1 ? 'danger' : 'warning',
        isRead: false,
        enabled: true,
      });
    }

    const dailyHours = calculateDailyHours(
      appliance.usageFrequency,
      appliance.dailyUsageHours
    );
    const annualCost = calculateAnnualElectricityCost(appliance.power, dailyHours);
    if (annualCost >= 800) {
      reminders.push({
        id: `energy-${appliance.id}`,
        type: 'energy' as ReminderType,
        title: '能耗偏高提醒',
        description: `${appliance.name} 年电费约 ${annualCost} 元，建议更换能效等级更高的新机以节省开支。`,
        applianceId: appliance.id,
        applianceName: appliance.name,
        date: `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        severity: annualCost >= 1200 ? 'danger' : 'warning',
        isRead: false,
        enabled: true,
      });
    }

    if (appliance.totalRepairCost >= appliance.purchasePrice * 0.4) {
      reminders.push({
        id: `repaircost-${appliance.id}`,
        type: 'repair' as ReminderType,
        title: '累计维修费用过高',
        description: `${appliance.name} 累计维修费已达 ${appliance.totalRepairCost} 元，建议综合评估换新方案。`,
        applianceId: appliance.id,
        applianceName: appliance.name,
        date: appliance.lastRepairDate,
        severity: 'danger',
        isRead: false,
        enabled: true,
      });
    }
  });

  return reminders.sort((a, b) => {
    const severityOrder = { danger: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};
