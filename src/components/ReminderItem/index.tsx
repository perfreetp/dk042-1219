import React from 'react';
import { View, Text, Switch } from '@tarojs/components';
import classnames from 'classnames';
import { Reminder, ReminderType } from '@/types';
import styles from './index.module.scss';

interface ReminderItemProps {
  reminder: Reminder;
  onToggleEnabled?: () => void;
  onClick?: () => void;
}

const typeIconMap: Record<ReminderType, string> = {
  warranty: '🛡️',
  energy: '⚡',
  repair: '🔧',
  maintenance: '✨',
};

const ReminderItem: React.FC<ReminderItemProps> = ({
  reminder,
  onToggleEnabled,
  onClick,
}) => {
  return (
    <View
      className={classnames(
        styles.item,
        styles[reminder.severity],
        !reminder.isRead && styles.unread,
        !reminder.enabled && styles.disabled,
        onClick && styles.clickable
      )}
      onClick={onClick}
    >
      <View className={styles.left}>
        <View className={styles.iconBox}>
          <Text className={styles.icon}>{typeIconMap[reminder.type]}</Text>
        </View>
        {!reminder.isRead && <View className={styles.dot} />}
      </View>

      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.title}>{reminder.title}</Text>
          <Text className={styles.date}>{reminder.date}</Text>
        </View>
        <Text className={styles.description}>{reminder.description}</Text>
        {reminder.applianceName && (
          <View className={styles.applianceTag}>
            关联设备：{reminder.applianceName}
          </View>
        )}
      </View>

      {onToggleEnabled && (
        <View className={styles.switchBox} onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={reminder.enabled}
            onChange={onToggleEnabled}
            color="#22c55e"
          />
        </View>
      )}
    </View>
  );
};

export default ReminderItem;
