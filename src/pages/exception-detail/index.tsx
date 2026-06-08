import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useDidShow, useRouter, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getExceptionById } from '@/data/exception';
import { getVoyageById } from '@/data/voyage';
import {
  getExceptionTypeConfig,
  getExceptionStatusConfig,
  formatDateTime
} from '@/utils/format';
import type { Exception, Voyage, TimeLineItem } from '@/types';

const ExceptionDetailPage: React.FC = () => {
  const { state } = useApp();
  const router = useRouter();
  const [, setRefreshing] = useState(false);
  const [handleResult, setHandleResult] = useState('');
  const [showHandleForm, setShowHandleForm] = useState(false);

  const exceptionId = router.params.id;

  const exception = useMemo<Exception | undefined>(() => {
    return getExceptionById(exceptionId || '');
  }, [exceptionId]);

  const voyage = useMemo<Voyage | undefined>(() => {
    if (!exception) return undefined;
    return getVoyageById(exception.voyageId);
  }, [exception]);

  const timeline = useMemo<TimeLineItem[]>(() => {
    if (!exception) return [];
    const items: TimeLineItem[] = [
      {
        time: exception.createTime,
        title: '异常上报',
        description: exception.description,
        status: 'completed'
      }
    ];
    if (exception.handleTime && exception.handler) {
      items.push({
        time: exception.handleTime,
        title: '开始处理',
        description: `由 ${exception.handler} 开始处理`,
        status: 'completed'
      });
    }
    if (exception.handleResult) {
      items.push({
        time: exception.updateTime,
        title: '处理结果',
        description: exception.handleResult,
        status: exception.status === 'resolved' || exception.status === 'closed' ? 'completed' : 'current'
      });
    }
    return items;
  }, [exception]);

  useDidShow(() => {
    console.log('[ExceptionDetailPage] 页面显示，异常ID:', exceptionId);
  });

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const handleProcess = () => {
    if (state.userRole !== 'dispatcher') {
      Taro.showToast({ title: '只有调度员可以处理', icon: 'none' });
      return;
    }
    setShowHandleForm(true);
  };

  const handleResolve = () => {
    if (state.userRole !== 'dispatcher') {
      Taro.showToast({ title: '只有调度员可以操作', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '标记已解决',
      content: '确认该异常已解决？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已标记为已解决', icon: 'success' });
        }
      }
    });
  };

  const handleClose = () => {
    if (state.userRole !== 'dispatcher') {
      Taro.showToast({ title: '只有调度员可以操作', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '关闭异常',
      content: '确认关闭该异常记录？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已关闭', icon: 'success' });
        }
      }
    });
  };

  const handleSubmitResult = () => {
    if (!handleResult.trim()) {
      Taro.showToast({ title: '请输入处理结果', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: '处理成功', icon: 'success' });
      setShowHandleForm(false);
      setHandleResult('');
    }, 1000);
  };

  const handleViewVoyage = () => {
    if (!voyage) return;
    Taro.navigateTo({
      url: `/pages/voyage-detail/index?id=${voyage.id}`
    });
  };

  const handlePhotoPreview = (photos: string[], index: number) => {
    Taro.previewImage({
      current: photos[index],
      urls: photos
    });
  };

  if (!exception) {
    return (
      <ScrollView className={styles.pageContainer} scrollY>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>⚠️</Text>
          <Text className={styles.emptyText}>异常记录不存在</Text>
        </View>
      </ScrollView>
    );
  }

  const typeConfig = getExceptionTypeConfig(exception.type);
  const statusConfig = getExceptionStatusConfig(exception.status);

  const getTypeIcon = (type: string): string => {
    const map: Record<string, string> = {
      congestion: '🚧',
      weather: '🌪️',
      equipment: '⚙️',
      other: '⚠️'
    };
    return map[type] || '⚠️';
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.header}>
        <Text className={styles.exceptionNo}>异常编号：{exception.id.toUpperCase()}</Text>
        <Text className={styles.title}>{exception.title}</Text>
        <Text className={styles.shipName}>{exception.shipName} · {exception.voyageId}</Text>
        <View className={styles.statusRow}>
          <View className={styles.typeTag}>
            {getTypeIcon(exception.type)} {typeConfig.text}
          </View>
          <View className={styles.statusTag}>
            {statusConfig.text}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>📋</Text>
          基本信息
        </Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>发生位置</Text>
            <Text className={styles.infoValue}>{exception.location}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>发生时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(exception.occurrenceTime)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>上报人</Text>
            <Text className={styles.infoValue}>{exception.reporter}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>上报时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(exception.createTime)}</Text>
          </View>
          {exception.handler && (
            <>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>处理人</Text>
                <Text className={styles.infoValue}>{exception.handler}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>处理时间</Text>
                <Text className={styles.infoValue}>{formatDateTime(exception.handleTime || '')}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>📝</Text>
          异常描述
        </Text>
        <View className={styles.description}>{exception.description}</View>
      </View>

      {exception.photos.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📷</Text>
            现场照片 ({exception.photos.length})
          </Text>
          <View className={styles.photoList}>
            {exception.photos.map((photo, index) => (
              <View
                className={styles.photoItem}
                key={index}
                onClick={() => handlePhotoPreview(exception.photos, index)}
              >
                <Image className={styles.photo} src={photo} mode="aspectFill" />
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>⏱️</Text>
          处理进度
        </Text>
        <View className={styles.timeline}>
          {timeline.map((item, index) => (
            <View className={styles.timelineItem} key={index}>
              <View className={styles.timelineDot} />
              <View className={styles.timelineLine} />
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTitle}>{item.title}</Text>
                <Text className={styles.timelineTime}>{formatDateTime(item.time)}</Text>
                <Text className={styles.timelineDesc}>{item.description}</Text>
                {index === 1 && exception.handler && (
                  <Text className={styles.timelineUser}>处理人：{exception.handler}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {voyage && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>🚢</Text>
            关联航次
          </Text>
          <View
            className={styles.description}
            style={{ cursor: 'pointer' }}
            onClick={handleViewVoyage}
          >
            <Text style={{ color: '$color-primary', fontWeight: 500 }}>
              {voyage.voyageNo} · {voyage.loadingPort} → {voyage.unloadingPort}
            </Text>
            <Text style={{ fontSize: '$font-size-sm', color: '$color-text-tertiary', display: 'block', marginTop: 8 }}>
              点击查看航次详情 →
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 160 }} />

      {state.userRole === 'dispatcher' && exception.status !== 'closed' && (
        <View className={styles.actionBar}>
          {exception.status === 'pending' && (
            <View
              className={classnames(styles.actionBtn, styles.warning)}
              onClick={handleProcess}
            >
              开始处理
            </View>
          )}
          {exception.status === 'processing' && (
            <View
              className={classnames(styles.actionBtn, styles.success)}
              onClick={handleResolve}
            >
              标记解决
            </View>
          )}
          {exception.status === 'resolved' && (
            <View
              className={styles.actionBtn}
              onClick={handleClose}
            >
              关闭异常
            </View>
          )}
        </View>
      )}

      {showHandleForm && (
        <View
          className={styles.actionBar}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            padding: 0,
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 1000
          }}
          onClick={() => setShowHandleForm(false)}
        >
          <View
            style={{
              width: '100%',
              background: '#fff',
              borderRadius: '24rpx 24rpx 0 0',
              padding: '32rpx',
              paddingBottom: 'calc(32rpx + env(safe-area-inset-bottom))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <View
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32rpx'
              }}
            >
              <Text style={{ fontSize: '36rpx', fontWeight: 600, color: '#1D2129' }}>
                处理异常
              </Text>
              <Text
                style={{ fontSize: '48rpx', color: '#86909C' }}
                onClick={() => setShowHandleForm(false)}
              >
                ×
              </Text>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>处理结果
              </Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="请输入处理结果和指示..."
                value={handleResult}
                onInput={(e) => setHandleResult(e.detail.value)}
              />
            </View>

            <View style={{ display: 'flex', gap: '16rpx' }}>
              <View
                className={styles.actionBtn}
                style={{
                  flex: 1,
                  height: '96rpx',
                  borderRadius: '16rpx',
                  fontSize: '32rpx',
                  fontWeight: 500,
                  background: '#F0F7FF',
                  color: '#4E5969',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setShowHandleForm(false)}
              >
                取消
              </View>
              <View
                className={classnames(styles.actionBtn, styles.primary)}
                style={{
                  flex: 1,
                  height: '96rpx',
                  borderRadius: '16rpx',
                  fontSize: '32rpx',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={handleSubmitResult}
              >
                提交处理
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ExceptionDetailPage;
