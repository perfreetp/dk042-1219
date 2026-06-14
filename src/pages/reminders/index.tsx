import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Switch } from '@tarojs/components';
import classnames from 'classnames';
import { useApplianceStore } from '@/store/appliance';
import { Reminder } from '@/types';
import styles from './index.module.scss';

type FilterTab = 'all' | 'danger' | 'warning' | 'info';

const severityIcon: Record<string, string> = {
  danger: '🔴',
  warning: '🟡',
  info: '🔵',
};

const severityConfig: Record<string, { label: string }> = {
  danger: { label: '紧急' },
  warning: { label: '警告' },
  info: { label: '提示' },
};

const typeLabelMap: Record<string, string> = {
  warranty: '保修',
  energy: '能耗',
  repair: '维修',
  maintenance: '保养',
};

const RemindersPage: React.FC = () => {
  const {
    reminders,
    appliances,
    markAsRead,
    markAllAsRead,
    toggleReminderEnabled,
    initStore,
  } = useApplianceStore();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  React.useEffect(() => {
    initStore();
  }, [initStore]);

  const filteredReminders = useMemo(() => {
    let list = reminders;
    if (filterTab !== 'all') list = list.filter((r) => r.severity === filterTab);
    return list.sort((a, b) => {
      const sMap = { danger: 0, warning: 1, info: 2 };
      if (sMap[a.severity] !== sMap[b.severity]) return sMap[a.severity] - sMap[b.severity];
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [reminders, filterTab]);

  const stats = useMemo(() => {
    const total = reminders.length;
    const unread = reminders.filter((r) => !r.isRead).length;
    const danger = reminders.filter((r) => r.severity === 'danger').length;
    const warning = reminders.filter((r) => r.severity === 'warning').length;
    const info = reminders.filter((r) => r.severity === 'info').length;
    return { total, unread, danger, warning, info };
  }, [reminders]);

  const getApplianceName = (id?: string) => {
    if (!id) return null;
    return appliances.find((a) => a.id === id)?.name;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 1) return '今天';
    if (diff < 2) return '昨天';
    if (diff < 7) return `${Math.floor(diff)}天前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const settingOptions = [
    {
      key: 'warranty',
      icon: '🛡️',
      label: '保修到期提醒',
      desc: '保修结束前 30 天提前通知',
    },
    {
      key: 'energy',
      icon: '⚡',
      label: '能耗异常提醒',
      desc: '电费异常波动时提示',
    },
    {
      key: 'repair',
      icon: '🔧',
      label: '维修费用提醒',
      desc: '维修成本过高时警示',
    },
    {
      key: 'safety',
      icon: '🔥',
      label: '安全隐患提醒',
      desc: '使用年限过长的老旧设备',
    },
  ];

  const renderReminderItem = (r: Reminder) => {
    const applianceName = getApplianceName(r.applianceId);
    const severityClass = r.severity as 'danger' | 'warning' | 'info';
    return (
      <View
        key={r.id}
        className={classnames(styles.reminderCard, severityClass, r.isRead && styles.read)}
        onClick={() => {
          if (!r.isRead) markAsRead(r.id);
        }}
      >
        <View className={styles.reminderHeader}>
          <View className={styles.reminderTitle}>
            <View
              className={classnames(
                styles.reminderIconBox,
                severityClass === 'danger' && styles.reminderIconBoxDanger,
                severityClass === 'warning' && styles.reminderIconBoxWarning,
                severityClass === 'info' && styles.reminderIconBoxInfo
              )}
            >
              <Text className={styles.reminderIcon}>{severityIcon[r.severity]}</Text>
            </View>
            <Text className={styles.reminderTitleText}>{r.title}</Text>
            {!r.isRead && <View className={styles.unreadDot} />}
          </View>
          <Text className={styles.reminderDate}>{formatDate(r.date)}</Text>
        </View>

        <View className={styles.reminderDescription}>{r.description}</View>

        <View className={styles.reminderFooter}>
          <View className={styles.reminderTags}>
            <View
              className={classnames(styles.reminderTag)}
              style={{
                background:
                  severityClass === 'danger'
                    ? 'rgba(239,68,68,0.12)'
                    : severityClass === 'warning'
                    ? 'rgba(245,158,11,0.12)'
                    : 'rgba(59,130,246,0.12)',
                color:
                  severityClass === 'danger'
                    ? '#dc2626'
                    : severityClass === 'warning'
                    ? '#d97706'
                    : '#2563eb',
              }}
            >
              {severityConfig[r.severity].label}
            </View>
            {applianceName && (
              <View className={classnames(styles.reminderTag, styles.reminderTagAppliance)}>
                {applianceName}
              </View>
            )}
            <View className={styles.reminderTag}>
              {typeLabelMap[r.type] || '安全'}
            </View>
          </View>
          <View className={styles.reminderActions}>
            <Text className={styles.switchLabel}>{r.enabled ? '开启' : '已关闭'}</Text>
            <Switch
              checked={r.enabled}
              color="#22c55e"
              onChange={(e) => toggleReminderEnabled(r.id, e.detail.value)}
              style={{ transform: 'scale(0.7)' }}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView scrollY className={styles.page}>
      {/* 统计概览 */}
      <View className={styles.statsRow}>
        <View className={classnames(styles.statBox, 'danger')}>
          <View className={classnames(styles.statCount, styles.statCountDanger)}>
            {stats.danger}
          </View>
          <View className={styles.statLabel}>紧急事项</View>
        </View>
        <View className={classnames(styles.statBox, 'warning')}>
          <View className={classnames(styles.statCount, styles.statCountWarning)}>
            {stats.warning}
          </View>
          <View className={styles.statLabel}>警告提醒</View>
        </View>
        <View className={classnames(styles.statBox, 'info')}>
          <View className={classnames(styles.statCount, styles.statCountInfo)}>
            {stats.info}
          </View>
          <View className={styles.statLabel}>一般提示</View>
        </View>
      </View>

      {/* 设置面板 */}
      <View className={styles.settingsCard}>
        <View className={styles.settingsTitle}>提醒设置</View>
        {settingOptions.map((opt) => (
          <View className={styles.settingsRow} key={opt.key}>
            <View className={styles.settingsInfo}>
              <Text className={styles.settingsIcon}>{opt.icon}</Text>
              <View className={styles.settingsText}>
                <View className={styles.settingsLabel}>{opt.label}</View>
                <View className={styles.settingsDesc}>{opt.desc}</View>
              </View>
            </View>
            <Switch checked color="#22c55e" style={{ transform: 'scale(0.7)' }} />
          </View>
        ))}
      </View>

      {/* 过滤栏 */}
      <View className={styles.filterBar}>
        <View className={styles.filterTabs}>
          {[
            { key: 'all' as FilterTab, label: '全部' },
            { key: 'danger' as FilterTab, label: '🔴 紧急' },
            { key: 'warning' as FilterTab, label: '🟡 警告' },
            { key: 'info' as FilterTab, label: '🔵 提示' },
          ].map((tab) => (
            <View
              key={tab.key}
              className={classnames(styles.filterTab, filterTab === tab.key && 'active')}
              onClick={() => setFilterTab(tab.key)}
            >
              {tab.label}
            </View>
          ))}
        </View>
        {stats.unread > 0 && (
          <View className={styles.markAllBtn} onClick={markAllAsRead}>
            全部已读
          </View>
        )}
      </View>

      {/* 提醒列表 */}
      {filteredReminders.length === 0 ? (
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>🎉</View>
          <View className={styles.emptyText}>
            暂无{filterTab !== 'all' ? severityConfig[filterTab].label : ''}提醒
          </View>
          <View className={styles.emptyHint}>所有家电状态良好，继续保持！</View>
        </View>
      ) : (
        <View className={styles.reminderList}>
          {filteredReminders.map(renderReminderItem)}
        </View>
      )}
    </ScrollView>
  );
};

export default RemindersPage;
