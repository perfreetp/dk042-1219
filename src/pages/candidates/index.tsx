import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import classnames from 'classnames';
import { useApplianceStore } from '@/store/appliance';
import { formatCurrency, calculateAnnualElectricityCost, calculateDailyHours } from '@/utils/calculator';
import { NewApplianceCandidate } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | 'favorite' | 'aircon' | 'fridge' | 'washer';

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

const CandidatesPage: React.FC = () => {
  const { candidates, appliances, toggleFavorite, initStore } = useApplianceStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  React.useEffect(() => {
    initStore();
  }, [initStore]);

  const filteredCandidates = useMemo(() => {
    let list = candidates;
    if (filter === 'favorite') list = list.filter((c) => c.isFavorite);
    if (filter === 'aircon') list = list.filter((c) => c.category === '空调');
    if (filter === 'fridge') list = list.filter((c) => c.category === '冰箱');
    if (filter === 'washer') list = list.filter((c) => c.category === '洗衣机');
    return list;
  }, [candidates, filter]);

  const compareCandidates = useMemo(() => {
    return candidates.filter((c) => compareIds.includes(c.id)).slice(0, 2);
  }, [candidates, compareIds]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const getAnnualElectricity = (c: NewApplianceCandidate) => {
    const targetAppliance = appliances.find((a) => a.id === c.compareTargetId);
    const hours = targetAppliance
      ? calculateDailyHours(targetAppliance.usageFrequency, targetAppliance.dailyUsageHours)
      : 4;
    return calculateAnnualElectricityCost(c.power, hours);
  };

  const getTotalCost = (c: NewApplianceCandidate) => {
    return c.price - c.subsidyAmount + c.installationFee;
  };

  const renderCompareTable = () => {
    if (compareCandidates.length < 2) {
      return (
        <View className={styles.emptyState} style={{ marginTop: 24 }}>
          <View className={styles.emptyIcon}>🔍</View>
          <View className={styles.emptyText}>请先选择 2 个候选机型进行对比</View>
          <View className={styles.emptyHint}>点击列表视图中的机型卡片添加到对比</View>
        </View>
      );
    }

    const [a, b] = compareCandidates;
    const aCost = getTotalCost(a);
    const bCost = getTotalCost(b);
    const aElec = getAnnualElectricity(a);
    const bElec = getAnnualElectricity(b);

    const rows = [
      {
        label: '品牌型号',
        a: `${a.brand} ${a.model}`,
        b: `${b.brand} ${b.model}`,
      },
      {
        label: '实际花费',
        a: formatCurrency(aCost),
        b: formatCurrency(bCost),
        win: aCost < bCost ? 'a' : bCost < aCost ? 'b' : null,
      },
      {
        label: '能效等级',
        a: `${a.energyRating}级`,
        b: `${b.energyRating}级`,
        win: a.energyRating < b.energyRating ? 'a' : b.energyRating < a.energyRating ? 'b' : null,
      },
      {
        label: '额定功率',
        a: `${a.power}W`,
        b: `${b.power}W`,
        win: a.power < b.power ? 'a' : b.power < a.power ? 'b' : null,
      },
      {
        label: '年费预估',
        a: formatCurrency(aElec),
        b: formatCurrency(bElec),
        win: aElec < bElec ? 'a' : bElec < aElec ? 'b' : null,
      },
      {
        label: '换新补贴',
        a: formatCurrency(a.subsidyAmount),
        b: formatCurrency(b.subsidyAmount),
        win: a.subsidyAmount > b.subsidyAmount ? 'a' : b.subsidyAmount > a.subsidyAmount ? 'b' : null,
      },
      {
        label: '保修年限',
        a: `${a.warrantyYears}年`,
        b: `${b.warrantyYears}年`,
        win: a.warrantyYears > b.warrantyYears ? 'a' : b.warrantyYears > a.warrantyYears ? 'b' : null,
      },
      {
        label: '回收渠道',
        a: a.recyclingChannel,
        b: b.recyclingChannel,
      },
      {
        label: '安装尺寸',
        a: `${a.dimensions.width}×${a.dimensions.height}×${a.dimensions.depth}mm`,
        b: `${b.dimensions.width}×${b.dimensions.height}×${b.dimensions.depth}mm`,
      },
    ];

    return (
      <View className={styles.compareTable}>
        <View className={styles.compareRow}>
          <View className={classnames(styles.compareCell, 'header', 'label')}>对比项</View>
          <View className={classnames(styles.compareCell, 'header')}>
            {categoryEmoji[a.category]} {a.name.slice(0, 10)}
          </View>
          <View className={classnames(styles.compareCell, 'header')}>
            {categoryEmoji[b.category]} {b.name.slice(0, 10)}
          </View>
        </View>
        {rows.map((row, i) => (
          <View className={styles.compareRow} key={i}>
            <View className={classnames(styles.compareCell, 'label')}>{row.label}</View>
            <View
              className={classnames(
                styles.compareCell,
                'value',
                row.win === 'a' && styles.win
              )}
            >
              {row.a}
              {row.win === 'a' && ' ✅'}
            </View>
            <View
              className={classnames(
                styles.compareCell,
                'value',
                row.win === 'b' && styles.win
              )}
            >
              {row.b}
              {row.win === 'b' && ' ✅'}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.filterBar}>
        {[
          { key: 'all' as FilterType, label: '全部' },
          { key: 'favorite' as FilterType, label: '⭐ 收藏' },
          { key: 'aircon' as FilterType, label: '空调' },
          { key: 'fridge' as FilterType, label: '冰箱' },
          { key: 'washer' as FilterType, label: '洗衣机' },
        ].map((f) => (
          <Button
            key={f.key}
            className={classnames(styles.filterChip, filter === f.key && 'active')}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </View>

      {filteredCandidates.length > 2 && (
        <View className={styles.compareMode}>
          <View className={styles.compareToggle}>
            <View
              className={classnames(
                styles.compareToggleItem,
                viewMode === 'list' && 'active'
              )}
              onClick={() => setViewMode('list')}
            >
              📋 列表视图
            </View>
            <View
              className={classnames(
                styles.compareToggleItem,
                viewMode === 'compare' && 'active'
              )}
              onClick={() => setViewMode('compare')}
            >
              ⚖️ 对比视图 {compareIds.length > 0 && `(${compareIds.length})`}
            </View>
          </View>
        </View>
      )}

      {viewMode === 'compare' ? (
        renderCompareTable()
      ) : filteredCandidates.length === 0 ? (
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>🎯</View>
          <View className={styles.emptyText}>
            {filter === 'favorite' ? '暂无收藏的候选机型' : '暂无候选机型数据'}
          </View>
          <View className={styles.emptyHint}>可浏览电商平台后记录心仪的新机型号</View>
        </View>
      ) : (
        <View className={styles.candidateList}>
          {filteredCandidates.map((c) => {
            const target = appliances.find((a) => a.id === c.compareTargetId);
            return (
              <View key={c.id} className={styles.candidateCard}>
                <View className={styles.cardHeader}>
                  <View className={styles.cardInfo}>
                    <View className={styles.cardTitle}>{c.name}</View>
                    <View className={styles.cardBrand}>
                      <Text style={{ fontSize: 28 }}>{categoryEmoji[c.category]}</Text>
                      <Text className={styles.brandText}>
                        {c.brand} · {c.model}
                      </Text>
                      {target && (
                        <Text style={{ fontSize: 22, color: '#94a3b8', marginLeft: 8 }}>
                          → 替换 {target.name}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View
                    className={classnames(styles.favBtn, c.isFavorite && 'active')}
                    onClick={() => toggleFavorite(c.id)}
                  >
                    <Text className={styles.favIcon}>{c.isFavorite ? '⭐' : '☆'}</Text>
                  </View>
                </View>

                <View className={styles.priceRow}>
                  <View className={styles.priceMain}>
                    <Text className={styles.priceSymbol}>¥</Text>
                    <Text className={styles.priceValue}>
                      {(c.price - c.subsidyAmount).toLocaleString()}
                    </Text>
                  </View>
                  <Text className={styles.priceStrike}>原价 ¥{c.price.toLocaleString()}</Text>
                  <View className={styles.subsidyBadge}>
                    补贴 -{formatCurrency(c.subsidyAmount)}
                  </View>
                </View>

                <View className={styles.specsGrid}>
                  <View className={styles.specItem}>
                    <View
                      className={classnames(
                        styles.specValue,
                        c.energyRating === 1 && styles.specValueEnergy
                      )}
                    >
                      {c.energyRating}级
                    </View>
                    <View className={styles.specLabel}>能效等级</View>
                  </View>
                  <View className={styles.specItem}>
                    <View className={styles.specValue}>{c.power}W</View>
                    <View className={styles.specLabel}>额定功率</View>
                  </View>
                  <View className={styles.specItem}>
                    <View className={styles.specValue}>{c.warrantyYears}年</View>
                    <View className={styles.specLabel}>保修期限</View>
                  </View>
                </View>

                <View className={styles.infoSection}>
                  <View className={styles.infoRow}>
                    <View className={styles.infoLabel}>回收渠道</View>
                    <View className={styles.infoValue}>{c.recyclingChannel}</View>
                  </View>
                  <View className={styles.infoRow}>
                    <View className={styles.infoLabel}>补贴条件</View>
                    <View className={styles.infoValue}>{c.subsidyCondition}</View>
                  </View>
                  <View className={styles.infoRow}>
                    <View className={styles.infoLabel}>安装尺寸</View>
                    <View className={styles.infoValue}>
                      {c.dimensions.width}×{c.dimensions.height}×{c.dimensions.depth} mm（宽×高×深）
                    </View>
                  </View>
                  <View className={styles.infoRow}>
                    <View className={styles.infoLabel}>配送说明</View>
                    <View className={styles.infoValue}>{c.deliveryRestriction}</View>
                  </View>
                  <View className={styles.infoRow}>
                    <View className={styles.infoLabel}>安装费用</View>
                    <View className={styles.infoValue}>
                      {formatCurrency(c.installationFee)}
                      {candidates
                        .filter((x) => x.compareTargetId === c.compareTargetId)
                        .length > 1 &&
                        ` · 同类最低价 ${formatCurrency(
                          Math.min(
                            ...candidates
                              .filter((x) => x.compareTargetId === c.compareTargetId)
                              .map((x) => x.price - x.subsidyAmount + x.installationFee)
                          )
                        )}`}
                    </View>
                  </View>
                </View>

                <View className={styles.tagRow}>
                  <View className={classnames(styles.tag, styles.tagGreen)}>
                    💰 年费约 {formatCurrency(getAnnualElectricity(c))}
                  </View>
                  {target && (
                    <View className={classnames(styles.tag, styles.tagBlue)}>
                      ⚡ 比旧机省{' '}
                      {formatCurrency(
                        calculateAnnualElectricityCost(
                          target.power,
                          calculateDailyHours(target.usageFrequency, target.dailyUsageHours)
                        ) - getAnnualElectricity(c)
                      )}
                      /年
                    </View>
                  )}
                  {candidates
                    .filter((x) => x.compareTargetId === c.compareTargetId)
                    .sort(
                      (a, b) =>
                        a.price - a.subsidyAmount + a.installationFee -
                        (b.price - b.subsidyAmount + b.installationFee)
                    )[0]?.id === c.id && (
                    <View className={classnames(styles.tag, styles.tagOrange)}>
                      🏆 同类最低价
                    </View>
                  )}
                  {candidates.filter((x) => x.compareTargetId === c.compareTargetId).length >
                    1 && (
                    <Button
                      className={classnames(
                        styles.tag,
                        compareIds.includes(c.id) ? styles.tagGreen : styles.tagBlue
                      )}
                      style={{ border: 'none', width: 'auto', height: 'auto', padding: '6rpx 16rpx', margin: 0, lineHeight: 'normal' }}
                      onClick={() => toggleCompare(c.id)}
                    >
                      {compareIds.includes(c.id) ? '✓ 已加入对比' : '➕ 加入对比'}
                    </Button>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

export default CandidatesPage;
