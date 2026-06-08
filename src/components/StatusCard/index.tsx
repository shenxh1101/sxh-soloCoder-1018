import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatusCardProps {
  title: string;
  status: 'success' | 'warning' | 'error' | 'primary';
  statusText: string;
  items: { label: string; value: string }[];
  time?: string;
  onClick?: () => void;
  showArrow?: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  statusText,
  items,
  time,
  onClick,
  showArrow = true
}) => {
  return (
    <View className={styles.statusCard} onClick={onClick}>
      <View className={styles.header}>
        <Text className={styles.title}>{title}</Text>
        <View className={classnames(styles.statusBadge, styles[status])}>
          {statusText}
        </View>
      </View>
      <View className={styles.content}>
        {items.map((item, index) => (
          <View className={styles.row} key={index}>
            <Text className={styles.label}>{item.label}</Text>
            <Text className={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
      {(time || showArrow) && (
        <View className={styles.footer}>
          {time && <Text className={styles.time}>{time}</Text>}
          {showArrow && <Text className={styles.arrow}>›</Text>}
        </View>
      )}
    </View>
  );
};

export default StatusCard;
