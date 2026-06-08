import React, { useState, useMemo } from 'react';
import { View, Text, Button, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getExceptionsByStatus, getPendingExceptionsCount } from '@/data/exception';
import { getExceptionTypeConfig, getExceptionStatusConfig, getRelativeTime } from '@/utils/format';
import UploadItem from '@/components/UploadItem';
import type { Exception, ExceptionType } from '@/types';

const typeOptions = [
  { key: 'congestion', label: '航道拥堵', icon: '🚧' },
  { key: 'weather', label: '恶劣天气', icon: '🌪️' },
  { key: 'equipment', label: '设备故障', icon: '⚙️' },
  { key: 'other', label: '其他异常', icon: '⚠️' }
];

const ExceptionPage: React.FC = () => {
  const { state } = useApp();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<ExceptionType>('congestion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [, setRefreshing] = useState(false);

  const exceptionTypes = ['all', 'pending', 'processing', 'resolved', 'closed'];
  const filterLabels: Record<string, string> = {
    all: '全部',
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  };

  const exceptionList = useMemo(() => {
    return getExceptionsByStatus(activeFilter);
  }, [activeFilter]);

  useDidShow(() => {
    console.log('[ExceptionPage] 页面显示');
  });

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const handleReport = () => {
    setSelectedType('congestion');
    setTitle('');
    setDescription('');
    setLocation('');
    setPhotos([]);
    setShowForm(true);
  };

  const handleAddPhoto = () => {
    Taro.chooseImage({
      count: 3,
      success: (res) => {
        const newPhotos = [...photos, ...res.tempFilePaths];
        setPhotos(newPhotos.slice(0, 9));
        console.log('[ExceptionPage] 选择图片:', res.tempFilePaths);
      },
      fail: (error) => {
        console.error('[ExceptionPage] 选择图片失败:', error);
      }
    });
  };

  const handleDeletePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入异常标题', icon: 'none' });
      return;
    }
    if (!description.trim()) {
      Taro.showToast({ title: '请输入异常描述', icon: 'none' });
      return;
    }
    if (!location.trim()) {
      Taro.showToast({ title: '请输入发生位置', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: '上报成功', icon: 'success' });
      setShowForm(false);
      console.log('[ExceptionPage] 异常上报成功');
    }, 1000);
  };

  const handleExceptionClick = (exception: Exception) => {
    Taro.navigateTo({
      url: `/pages/exception-detail/index?id=${exception.id}`
    });
  };

  const handleProcess = (_exception: Exception) => {
    Taro.showModal({
      title: '处理异常',
      content: '确认开始处理该异常？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已标记为处理中', icon: 'success' });
        }
      }
    });
  };

  const renderExceptionList = () => {
    if (exceptionList.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>暂无异常记录</Text>
        </View>
      );
    }

    return exceptionList.map((exception) => {
      const typeConfig = getExceptionTypeConfig(exception.type);
      const statusConfig = getExceptionStatusConfig(exception.status);

      return (
        <View
          className={styles.exceptionCard}
          key={exception.id}
          onClick={() => handleExceptionClick(exception)}
        >
          <View className={styles.cardHeader}>
            <View className={classnames(styles.typeTag, styles[exception.type])}>
              {typeConfig.text}
            </View>
            <View className={classnames(styles.statusTag, styles[exception.status])}>
              {statusConfig.text}
            </View>
          </View>

          <Text className={styles.title}>{exception.title}</Text>
          <Text className={styles.description}>{exception.description}</Text>

          <View className={styles.infoRow}>
            <Text className={styles.label}>📍</Text>
            <Text className={styles.value}>{exception.location}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>👤</Text>
            <Text className={styles.value}>{exception.reporter} · {getRelativeTime(exception.createTime)}</Text>
          </View>

          {exception.photos.length > 0 && (
            <ScrollView className={styles.photoPreview} scrollX>
              {exception.photos.slice(0, 3).map((photo, index) => (
                <UploadItem key={index} src={photo} />
              ))}
            </ScrollView>
          )}

          {state.userRole === 'dispatcher' && exception.status === 'pending' && (
            <View style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                className="btnPrimary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProcess(exception);
                }}
              >
                开始处理
              </Button>
            </View>
          )}
        </View>
      );
    });
  };

  const renderForm = () => {
    if (!showForm) return null;

    return (
      <View className={styles.formModal} onClick={() => setShowForm(false)}>
        <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <View className={styles.modalHeader}>
            <Text className={styles.modalTitle}>上报异常</Text>
            <Text className={styles.closeBtn} onClick={() => setShowForm(false)}>×</Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>异常类型
            </Text>
            <View className={styles.typeSelector}>
              {typeOptions.map((option) => (
                <View className={styles.typeOption} key={option.key}>
                  <Button
                    className={classnames(
                      styles.typeInner,
                      selectedType === option.key && styles.active
                    )}
                    onClick={() => setSelectedType(option.key as ExceptionType)}
                  >
                    <Text className={styles.typeIcon}>{option.icon}</Text>
                    <Text>{option.label}</Text>
                  </Button>
                </View>
                ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>异常标题
            </Text>
            <Input
              className={styles.formInput}
              placeholder="请简要描述异常"
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>详细描述
            </Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="请详细描述异常情况..."
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>发生位置
            </Text>
            <Input
              className={styles.formInput}
              placeholder="请输入发生位置"
              value={location}
              onInput={(e) => setLocation(e.detail.value)}
            />
          </View>

          <View className={styles.photoSection}>
            <Text className={styles.formLabel}>现场照片（可选）</Text>
            <View>
              {photos.map((photo, index) => (
                <UploadItem
                  key={index}
                  src={photo}
                  onDelete={() => handleDeletePhoto(index)}
                />
              ))}
              {photos.length < 9 && (
                <UploadItem showAdd onAdd={handleAddPhoto} />
              )}
            </View>
          </View>

          <Button className={styles.submitBtn} onClick={handleSubmit}>
            提交上报
          </Button>
        </View>
      </View>
    );
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>异常上报</Text>
        <Text className={styles.subtitle}>
          {state.userRole === 'crew'
            ? '及时上报航行中的异常情况'
            : `待处理异常 ${getPendingExceptionsCount()} 条`}
        </Text>
      </View>

      <ScrollView className={styles.filterBar} scrollX>
        {exceptionTypes.map((type) => (
          <Button
            key={type}
            className={classnames(
              styles.filterItem,
              activeFilter === type && styles.active
            )}
            onClick={() => setActiveFilter(type)}
          >
            {filterLabels[type]}
            {type === 'pending' && (
              <Text className={styles.count}>
                ({getExceptionsByStatus('pending').length + getExceptionsByStatus('processing').length})
              </Text>
            )}
          </Button>
        ))}
      </ScrollView>

      <View className={styles.content}>
        {renderExceptionList()}
      </View>

      {state.userRole === 'crew' && (
        <View className={styles.fabButton} onClick={handleReport}>
          <Text className={styles.fabText}>+</Text>
        </View>
      )}

      {renderForm()}
    </ScrollView>
  );
};

export default ExceptionPage;
