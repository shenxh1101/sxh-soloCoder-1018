import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { mockShips, mockFleetOverview } from '@/data/ship';
import { mockVoyages } from '@/data/voyage';
import { mockExceptions } from '@/data/exception';
import {
  getShipStatusConfig,
  getVoyageStatusConfig,
  getExceptionStatusConfig,
  formatDateTime,
  formatSpeed,
  formatPercentage
} from '@/utils/format';
import type { Ship, Voyage, Exception } from '@/types';

const FleetOverviewPage: React.FC = () => {
  const { state } = useApp();
  const [, setRefreshing] = useState(false);

  const activeShips = useMemo(() => {
    return mockShips.filter(s => s.status !== 'maintenance');
  }, []);

  const activeVoyages = useMemo(() => {
    return mockVoyages.filter(v =>
      v.status === 'sailing' || v.status === 'anchored' ||
      v.status === 'loading' || v.status === 'unloading' || v.status === 'exception'
    ).slice(0, 5);
  }, []);

  const pendingExceptions = useMemo(() => {
    return mockExceptions.filter(e => e.status === 'pending' || e.status === 'processing').slice(0, 3);
  }, []);

  useDidShow(() => {
    console.log('[FleetOverviewPage] 页面显示');
  });

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const handleShipClick = (_ship: Ship) => {
    Taro.navigateTo({
      url: '/pages/ship/index'
    });
  };

  const handleVoyageClick = (voyage: Voyage) => {
    Taro.navigateTo({
      url: `/pages/voyage-detail/index?id=${voyage.id}`
    });
  };

  const handleExceptionClick = (exception: Exception) => {
    Taro.navigateTo({
      url: `/pages/exception-detail/index?id=${exception.id}`
    });
  };

  const handleExport = () => {
    Taro.navigateTo({
      url: '/pages/export/index'
    });
  };

  const getShipInitial = (name: string): string => {
    return name.charAt(0);
  };

  const getShipIcon = (status: string): string => {
    const map: Record<string, string> = {
      sailing: '🚢',
      anchored: '⚓',
      docked: '🏝️',
      maintenance: '🔧'
    };
    return map[status] || '🚢';
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>船队总览</Text>
        <Text className={styles.subtitle}>实时监控船队运行状态</Text>
      </View>

      <View className={styles.statsGrid}>
        <View className={classnames(styles.statCard, styles.sailing)}>
          <Text className={styles.statIcon}>🚢</Text>
          <Text className={styles.statValue}>{mockFleetOverview.sailingShips}</Text>
          <Text className={styles.statLabel}>航行中</Text>
        </View>

        <View className={classnames(styles.statCard, styles.anchored)}>
          <Text className={styles.statIcon}>⚓</Text>
          <Text className={styles.statValue}>{mockFleetOverview.anchoredShips}</Text>
          <Text className={styles.statLabel}>锚泊中</Text>
        </View>

        <View className={classnames(styles.statCard, styles.exception)}>
          <Text className={styles.statIcon}>⚠️</Text>
          <Text className={styles.statValue}>{mockFleetOverview.pendingExceptions}</Text>
          <Text className={styles.statLabel}>待处理异常</Text>
        </View>

        <View className={classnames(styles.statCard, styles.completed)}>
          <Text className={styles.statIcon}>✅</Text>
          <Text className={styles.statValue}>{mockFleetOverview.todayCompletedVoyages}</Text>
          <Text className={styles.statLabel}>今日完成</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>🚢</Text>
            船舶动态
          </Text>
          <Text
            className={styles.viewAll}
            onClick={() => Taro.navigateTo({ url: '/pages/ship/index' })}
          >
            查看全部 -&gt;
          </Text>
        </View>

        <View className={styles.shipList}>
          {activeShips.map((ship) => {
            const statusConfig = getShipStatusConfig(ship.status);

            return (
              <View
                className={styles.shipItem}
                key={ship.id}
                onClick={() => handleShipClick(ship)}
              >
                <View className={styles.shipIcon}>
                  {getShipInitial(ship.name)}
                </View>
                <View className={styles.shipInfo}>
                  <Text className={styles.shipName}>{ship.name}</Text>
                  <Text className={styles.shipVoyage}>
                    {ship.currentVoyageNo || '无航次任务'}
                  </Text>
                  <Text className={styles.shipRoute}>
                    {ship.position.latitude.toFixed(4)}, {ship.position.longitude.toFixed(4)}
                  </Text>
                </View>
                <View className={styles.shipStatus}>
                  <View className={classnames(styles.statusTag, styles[ship.status])}>
                    {getShipIcon(ship.status)} {statusConfig.text}
                  </View>
                  <Text className={styles.shipSpeed}>
                    {ship.status === 'sailing' ? formatSpeed(ship.position.speed) : '航速 0 节'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📋</Text>
            进行中航次
          </Text>
          <Text
            className={styles.viewAll}
            onClick={() => Taro.navigateTo({ url: '/pages/voyage/index' })}
          >
            查看全部 -&gt;
          </Text>
        </View>

        <View className={styles.voyageList}>
          {activeVoyages.map((voyage) => {
            const statusConfig = getVoyageStatusConfig(voyage.status);

            return (
              <View
                className={styles.voyageItem}
                key={voyage.id}
                onClick={() => handleVoyageClick(voyage)}
              >
                <View className={styles.voyageInfo}>
                  <Text className={styles.voyageNo}>{voyage.voyageNo}</Text>
                  <Text className={styles.voyageRoute}>
                    {voyage.loadingPort} -&gt; {voyage.unloadingPort}
                  </Text>
                  <View className={styles.voyageProgress}>
                    <View className={styles.progressBar}>
                      <View
                        className={styles.progressFill}
                        style={{ width: `${voyage.progress}%` }}
                      />
                    </View>
                    <Text className={styles.progressText}>
                      {formatPercentage(voyage.progress)}
                    </Text>
                  </View>
                </View>
                <View className={styles.voyageStatus}>
                  <View className={classnames(styles.statusTag, styles[voyage.status])}>
                    {statusConfig.text}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {pendingExceptions.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>⚠️</Text>
              待处理异常
            </Text>
            <Text
              className={styles.viewAll}
              onClick={() => Taro.navigateTo({ url: '/pages/exception/index' })}
            >
              查看全部 -&gt;
            </Text>
          </View>

          <View className={styles.exceptionList}>
            {pendingExceptions.map((exception) => {
              const statusConfig = getExceptionStatusConfig(exception.status);

              return (
                <View
                  className={styles.exceptionItem}
                  key={exception.id}
                  onClick={() => handleExceptionClick(exception)}
                >
                  <View className={styles.exceptionIcon}>⚠️</View>
                  <View className={styles.exceptionInfo}>
                    <Text className={styles.exceptionTitle}>{exception.title}</Text>
                    <Text className={styles.exceptionShip}>{exception.shipName}</Text>
                    <Text className={styles.exceptionTime}>
                      {formatDateTime(exception.createTime)}
                    </Text>
                  </View>
                  <View className={styles.exceptionStatus}>
                    <View className={classnames(styles.statusTag, styles[exception.status])}>
                      {statusConfig.text}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />

      {state.userRole === 'dispatcher' && (
        <View className={styles.actionBtn} onClick={handleExport}>
          导出航次记录
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default FleetOverviewPage;
