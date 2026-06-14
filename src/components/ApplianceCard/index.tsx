import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Appliance, FREQUENCY_LABEL } from '@/types';
import {
  calculateApplianceAge,
  calculateRepairRisk,
  formatCurrency,
  getRiskLevel,
  analyzeCost,
} from '@/utils/calculator';
import DecisionBadge from '@/components/DecisionBadge';
import styles from './index.module.scss';

interface ApplianceCardProps {
  appliance: Appliance;
  selected?: boolean;
  onClick?: () => void;
  showDecision?: boolean;
}

const categoryEmoji: Record<string, string> = {
  冰箱: '🧊',
  空调: '❄️',
  洗衣机: '🧺',
  电视: '📺',
  热水器: '🚿',
  油烟机: '💨',
  微波炉: '🍳',
  其他: '🔌',
};

const ApplianceCard: React.FC<ApplianceCardProps> = ({
  appliance,
  selected,
  onClick,
  showDecision = false,
}) => {
  const age = calculateApplianceAge(appliance.purchaseYear);
  const risk = calculateRepairRisk(appliance);
  const riskLevel = getRiskLevel(risk);
  const estimatedRepairCost = appliance.purchasePrice * 0.15;

  const decision = showDecision
    ? analyzeCost(appliance, estimatedRepairCost).recommendation
    : null;

  return (
    <View
      className={classnames(
        styles.card,
        selected && styles.selected,
        onClick && styles.clickable
      )}
      onClick={onClick}
    >
      <View className={styles.header}>
        <View className={styles.iconBox}>
          <Text className={styles.icon}>{categoryEmoji[appliance.category] || '🔌'}</Text>
        </View>
        <View className={styles.headerInfo}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{appliance.name}</Text>
            {decision && <DecisionBadge decision={decision} size="sm" />}
          </View>
          <Text className={styles.model}>
            {appliance.brand} · {appliance.model}
          </Text>
        </View>
      </View>

      <View className={styles.stats}>
        <View className={styles.stat}>
          <Text className={styles.statValue}>{age}</Text>
          <Text className={styles.statLabel}>使用年限</Text>
        </View>
        <View className={styles.stat}>
          <Text className={styles.statValue}>{appliance.power}</Text>
          <Text className={styles.statLabel}>功率W</Text>
        </View>
        <View className={styles.stat}>
          <Text className={styles.statValue}>{appliance.repairCount}</Text>
          <Text className={styles.statLabel}>维修次数</Text>
        </View>
        <View className={styles.stat}>
          <Text
            className={classnames(
              styles.statValue,
              styles[`risk${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}`]
            )}
          >
            {risk}%
          </Text>
          <Text className={styles.statLabel}>故障风险</Text>
        </View>
      </View>

      <View className={styles.tags}>
        <View className={classnames(styles.tag, styles.categoryTag)}>
          {appliance.category}
        </View>
        <View className={styles.tag}>
          {FREQUENCY_LABEL[appliance.usageFrequency]}
        </View>
        {appliance.totalRepairCost > 0 && (
          <View className={classnames(styles.tag, styles.costTag)}>
            累计维修{formatCurrency(appliance.totalRepairCost)}
          </View>
        )}
        {appliance.currentFault && (
          <View className={classnames(styles.tag, styles.faultTag)}>
            ⚠️ 当前故障
          </View>
        )}
      </View>
    </View>
  );
};

export default ApplianceCard;
