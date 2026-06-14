import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { DecisionType } from '@/types';
import styles from './index.module.scss';

interface DecisionBadgeProps {
  decision: DecisionType;
  size?: 'sm' | 'md' | 'lg';
}

const labelMap: Record<DecisionType, string> = {
  repair: '建议维修',
  maintain: '继续使用',
  replace: '建议更换',
};

const DecisionBadge: React.FC<DecisionBadgeProps> = ({ decision, size = 'md' }) => {
  return (
    <View
      className={classnames(
        styles.badge,
        styles[decision],
        styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`]
      )}
    >
      <Text className={styles.icon}>
        {decision === 'repair' && '🔧'}
        {decision === 'maintain' && '✅'}
        {decision === 'replace' && '🆕'}
      </Text>
      <Text className={styles.label}>{labelMap[decision]}</Text>
    </View>
  );
};

export default DecisionBadge;
