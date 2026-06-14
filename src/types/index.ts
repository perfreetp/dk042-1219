export type ApplianceCategory =
  | '冰箱'
  | '空调'
  | '洗衣机'
  | '电视'
  | '热水器'
  | '油烟机'
  | '微波炉'
  | '其他';

export type UsageFrequency = 'low' | 'medium' | 'high' | 'veryHigh';

export type DecisionType = 'repair' | 'maintain' | 'replace';

export interface FaultInfo {
  description: string;
  date: string;
  severity: 'minor' | 'moderate' | 'severe';
}

export interface Appliance {
  id: string;
  name: string;
  category: ApplianceCategory;
  brand: string;
  model: string;
  purchaseYear: number;
  purchasePrice: number;
  power: number;
  usageFrequency: UsageFrequency;
  dailyUsageHours: number;
  repairCount: number;
  totalRepairCost: number;
  lastRepairDate: string;
  warrantyEndDate: string;
  currentFault?: FaultInfo;
  maintenanceRecord: string[];
  createdAt: string;
}

export interface RepairQuote {
  id: string;
  applianceId: string;
  serviceType: string;
  partsCost: number;
  laborCost: number;
  warrantyMonths: number;
  provider: string;
}

export interface NewApplianceCandidate {
  id: string;
  name: string;
  category: ApplianceCategory;
  brand: string;
  model: string;
  price: number;
  power: number;
  energyRating: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  recyclingChannel: string;
  subsidyAmount: number;
  subsidyCondition: string;
  deliveryRestriction: string;
  installationFee: number;
  warrantyYears: number;
  isFavorite: boolean;
  compareTargetId?: string;
}

export interface CostAnalysisResult {
  repairTotalCost: number;
  replaceTotalCost: number;
  repairRisk: number;
  repairRiskLevel: 'low' | 'medium' | 'high';
  annualElectricityOld: number;
  annualElectricityNew: number;
  annualSavings: number;
  paybackYears: number;
  recommendation: DecisionType;
  reasoning: string;
}

export interface EnergyComparison {
  applianceId: string;
  applianceName: string;
  oldPower: number;
  newPower: number;
  oldDailyKWh: number;
  newDailyKWh: number;
  oldMonthlyCost: number;
  newMonthlyCost: number;
  oldAnnualCost: number;
  newAnnualCost: number;
  annualSavings: number;
  co2ReductionKg: number;
}

export type ReminderType = 'warranty' | 'energy' | 'repair' | 'maintenance';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  applianceId?: string;
  applianceName?: string;
  date: string;
  severity: 'info' | 'warning' | 'danger';
  isRead: boolean;
  enabled: boolean;
}

export const USAGE_HOURS_MAP: Record<UsageFrequency, number> = {
  low: 2,
  medium: 4,
  high: 8,
  veryHigh: 16,
};

export const FREQUENCY_LABEL: Record<UsageFrequency, string> = {
  low: '低频使用',
  medium: '中度使用',
  high: '高频使用',
  veryHigh: '持续使用',
};

export const CATEGORY_LIST: ApplianceCategory[] = [
  '冰箱',
  '空调',
  '洗衣机',
  '电视',
  '热水器',
  '油烟机',
  '微波炉',
  '其他',
];

export const AVG_LIFESPAN_YEARS: Record<ApplianceCategory, number> = {
  冰箱: 12,
  空调: 10,
  洗衣机: 8,
  电视: 7,
  热水器: 8,
  油烟机: 7,
  微波炉: 6,
  其他: 5,
};
