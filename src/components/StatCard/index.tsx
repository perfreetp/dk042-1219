import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  trend,
  trendText,
  color = 'primary',
  icon,
  className,
}) => {
  return (
    <View className={classnames(styles.card, styles[color], className)}>
      {icon && <Text className={styles.icon}>{icon}</Text>}
      <View className={styles.content}>
        <View className={styles.valueRow}>
          <Text className={styles.value}>{value}</Text>
          {unit && <Text className={styles.unit}>{unit}</Text>}
        </View>
        <Text className={styles.label}>{label}</Text>
        {trend && (
          <View className={classnames(styles.trend, styles[`trend${trend.charAt(0).toUpperCase() + trend.slice(1)}`])}>
            <Text>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</Text>
            {trendText && <Text>{trendText}</Text>}
          </View>
        )}
      </View>
    </View>
  );
};

export default StatCard;
