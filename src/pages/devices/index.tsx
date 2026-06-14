import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useApplianceStore } from '@/store/appliance';
import { Appliance, ApplianceCategory, CATEGORY_LIST, UsageFrequency, FREQUENCY_LABEL } from '@/types';
import { calculateRepairRisk, getRiskLevel, calculateApplianceAge, formatCurrency } from '@/utils/calculator';
import StatCard from '@/components/StatCard';
import ApplianceCard from '@/components/ApplianceCard';
import styles from './index.module.scss';

const defaultFormData = () => ({
  name: '',
  category: '冰箱' as ApplianceCategory,
  brand: '',
  model: '',
  purchaseYear: new Date().getFullYear() - 3,
  purchasePrice: 3000,
  power: 500,
  usageFrequency: 'medium' as UsageFrequency,
  dailyUsageHours: 4,
  repairCount: 0,
  totalRepairCost: 0,
  lastRepairDate: '',
  warrantyEndDate: `${new Date().getFullYear() + 1}-12-31`,
  currentFault: {
    description: '',
    date: '',
    severity: 'minor' as 'minor' | 'moderate' | 'severe',
  },
});

const DevicesPage: React.FC = () => {
  const {
    appliances,
    selectedApplianceId,
    setSelectedAppliance,
    addAppliance,
    updateAppliance,
    deleteAppliance,
    initStore,
  } = useApplianceStore();

  const [filterCategory, setFilterCategory] = useState<ApplianceCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultFormData());

  useDidShow(() => {
    initStore();
  });

  const filteredAppliances = useMemo(() => {
    if (filterCategory === 'all') return appliances;
    return appliances.filter((a) => a.category === filterCategory);
  }, [appliances, filterCategory]);

  const summary = useMemo(() => {
    const total = appliances.length;
    const highRisk = appliances.filter(
      (a) => getRiskLevel(calculateRepairRisk(a)) === 'high'
    ).length;
    const totalRepairCost = appliances.reduce((sum, a) => sum + a.totalRepairCost, 0);
    const totalAge = appliances.reduce((sum, a) => sum + calculateApplianceAge(a.purchaseYear), 0);
    const avgAge = total > 0 ? (totalAge / total).toFixed(1) : '0';
    return { total, highRisk, totalRepairCost, avgAge };
  }, [appliances]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(defaultFormData());
    setShowModal(true);
  };

  const openEditModal = (appliance: Appliance) => {
    setEditingId(appliance.id);
    setFormData({
      name: appliance.name,
      category: appliance.category,
      brand: appliance.brand,
      model: appliance.model,
      purchaseYear: appliance.purchaseYear,
      purchasePrice: appliance.purchasePrice,
      power: appliance.power,
      usageFrequency: appliance.usageFrequency,
      dailyUsageHours: appliance.dailyUsageHours,
      repairCount: appliance.repairCount,
      totalRepairCost: appliance.totalRepairCost,
      lastRepairDate: appliance.lastRepairDate,
      warrantyEndDate: appliance.warrantyEndDate,
      currentFault: appliance.currentFault
        ? { ...appliance.currentFault }
        : { description: '', date: '', severity: 'minor' },
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后相关提醒和候选数据也会清除，确定吗？',
      success: (res) => {
        if (res.confirm) {
          deleteAppliance(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入设备名称', icon: 'none' });
      return;
    }
    if (!formData.brand.trim()) {
      Taro.showToast({ title: '请输入品牌', icon: 'none' });
      return;
    }

    const applianceData: Omit<Appliance, 'id' | 'createdAt'> = {
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      model: formData.model || '未知型号',
      purchaseYear: Number(formData.purchaseYear),
      purchasePrice: Number(formData.purchasePrice),
      power: Number(formData.power),
      usageFrequency: formData.usageFrequency,
      dailyUsageHours: Number(formData.dailyUsageHours),
      repairCount: Number(formData.repairCount),
      totalRepairCost: Number(formData.totalRepairCost),
      lastRepairDate: formData.lastRepairDate,
      warrantyEndDate: formData.warrantyEndDate,
      maintenanceRecord: [],
    };

    if (formData.currentFault.description.trim()) {
      applianceData.currentFault = {
        description: formData.currentFault.description.trim(),
        date: formData.currentFault.date || new Date().toISOString().split('T')[0],
        severity: formData.currentFault.severity,
      };
    }

    if (editingId) {
      updateAppliance(editingId, applianceData);
      Taro.showToast({ title: '更新成功', icon: 'success' });
    } else {
      addAppliance(applianceData);
      Taro.showToast({ title: '添加成功', icon: 'success' });
    }

    setShowModal(false);
    setEditingId(null);
    setFormData(defaultFormData());
  };

  const renderCategoryGrid = () => {
    const rows: ApplianceCategory[][] = [];
    const chunkSize = 4;
    for (let i = 0; i < CATEGORY_LIST.length; i += chunkSize) {
      rows.push(CATEGORY_LIST.slice(i, i + chunkSize));
    }
    return rows.map((row, ri) => (
      <View className={styles.segmented} key={ri}>
        {row.map((cat) => (
          <View
            key={cat}
            className={classnames(
              styles.segmentedItem,
              formData.category === cat && 'active'
            )}
            onClick={() => setFormData({ ...formData, category: cat })}
          >
            {cat}
          </View>
        ))}
      </View>
    ));
  };

  return (
    <View className="pageContainer" style={{ padding: '0 32rpx', paddingBottom: 180 }}>
      <View className={styles.pageContainer}>
        <View className={styles.summaryRow}>
          <StatCard
            label="设备总数"
            value={summary.total}
            unit="台"
            icon="🏠"
            color="primary"
          />
          <StatCard
            label="高风险设备"
            value={summary.highRisk}
            unit="台"
            icon="⚠️"
            color="danger"
          />
          <StatCard
            label="累计维修费"
            value={formatCurrency(summary.totalRepairCost)}
            icon="💰"
            color="warning"
          />
          <StatCard
            label="平均使用年限"
            value={summary.avgAge}
            unit="年"
            icon="📅"
            color="info"
          />
        </View>

        <ScrollView scrollX className={styles.filterBar} enhanced showScrollbar={false}>
          <Button
            className={classnames(styles.filterItem, filterCategory === 'all' && styles.filterItemActive)}
            onClick={() => setFilterCategory('all')}
          >
            全部
          </Button>
          {CATEGORY_LIST.map((cat) => (
            <Button
              key={cat}
              className={classnames(styles.filterItem, filterCategory === cat && styles.filterItemActive)}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </ScrollView>

        <View className={styles.listContainer}>
          {filteredAppliances.length === 0 ? (
            <View className="card" style={{ textAlign: 'center', padding: '64rpx 32rpx' }}>
              <Text style={{ fontSize: '80rpx' }}>📦</Text>
              <View style={{ marginTop: 16, fontSize: 28, color: '#64748b' }}>
                暂无{filterCategory === 'all' ? '' : filterCategory}设备
              </View>
              <View style={{ marginTop: 8, fontSize: 24, color: '#94a3b8' }}>
                点击右下角按钮添加家电设备
              </View>
            </View>
          ) : (
            filteredAppliances.map((appliance) => (
              <View key={appliance.id} className={styles.applianceCardWrapper}>
                <ApplianceCard
                  appliance={appliance}
                  selected={selectedApplianceId === appliance.id}
                  showDecision
                  onClick={() => {
                    setSelectedAppliance(
                      selectedApplianceId === appliance.id ? null : appliance.id
                    );
                  }}
                />
                <View className={styles.cardActions}>
                  <View
                    className={styles.cardActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(appliance);
                    }}
                  >
                    ✏️ 编辑
                  </View>
                  <View
                    className={classnames(styles.cardActionBtn, styles.cardActionBtnDanger)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(appliance.id);
                    }}
                  >
                    🗑️ 删除
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View className={styles.fab} onClick={openAddModal}>
        <Text>＋</Text>
      </View>

      {showModal && (
        <View className={styles.modalMask} onClick={() => setShowModal(false)}>
          <View className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>
                {editingId ? '编辑家电设备' : '添加家电设备'}
              </Text>
              <View className={styles.modalClose} onClick={() => setShowModal(false)}>
                <Text>✕</Text>
              </View>
            </View>

            <ScrollView scrollY className={styles.modalBody}>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>设备名称 *</Text>
                <Input
                  className="inputField"
                  placeholder="如：客厅空调"
                  value={formData.name}
                  onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                />
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>设备类别</Text>
                {renderCategoryGrid()}
              </View>

              <View className={styles.formRow}>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>品牌 *</Text>
                  <Input
                    className="inputField"
                    placeholder="如：美的"
                    value={formData.brand}
                    onInput={(e) => setFormData({ ...formData, brand: e.detail.value })}
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>型号</Text>
                  <Input
                    className="inputField"
                    placeholder="如：KFR-35GW"
                    value={formData.model}
                    onInput={(e) => setFormData({ ...formData, model: e.detail.value })}
                  />
                </View>
              </View>

              <View className={styles.formRow}>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>购买年份</Text>
                  <Input
                    type="number"
                    className="inputField"
                    value={String(formData.purchaseYear)}
                    onInput={(e) =>
                      setFormData({ ...formData, purchaseYear: Number(e.detail.value) })
                    }
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>购买价格(元)</Text>
                  <Input
                    type="digit"
                    className="inputField"
                    value={String(formData.purchasePrice)}
                    onInput={(e) =>
                      setFormData({ ...formData, purchasePrice: Number(e.detail.value) })
                    }
                  />
                </View>
              </View>

              <View className={styles.formRow}>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>功率(W)</Text>
                  <Input
                    type="number"
                    className="inputField"
                    value={String(formData.power)}
                    onInput={(e) =>
                      setFormData({ ...formData, power: Number(e.detail.value) })
                    }
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>每日使用(小时)</Text>
                  <Input
                    type="digit"
                    className="inputField"
                    value={String(formData.dailyUsageHours)}
                    onInput={(e) =>
                      setFormData({ ...formData, dailyUsageHours: Number(e.detail.value) })
                    }
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>使用频率</Text>
                <View className={styles.segmented}>
                  {(Object.keys(FREQUENCY_LABEL) as UsageFrequency[]).map((freq) => (
                    <View
                      key={freq}
                      className={classnames(
                        styles.segmentedItem,
                        formData.usageFrequency === freq && 'active'
                      )}
                      onClick={() => setFormData({ ...formData, usageFrequency: freq })}
                    >
                      {FREQUENCY_LABEL[freq]}
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formRow}>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>维修次数</Text>
                  <Input
                    type="number"
                    className="inputField"
                    value={String(formData.repairCount)}
                    onInput={(e) =>
                      setFormData({ ...formData, repairCount: Number(e.detail.value) })
                    }
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>累计维修(元)</Text>
                  <Input
                    type="digit"
                    className="inputField"
                    value={String(formData.totalRepairCost)}
                    onInput={(e) =>
                      setFormData({ ...formData, totalRepairCost: Number(e.detail.value) })
                    }
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>保修截止日期</Text>
                <Input
                  className="inputField"
                  placeholder="YYYY-MM-DD"
                  value={formData.warrantyEndDate}
                  onInput={(e) =>
                    setFormData({ ...formData, warrantyEndDate: e.detail.value })
                  }
                />
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>当前故障（如有）</Text>
                <Input
                  className="inputField"
                  placeholder="请描述当前故障情况，如：不制冷、异响等"
                  value={formData.currentFault.description}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      currentFault: {
                        ...formData.currentFault,
                        description: e.detail.value,
                      },
                    })
                  }
                />
              </View>

              <View className={styles.formRow}>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>故障发生日期</Text>
                  <Input
                    className="inputField"
                    placeholder="YYYY-MM-DD"
                    value={formData.currentFault.date}
                    onInput={(e) =>
                      setFormData({
                        ...formData,
                        currentFault: {
                          ...formData.currentFault,
                          date: e.detail.value,
                        },
                      })
                    }
                  />
                </View>
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>故障严重程度</Text>
                  <View className={styles.segmented}>
                    {[
                      { key: 'minor' as const, label: '轻微' },
                      { key: 'moderate' as const, label: '中度' },
                      { key: 'severe' as const, label: '严重' },
                    ].map((s) => (
                      <View
                        key={s.key}
                        className={classnames(
                          styles.segmentedItem,
                          formData.currentFault.severity === s.key && 'active'
                        )}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            currentFault: {
                              ...formData.currentFault,
                              severity: s.key,
                            },
                          })
                        }
                      >
                        {s.label}
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {editingId && formData.currentFault.description.trim() && (
                <View className={styles.formGroup}>
                  <View
                    className={classnames(styles.segmentedItem, 'active')}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        currentFault: { description: '', date: '', severity: 'minor' },
                      })
                    }
                  >
                    🩹 清除故障（已修复）
                  </View>
                </View>
              )}
            </ScrollView>

            <View className={styles.modalFooter}>
              <Button
                className={classnames('btnSecondary', styles.footerBtn)}
                onClick={() => setShowModal(false)}
              >
                取消
              </Button>
              <Button
                className={classnames('btnPrimary', styles.footerBtn)}
                onClick={handleSubmit}
              >
                {editingId ? '保存修改' : '确认添加'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DevicesPage;
