import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface UploadItemProps {
  src?: string;
  onDelete?: () => void;
  onAdd?: () => void;
  showAdd?: boolean;
}

const UploadItem: React.FC<UploadItemProps> = ({ src, onDelete, onAdd, showAdd = false }) => {
  if (showAdd) {
    return (
      <View className={styles.uploadItem} onClick={onAdd}>
        <View className={styles.addBtn}>
          <Text className={styles.plus}>+</Text>
          <Text className={styles.text}>添加</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.uploadItem}>
      <Image
        className={styles.image}
        src={src || ''}
        mode="aspectFill"
        onError={(e) => console.error('[UploadItem] 图片加载失败:', e)}
      />
      {onDelete && (
        <View className={styles.deleteBtn} onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}>
          <Text>×</Text>
        </View>
      )}
    </View>
  );
};

export default UploadItem;
