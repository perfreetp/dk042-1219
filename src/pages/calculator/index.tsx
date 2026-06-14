import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import classnames from 'classnames';
import { useApplianceStore } from '@/store/appliance';
import { analyzeCost, calculateApplianceAge, calculateRepairRisk, formatCurrency } from '@/utils/calculator';
import { CostAnalysisResult, AVG_LIFESPAN_YEARS } from '@/types';
import DecisionBadge from '@/components/DecisionBadge';
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

const CalculatorPage: React.FC = () => {
  const { appliances, candidates, selectedApplianceId, setSelectedAppliance, initStore } =
    useApplianceStore();

  const [repairCost, setRepairCost] = useState<number>(380);
  const [newPrice, setNewPrice] = useState<number>(3299);
  const [subsidy, setSubsidy] = useState<number>(300);
  const [installationFee, setInstallationFee] = useState<number>(100);
  const [newPower, setNewPower] = useState<number>(700);

  React.useEffect(() => {
    initStore();
  }, [initStore]);

  const selectedAppliance = useMemo(
    () => appliances.find((a) => a.id === selectedApplianceId) || appliances[0],
    [appliances, selectedApplianceId]
  );

  const matchedCandidate = useMemo(() => {
    if (!selectedAppliance) return null;
    return candidates.find((c) => c.compareTargetId === selectedAppliance.id && c.isFavorite);
  }, [candidates, selectedAppliance]);

  React.useEffect(() => {
    if (selectedAppliance && matchedCandidate) {
      setNewPrice(matchedCandidate.price);
      setSubsidy(matchedCandidate.subsidyAmount);
      setInstallationFee(matchedCandidate.installationFee);
      setNewPower(matchedCandidate.power);
      const estRepair = Math.round(selectedAppliance.purchasePrice * 0.12);
      setRepairCost(estRepair > 0 ? estRepair : 380);
    } else if (selectedAppliance) {
      setNewPrice(Math.round(selectedAppliance.purchasePrice * 0.85));
      setNewPower(Math.round(selectedAppliance.power * 0.6));
      setSubsidy(Math.round(selectedAppliance.purchasePrice * 0.08));
      setInstallationFee(100);
      const estRepair = Math.round(selectedAppliance.purchasePrice * 0.12);
      setRepairCost(estRepair > 0 ? estRepair : 380);
    }
  }, [selectedAppliance, matchedCandidate]);

  const analysis: CostAnalysisResult | null = useMemo(() => {
    if (!selectedAppliance) return null;
    return analyzeCost(selectedAppliance, repairCost, {
      price: newPrice,
      power: newPower,
      subsidyAmount: subsidy,
      installationFee,
    });
  }, [selectedAppliance, repairCost, newPrice, newPower, subsidy, installationFee]);

  const riskFactors = useMemo(() => {
    if (!selectedAppliance) return [];
    const factors: string[] = [];
    const age = calculateApplianceAge(selectedAppliance.purchaseYear);
    const lifespan = AVG_LIFESPAN_YEARS[selectedAppliance.category];

    if (age >= lifespan) factors.push(`超期服役${age - lifespan}年`);
    else if (age >= lifespan * 0.75) factors.push(`已用${age}年/寿命${lifespan}年`);

    if (selectedAppliance.repairCount >= 3) factors.push(`维修${selectedAppliance.repairCount}次`);
    if (selectedAppliance.currentFault) factors.push('存在当前故障');
    if (
      selectedAppliance.totalRepairCost >=
      selectedAppliance.purchasePrice * 0.3
    )
      factors.push('累计维修费超30%');

    return factors;
  }, [selectedAppliance]);

  if (!selectedAppliance || !analysis) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>📊</View>
          <View className={styles.emptyText}>暂无设备数据</View>
          <View className={styles.emptyHint}>请先在"设备清单"中添加家电</View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.sectionTitle}>选择设备</View>
      <View className={styles.applianceSelector}>
        <ScrollView scrollX enhanced showScrollbar={false} className={styles.selectorScroll}>
          {appliances.map((app) => (
            <View
              key={app.id}
              className={classnames(
                styles.selectorCard,
                app.id === selectedAppliance.id && 'active'
              )}
              onClick={() => setSelectedAppliance(app.id)}
            >
              <Text className={styles.selectorEmoji}>
                {categoryEmoji[app.category] || '🔌'}
              </Text>
              <Text className={styles.selectorName}>{app.name}</Text>
              <Text className={styles.selectorMeta}>
                {calculateApplianceAge(app.purchaseYear)}年 · {app.repairCount}次维修
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.sectionTitle}>输入费用信息</View>
      <View className={classnames('card', styles.inputCard)}>
        <View className={styles.inputGroup}>
          <Text className={styles.inputLabel}>维修报价（元）</Text>
          <Input
            type="digit"
            className="inputField"
            value={String(repairCost)}
            onInput={(e) => setRepairCost(Number(e.detail.value) || 0)}
          />
          <Text className={styles.inputHint}>
            含配件费 + 人工费，当前约为购买价的{' '}
            {((repairCost / selectedAppliance.purchasePrice) * 100).toFixed(1)}%
          </Text>
        </View>

        <View className={styles.inputGroup}>
          <Text className={styles.inputLabel}>新机价格（元）</Text>
          <Input
            type="digit"
            className="inputField"
            value={String(newPrice)}
            onInput={(e) => setNewPrice(Number(e.detail.value) || 0)}
          />
          <Text className={styles.inputHint}>
            {matchedCandidate ? `参考候选机型：${matchedCandidate.name}` : '参考同类型主流新品价格'}
          </Text>
        </View>

        <View style={{ display: 'flex', gap: 24 }}>
          <View style={{ flex: 1 }}>
            <View className={styles.inputGroup}>
              <Text className={styles.inputLabel}>以旧换新补贴</Text>
              <Input
                type="digit"
                className="inputField"
                value={String(subsidy)}
                onInput={(e) => setSubsidy(Number(e.detail.value) || 0)}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View className={styles.inputGroup}>
              <Text className={styles.inputLabel}>安装配送费</Text>
              <Input
                type="digit"
                className="inputField"
                value={String(installationFee)}
                onInput={(e) => setInstallationFee(Number(e.detail.value) || 0)}
              />
            </View>
          </View>
        </View>

        <View className={styles.inputGroup}>
          <Text className={styles.inputLabel}>新机额定功率（W）</Text>
          <Input
            type="number"
            className="inputField"
            value={String(newPower)}
            onInput={(e) => setNewPower(Number(e.detail.value) || 0)}
          />
          <Text className={styles.inputHint}>
            节能对比参考：旧机 {selectedAppliance.power}W → 新机 {newPower}W，
            能效提升 {((1 - newPower / selectedAppliance.power) * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      <View className={styles.sectionTitle}>决策建议</View>
      <View className={styles.resultSection}>
        <View
          className={classnames(
            styles.recommendationCard,
            analysis.recommendation === 'repair' && styles.recommendRepair,
            analysis.recommendation === 'maintain' && styles.recommendMaintain,
            analysis.recommendation === 'replace' && styles.recommendReplace
          )}
        >
          <DecisionBadge decision={analysis.recommendation} size="lg" />
          <View className={styles.recommendTitle}>
            {analysis.recommendation === 'repair' && '建议进行维修'}
            {analysis.recommendation === 'maintain' && '建议继续使用'}
            {analysis.recommendation === 'replace' && '建议更换新机'}
          </View>
          <View className={styles.recommendReason}>{analysis.reasoning}</View>
        </View>

        <View className={styles.compareSection}>
          <View className={styles.compareCard}>
            <View className={styles.compareCardHeader}>
              <Text className={styles.compareCardIcon}>🔧</Text>
              <Text className={styles.compareCardTitle}>维修方案</Text>
            </View>
            <View className={classnames(styles.compareCardValue, styles.compareCardValueRepair)}>
              {formatCurrency(analysis.repairTotalCost)}
            </View>
            <View className={styles.compareCardUnit}>含风险溢价预估</View>
            <View className={styles.compareItemList}>
              <View className={styles.compareItem}>
                <Text>维修报价</Text>
                <Text>{formatCurrency(repairCost)}</Text>
              </View>
              <View className={styles.compareItem}>
                <Text>风险溢价</Text>
                <Text>
                  {formatCurrency(analysis.repairTotalCost - repairCost)}
                </Text>
              </View>
              <View className={styles.compareItem}>
                <Text>一年电费</Text>
                <Text>{formatCurrency(analysis.annualElectricityOld)}</Text>
              </View>
            </View>
          </View>

          <View className={styles.compareCard}>
            <View className={styles.compareCardHeader}>
              <Text className={styles.compareCardIcon}>🆕</Text>
              <Text className={styles.compareCardTitle}>换新方案</Text>
            </View>
            <View className={classnames(styles.compareCardValue, styles.compareCardValueReplace)}>
              {formatCurrency(analysis.replaceTotalCost)}
            </View>
            <View className={styles.compareCardUnit}>购机实际投入</View>
            <View className={styles.compareItemList}>
              <View className={styles.compareItem}>
                <Text>新机售价</Text>
                <Text>{formatCurrency(newPrice)}</Text>
              </View>
              <View className={styles.compareItem}>
                <Text>换新补贴</Text>
                <Text style={{ color: '#22c55e' }}>-{formatCurrency(subsidy)}</Text>
              </View>
              <View className={styles.compareItem}>
                <Text>安装配送</Text>
                <Text>{formatCurrency(installationFee)}</Text>
              </View>
              <View className={styles.compareItem}>
                <Text>一年电费</Text>
                <Text>{formatCurrency(analysis.annualElectricityNew)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.riskCard}>
          <View className={styles.riskHeader}>
            <Text className={styles.riskTitle}>未来一年维修风险评估</Text>
            <View
              className={classnames(
                styles.riskLevel,
                analysis.repairRiskLevel === 'low' && styles.riskLevelLow,
                analysis.repairRiskLevel === 'medium' && styles.riskLevelMedium,
                analysis.repairRiskLevel === 'high' && styles.riskLevelHigh
              )}
            >
              {analysis.repairRiskLevel === 'low' && '低风险'}
              {analysis.repairRiskLevel === 'medium' && '中风险'}
              {analysis.repairRiskLevel === 'high' && '高风险'}
            </View>
          </View>
          <View className={styles.riskBarContainer}>
            <View
              className={classnames(
                styles.riskBarFill,
                analysis.repairRiskLevel === 'low' && styles.riskBarLow,
                analysis.repairRiskLevel === 'medium' && styles.riskBarMedium,
                analysis.repairRiskLevel === 'high' && styles.riskBarHigh
              )}
              style={{ width: `${analysis.repairRisk}%` }}
            />
          </View>
          <View style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 22, color: '#94a3b8' }}>0%</Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: 600,
                color:
                  analysis.repairRiskLevel === 'low'
                    ? '#22c55e'
                    : analysis.repairRiskLevel === 'medium'
                    ? '#f59e0b'
                    : '#ef4444',
              }}
            >
              风险值 {analysis.repairRisk}%
            </Text>
            <Text style={{ fontSize: 22, color: '#94a3b8' }}>100%</Text>
          </View>
          {riskFactors.length > 0 && (
            <View className={styles.riskFactors}>
              {riskFactors.map((f, i) => (
                <View key={i} className={styles.riskFactor}>
                  ⚠️ {f}
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={styles.savingCard}>
          <View style={{ fontSize: 30, fontWeight: 600, marginBottom: 24, color: '#1e293b' }}>
            长期成本与节能分析
          </View>
          <View className={styles.savingGrid}>
            <View className={styles.savingItem}>
              <View className={styles.savingItemIcon}>💰</View>
              <View className={styles.savingItemValue}>{formatCurrency(analysis.annualSavings)}</View>
              <View className={styles.savingItemLabel}>年度电费节省</View>
            </View>
            <View className={styles.savingItem}>
              <View className={styles.savingItemIcon}>📆</View>
              <View className={styles.savingItemValue}>
                {analysis.paybackYears >= 99 ? '—' : `${analysis.paybackYears}年`}
              </View>
              <View className={styles.savingItemLabel}>成本回收期</View>
            </View>
            <View className={styles.savingItem}>
              <View className={styles.savingItemIcon}>📉</View>
              <View className={styles.savingItemValue}>
                {formatCurrency(analysis.replaceTotalCost - analysis.repairTotalCost)}
              </View>
              <View className={styles.savingItemLabel}>换新额外投入</View>
            </View>
            <View className={styles.savingItem}>
              <View className={styles.savingItemIcon}>⚡</View>
              <View className={styles.savingItemValue}>
                {(
                  ((analysis.annualElectricityOld - analysis.annualElectricityNew) /
                    analysis.annualElectricityOld) *
                  100
                ).toFixed(1)}
                %
              </View>
              <View className={styles.savingItemLabel}>能耗降低比例</View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default CalculatorPage;
