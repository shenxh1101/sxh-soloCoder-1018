import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface DataGridItem {
  value: string;
  label: string;
}

interface DataListItem {
  label: string;
  value: string;
}

interface DataPanelProps {
  icon?: string;
  title: string;
  extra?: string;
  gridData?: DataGridItem[];
  listData?: DataListItem[];
}

const DataPanel: React.FC<DataPanelProps> = ({ icon, title, extra, gridData, listData }) => {
  return (
    <View className={styles.dataPanel}>
      <View className={styles.header}>
        {icon && (
          <View className={styles.icon}>
            <Text>{icon}</Text>
          </View>
        )}
        <Text className={styles.title}>{title}</Text>
        {extra && <Text className={styles.extra}>{extra}</Text>}
      </View>
      
      {gridData && gridData.length > 0 && (
        <View className={styles.grid}>
          {gridData.map((item, index) => (
            <View className={styles.item} key={index}>
              <View className={styles.itemInner}>
                <Text className={styles.value}>{item.value}</Text>
                <Text className={styles.label}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      
      {listData && listData.length > 0 && (
        <View className={styles.list}>
          {listData.map((item, index) => (
            <View className={styles.listItem} key={index}>
              <Text className={styles.label}>{item.label}</Text>
              <Text className={styles.value}>{item.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default DataPanel;
