import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { TimeLineItem } from '@/types';

interface TimelineProps {
  items: TimeLineItem[];
}

const Timeline: React.FC<TimelineProps> = ({ items }) => {
  return (
    <View className={styles.timeline}>
      {items.map((item, index) => (
        <View className={styles.item} key={index}>
          <View className={classnames(styles.dot, styles[item.status])} />
          <View className={styles.content}>
            <Text className={styles.time}>{item.time}</Text>
            <Text className={classnames(styles.title, item.status === 'current' && styles.current)}>
              {item.title}
            </Text>
            <Text className={styles.description}>{item.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default Timeline;
