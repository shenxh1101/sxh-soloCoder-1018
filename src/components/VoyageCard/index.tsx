import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { Voyage } from '@/types';
import { formatDateTime, formatWeight } from '@/utils/format';

interface VoyageCardProps {
  voyage: Voyage;
  onClick?: () => void;
}

const statusMap: Record<string, 'success' | 'warning' | 'error' | 'primary'> = {
  sailing: 'success',
  anchored: 'warning',
  loading: 'primary',
  unloading: 'primary',
  completed: 'primary',
  exception: 'error',
  pending: 'primary'
};

const VoyageCard: React.FC<VoyageCardProps> = ({ voyage, onClick }) => {
  const statusClass = statusMap[voyage.status] || 'primary';

  return (
    <View className={styles.voyageCard} onClick={onClick}>
      <View className={styles.header}>
        <View className={styles.left}>
          <Text className={styles.voyageNo}>{voyage.voyageNo}</Text>
          <Text className={styles.shipName}>{voyage.shipName}</Text>
        </View>
        <View className={classnames(styles.statusBadge, styles[statusClass])}>
          {voyage.statusText}
        </View>
      </View>

      <View className={styles.route}>
        <View className={styles.port}>
          <Text className={styles.portName}>{voyage.loadingPort}</Text>
          <Text className={styles.portTime}>{formatDateTime(voyage.departureTime)}</Text>
        </View>
        <View className={styles.arrow}>
          <View className={styles.line} />
        </View>
        <View className={styles.port}>
          <Text className={styles.portName}>{voyage.unloadingPort}</Text>
          <Text className={styles.portTime}>{formatDateTime(voyage.estimatedArrivalTime)}</Text>
        </View>
      </View>

      <View className={styles.progress}>
        <View className={styles.progressHeader}>
          <Text className={styles.label}>航次进度</Text>
          <Text className={styles.value}>{voyage.progress}%</Text>
        </View>
        <View className={styles.progressBar}>
          <View className={styles.progressFill} style={{ width: `${voyage.progress}%` }} />
        </View>
      </View>

      <View className={styles.footer}>
        <Text className={styles.info}>
          载货 {formatWeight(voyage.totalWeight)}
        </Text>
        <Text className={styles.arrowBtn}>›</Text>
      </View>
    </View>
  );
};

export default VoyageCard;
