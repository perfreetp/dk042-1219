import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { useApplianceStore } from '@/store/appliance';
import { compareEnergy, calculateDailyHours, formatCurrency } from '@/utils/calculator';
import { EnergyComparison } from '@/types';
import styles from './index.module.scss';

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

type ViewMode = 'annual' | 'monthly' | 'daily';

const EnergyPage: React.FC = () => {
  const { appliances, candidates, selectedApplianceId, setSelectedAppliance, initStore } =
    useApplianceStore();
  const [viewMode, setViewMode] = useState<ViewMode>('annual');

  React.useEffect(() => {
    initStore();
  }, [initStore]);

  const selectedAppliance = useMemo(
    () => appliances.find((a) => a.id === selectedApplianceId) || appliances[0],
    [appliances, selectedApplianceId]
  );

  const selectedCandidate = useMemo(() => {
    if (!selectedAppliance) return null;
    return (
      candidates.find((c) => c.compareTargetId === selectedAppliance.id && c.isFavorite) ||
      candidates.find((c) => c.compareTargetId === selectedAppliance.id)
    );
  }, [candidates, selectedAppliance]);

  const comparison: EnergyComparison | null = useMemo(() => {
    if (!selectedAppliance) return null;
    const newPower = selectedCandidate?.power || Math.round(selectedAppliance.power * 0.6);
    return compareEnergy(selectedAppliance, newPower);
  }, [selectedAppliance, selectedCandidate]);

  const allComparisons = useMemo(() => {
    return appliances
      .map((app) => {
        const cand =
          candidates.find((c) => c.compareTargetId === app.id && c.isFavorite) ||
          candidates.find((c) => c.compareTargetId === app.id);
        const newPower = cand?.power || Math.round(app.power * 0.6);
        return compareEnergy(app, newPower);
      })
      .sort((a, b) => b.annualSavings - a.annualSavings);
  }, [appliances, candidates]);

  const totalSavings = useMemo(
    () => allComparisons.reduce((sum, c) => sum + c.annualSavings, 0),
    [allComparisons]
  );
  const totalCO2 = useMemo(
    () => allComparisons.reduce((sum, c) => sum + c.co2ReductionKg, 0),
    [allComparisons]
  );

  const getCostValues = (c: EnergyComparison, mode: ViewMode) => {
    if (mode === 'annual') return { old: c.oldAnnualCost, new: c.newAnnualCost };
    if (mode === 'monthly') return { old: c.oldMonthlyCost, new: c.newMonthlyCost };
    const rate = 0.56;
    return { old: c.oldDailyKWh * rate, new: c.newDailyKWh * rate };
  };

  const maxCost = useMemo(() => {
    if (!comparison) return 1;
    const { old, new: newCost } = getCostValues(comparison, viewMode);
    return Math.max(old, newCost, 1);
  }, [comparison, viewMode]);

  if (!selectedAppliance || !comparison) {
    return (
      <View className={styles.page}>
        <View className="emptyState" style={{ margin: '0 32rpx' }}>
          <Text style={{ fontSize: 80 }}>⚡</Text>
          <View style={{ marginTop: 16, fontSize: 28, color: '#64748b' }}>暂无设备数据</View>
        </View>
      </View>
    );
  }

  const { old: oldCost, new: newCost } = getCostValues(comparison, viewMode);
  const modeLabel = viewMode === 'annual' ? '年' : viewMode === 'monthly' ? '月' : '日';

  const powerSavingsRatio = comparison.oldPower > 0
    ? ((comparison.oldPower - comparison.newPower) / comparison.oldPower) * 100
    : 0;
  const costSavingsRatio = oldCost > 0 ? ((oldCost - newCost) / oldCost) * 100 : 0;
  const annualKWhOld = comparison.oldDailyKWh * 365;
  const annualKWhNew = comparison.newDailyKWh * 365;
  const electricitySavingsRatio = annualKWhOld > 0
    ? ((annualKWhOld - annualKWhNew) / annualKWhOld) * 100
    : 0;

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.applianceTabs}>
        <ScrollView scrollX enhanced showScrollbar={false} className={styles.tabsContainer}>
          {appliances.map((app) => (
            <View
              key={app.id}
              className={classnames(styles.tabItem, app.id === selectedAppliance.id && 'active')}
              onClick={() => setSelectedAppliance(app.id)}
            >
              <Text className={styles.tabEmoji}>{categoryEmoji[app.category]}</Text>
              <Text>{app.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.overviewCard}>
        <Text className={styles.overviewIcon}>🌱</Text>
        <View className={styles.overviewLabel}>
          更换 {selectedAppliance.name} {modeLabel}预计节省
        </View>
        <View style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <Text className={styles.overviewValue}>
            {formatCurrency(viewMode === 'annual'
              ? comparison.annualSavings
              : viewMode === 'monthly'
              ? comparison.annualSavings / 12
              : comparison.annualSavings / 365)}
          </Text>
          <Text className={styles.overviewUnit}>/ 电费</Text>
        </View>
        <View className={styles.overviewSub}>
          <View className={styles.overviewSubItem}>
            <View className={styles.overviewSubValue}>
              {powerSavingsRatio.toFixed(0)}%
            </View>
            <View className={styles.overviewSubLabel}>能效提升</View>
          </View>
          <View className={styles.overviewSubItem}>
            <View className={styles.overviewSubValue}>
              {comparison.co2ReductionKg.toFixed(1)}kg
            </View>
            <View className={styles.overviewSubLabel}>年减碳量</View>
          </View>
          <View className={styles.overviewSubItem}>
            <View className={styles.overviewSubValue}>
              {electricitySavingsRatio.toFixed(0)}%
            </View>
            <View className={styles.overviewSubLabel}>用电减少</View>
          </View>
        </View>
      </View>

      <View className={styles.sectionTitle}>电费对比</View>
      <View className={classnames('card', styles.comparisonCard)}>
        <View className={styles.comparisonHeader}>
          <View className={styles.comparisonTitle}>
            {selectedCandidate ? selectedCandidate.name : '同类型新一级能效'}
          </View>
          <View className={styles.switchMode}>
            {(['daily', 'monthly', 'annual'] as ViewMode[]).map((mode) => (
              <View
                key={mode}
                className={classnames(
                  styles.switchModeItem,
                  viewMode === mode && 'active'
                )}
                onClick={() => setViewMode(mode)}
              >
                {mode === 'daily' ? '日' : mode === 'monthly' ? '月' : '年'}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.comparisonBars}>
          <View className={styles.barRow}>
            <View className={styles.barLabel}>现有设备</View>
            <View className={styles.barContainer}>
              <View className={styles.barTrack}>
                <View
                  className={classnames(styles.barFill, styles.barFillOld)}
                  style={{ width: `${(oldCost / maxCost) * 100}%` }}
                >
                  <Text className={styles.barText}>{formatCurrency(oldCost)}</Text>
                </View>
              </View>
              <View className={styles.barMeta}>
                <Text>
                  {selectedAppliance.power}W ·{' '}
                  {calculateDailyHours(
                    selectedAppliance.usageFrequency,
                    selectedAppliance.dailyUsageHours
                  )}
                  h/{modeLabel === '日' ? '日' : '天'}
                </Text>
                <Text>
                  电费 {viewMode === 'annual'
                    ? comparison.oldAnnualCost.toFixed(2)
                    : viewMode === 'monthly'
                    ? comparison.oldMonthlyCost.toFixed(2)
                    : (comparison.oldDailyKWh * 0.56).toFixed(2)}
                  元/{modeLabel}
                </Text>
              </View>
            </View>
          </View>

          <View className={styles.barRow}>
            <View className={styles.barLabel}>换新设备</View>
            <View className={styles.barContainer}>
              <View className={styles.barTrack}>
                <View
                  className={classnames(styles.barFill, styles.barFillNew)}
                  style={{ width: `${(newCost / maxCost) * 100}%` }}
                >
                  <Text className={styles.barText}>{formatCurrency(newCost)}</Text>
                </View>
              </View>
              <View className={styles.barMeta}>
                <Text>
                  {selectedCandidate?.power || Math.round(selectedAppliance.power * 0.6)}W · 新一级能效
                </Text>
                <Text style={{ color: '#22c55e', fontWeight: 600 }}>
                  ↓ {formatCurrency(oldCost - newCost)} ({costSavingsRatio.toFixed(0)}%)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.ecoCard}>
        <View className={styles.ecoTitle}>
          <Text className={styles.ecoIcon}>🌍</Text>
          全屋家电换新环保效益（全部设备）
        </View>
        <View className={styles.ecoStats}>
          <View className={styles.ecoStat}>
            <Text className={styles.ecoStatIcon}>💰</Text>
            <Text className={styles.ecoStatValue}>{formatCurrency(totalSavings)}</Text>
            <Text className={styles.ecoStatUnit}>年省电费</Text>
            <Text className={styles.ecoStatLabel}>全屋换新累计</Text>
          </View>
          <View className={styles.ecoStat}>
            <Text className={styles.ecoStatIcon}>🌳</Text>
            <Text className={styles.ecoStatValue}>{totalCO2.toFixed(1)}</Text>
            <Text className={styles.ecoStatUnit}>kg CO₂</Text>
            <Text className={styles.ecoStatLabel}>
              年减碳量 ≈ 种树{(totalCO2 / 18).toFixed(1)}棵
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionTitle}>各设备能耗排行</View>
      <View className={styles.deviceList}>
        {allComparisons.map((c) => {
          const appliance = appliances.find((a) => a.id === c.applianceId);
          if (!appliance) return null;
          const deviceSavingsRatio = c.oldAnnualCost > 0
            ? ((c.oldAnnualCost - c.newAnnualCost) / c.oldAnnualCost) * 100
            : 0;
          return (
            <View
              key={c.applianceId}
              className={styles.deviceItem}
              onClick={() => setSelectedAppliance(c.applianceId)}
            >
              <View className={styles.deviceHeader}>
                <View className={styles.deviceIconBox}>
                  <Text className={styles.deviceIcon}>
                    {categoryEmoji[appliance.category] || '🔌'}
                  </Text>
                </View>
                <View className={styles.deviceInfo}>
                  <View className={styles.deviceName}>{c.applianceName}</View>
                  <View className={styles.deviceMeta}>
                    {c.oldPower}W → {c.newPower}W · 能效等级1级
                  </View>
                </View>
                {c.annualSavings > 100 && (
                  <View className={styles.deviceSaveBadge}>
                    省{c.annualSavings.toFixed(0)}元
                  </View>
                )}
              </View>
              <View className={styles.deviceStats}>
                <View className={styles.deviceStat}>
                  <View
                    className={classnames(
                      styles.deviceStatValue,
                      c.oldAnnualCost > 800 && styles.deviceStatValueHigh
                    )}
                  >
                    {formatCurrency(c.oldAnnualCost)}
                  </View>
                  <View className={styles.deviceStatLabel}>旧机年费</View>
                </View>
                <View className={styles.deviceStat}>
                  <View
                    className={classnames(styles.deviceStatValue, styles.deviceStatValueSave)}
                  >
                    {formatCurrency(c.newAnnualCost)}
                  </View>
                  <View className={styles.deviceStatLabel}>新年费</View>
                </View>
                <View className={styles.deviceStat}>
                  <View
                    className={classnames(styles.deviceStatValue, styles.deviceStatValueSave)}
                  >
                    {deviceSavingsRatio.toFixed(0)}%
                  </View>
                  <View className={styles.deviceStatLabel}>节省比例</View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default EnergyPage;
