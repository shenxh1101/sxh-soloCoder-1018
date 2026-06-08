import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getVoyageById } from '@/data/voyage';
import { getShipById, getLoadingRecordsByVoyage, getOilWaterSuppliesByVoyage } from '@/data/ship';
import { getVoyageStatusConfig, formatDateTime, formatWeight, formatPercentage } from '@/utils/format';
import type { Voyage, Ship, LoadingRecord, OilWaterSupply } from '@/types';

const VoyageDetailPage: React.FC = () => {
  const { state } = useApp();
  const router = useRouter();
  const [, setRefreshing] = useState(false);

  const voyageId = router.params.id;

  const voyage = useMemo<Voyage | undefined>(() => {
    return getVoyageById(voyageId || '');
  }, [voyageId]);

  const ship = useMemo<Ship | undefined>(() => {
    if (!voyage) return undefined;
    return getShipById(voyage.shipId);
  }, [voyage]);

  const loadingRecords = useMemo<LoadingRecord[]>(() => {
    if (!voyage) return [];
    return getLoadingRecordsByVoyage(voyage.id);
  }, [voyage]);

  const supplies = useMemo<OilWaterSupply[]>(() => {
    if (!voyage) return [];
    return getOilWaterSuppliesByVoyage(voyage.id);
  }, [voyage]);



  useDidShow(() => {
    console.log('[VoyageDetailPage] 页面显示，航次ID:', voyageId);
  });

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const handleArrivalConfirm = () => {
    Taro.showModal({
      title: '到港确认',
      content: '确认已到达目的港？确认后将通知调度中心安排卸货作业。',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '提交中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '到港确认成功', icon: 'success' });
          }, 1000);
        }
      }
    });
  };

  const handleUpdatePosition = () => {
    Taro.navigateTo({
      url: '/pages/ship/index'
    });
  };

  const getPortTypeText = (type: string): string => {
    const map: Record<string, string> = {
      loading: '装货港',
      unloading: '卸货港',
      stopover: '途经港'
    };
    return map[type] || type;
  };

  const getSupplyTypeIcon = (type: string): string => {
    const map: Record<string, string> = {
      fuel: '⛽',
      water: '💧',
      lubricant: '🛢️'
    };
    return map[type] || '📦';
  };

  const getSupplyTypeText = (type: string): string => {
    const map: Record<string, string> = {
      fuel: '燃油补给',
      water: '淡水补给',
      lubricant: '润滑油补给'
    };
    return map[type] || type;
  };

  const getCrewInitial = (name: string): string => {
    return name.charAt(0);
  };

  if (!voyage) {
    return (
      <ScrollView className={styles.pageContainer} scrollY>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>航次不存在</Text>
        </View>
      </ScrollView>
    );
  }

  const statusConfig = getVoyageStatusConfig(voyage.status);

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.header}>
        <Text className={styles.voyageNo}>航次编号：{voyage.voyageNo}</Text>
        <Text className={styles.shipName}>{voyage.shipName}</Text>
        <Text className={styles.route}>{voyage.loadingPort} → {voyage.unloadingPort}</Text>

        <View className={styles.progressSection}>
          <View className={styles.progressLabel}>
            <Text>航行进度</Text>
            <Text>{formatPercentage(voyage.progress)}</Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${voyage.progress}%` }}
            />
          </View>
        </View>

        <View className={styles.statusRow}>
          <View className={styles.statusTag}>
            {statusConfig.text}
          </View>
          <Text className={styles.eta}>
            预计到达：{formatDateTime(voyage.estimatedArrivalTime)}
          </Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>📊</Text>
          基本信息
        </Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>总载货量</Text>
            <Text className={styles.infoValue}>{formatWeight(voyage.totalWeight)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>总航程</Text>
            <Text className={styles.infoValue}>{voyage.distance || '-'} 公里</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>出发时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(voyage.actualDepartureTime || voyage.departureTime)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>预计到达</Text>
            <Text className={styles.infoValue}>{formatDateTime(voyage.estimatedArrivalTime)}</Text>
          </View>
        </View>
      </View>

      {ship && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>🚢</Text>
            船舶信息
          </Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>船舶类型</Text>
              <Text className={styles.infoValue}>{ship.type}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>总吨位</Text>
              <Text className={styles.infoValue}>{ship.tonnage} 吨</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>船长/船宽</Text>
              <Text className={styles.infoValue}>{ship.length}m / {ship.width}m</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>吃水</Text>
              <Text className={styles.infoValue}>{ship.draft}m</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>燃油储量</Text>
              <Text className={styles.infoValue}>{formatPercentage(ship.fuelLevel)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>淡水储量</Text>
              <Text className={styles.infoValue}>{formatPercentage(ship.waterLevel)}</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>📦</Text>
          货物信息
        </Text>
        <View className={styles.cargoList}>
          {voyage.cargo.map((cargo) => (
            <View className={styles.cargoItem} key={cargo.id}>
              <View className={styles.cargoInfo}>
                <Text className={styles.cargoName}>{cargo.name}</Text>
                <Text className={styles.cargoRoute}>{cargo.loadingPort} → {cargo.unloadingPort}</Text>
              </View>
              <Text className={styles.cargoWeight}>{formatWeight(cargo.weight, cargo.unit)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>⚓</Text>
          港口停靠计划
        </Text>
        <View className={styles.portList}>
          {voyage.ports.map((port, index) => {
            const isCompleted = index < voyage.currentPortIndex;
            const isCurrent = index === voyage.currentPortIndex;

            return (
              <View className={styles.portItem} key={port.id}>
                <Text className={styles.portIcon}>
                  {isCompleted ? '✅' : isCurrent ? '📍' : '⏳'}
                </Text>
                <View className={styles.portInfo}>
                  <Text className={styles.portName}>{port.name}</Text>
                  <View>
                    <Text className={styles.portType}>{getPortTypeText(port.type)}</Text>
                  </View>
                  {port.arrivalTime && (
                    <View className={styles.portTime}>
                      <Text className={styles.timeLabel}>实际到达：</Text>
                      <Text>{formatDateTime(port.arrivalTime)}</Text>
                    </View>
                  )}
                  {port.departureTime && (
                    <View className={styles.portTime}>
                      <Text className={styles.timeLabel}>实际离开：</Text>
                      <Text>{formatDateTime(port.departureTime)}</Text>
                    </View>
                  )}
                  {!port.arrivalTime && (
                    <View className={styles.portTime}>
                      <Text className={styles.timeLabel}>预计到达：</Text>
                      <Text>{formatDateTime(port.plannedArrivalTime)}</Text>
                    </View>
                  )}
                  {!port.departureTime && port.type !== 'unloading' && (
                    <View className={styles.portTime}>
                      <Text className={styles.timeLabel}>预计离开：</Text>
                      <Text>{formatDateTime(port.plannedDepartureTime)}</Text>
                    </View>
                  )}
                </View>
                <View className={styles.portStatus}>
                  {isCompleted && <Text className={styles.statusCompleted}>已完成</Text>}
                  {isCurrent && <Text className={styles.statusCurrent}>进行中</Text>}
                  {!isCompleted && !isCurrent && <Text>待执行</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>👥</Text>
          船员名单
        </Text>
        <View className={styles.crewList}>
          {voyage.crew.map((crew, index) => (
            <View className={styles.crewItem} key={index}>
              <View className={styles.crewAvatar}>{getCrewInitial(crew)}</View>
              <Text className={styles.crewName}>{crew}</Text>
            </View>
          ))}
        </View>
      </View>

      {loadingRecords.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📝</Text>
            装卸记录
          </Text>
          <View className={styles.recordList}>
            {loadingRecords.map((record) => (
              <View className={styles.recordItem} key={record.id}>
                <View className={styles.recordHeader}>
                  <Text className={styles.recordTitle}>
                    {record.type === 'loading' ? '装货' : '卸货'} - {record.cargoName}
                  </Text>
                  <Text className={classnames(styles.recordStatus, styles[record.status])}>
                    {record.status === 'confirmed' ? '已确认' : record.status === 'pending' ? '待确认' : '已拒绝'}
                  </Text>
                </View>
                <View className={styles.recordInfo}>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>港口</Text>
                    <Text>{record.port}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>计划重量</Text>
                    <Text>{formatWeight(record.plannedWeight, record.unit)}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>实际重量</Text>
                    <Text>{record.actualWeight > 0 ? formatWeight(record.actualWeight, record.unit) : '-'}</Text>
                  </View>
                  {record.operator && (
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>操作人</Text>
                      <Text>{record.operator}</Text>
                    </View>
                  )}
                  {record.confirmTime && (
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>确认时间</Text>
                      <Text>{formatDateTime(record.confirmTime)}</Text>
                    </View>
                  )}
                  {record.remark && (
                    <View className={styles.infoRow}>
                      <Text className={styles.infoLabel}>备注</Text>
                      <Text>{record.remark}</Text>
                    </View>
                  )}
                </View>
                {record.photos.length > 0 && (
                  <View className={styles.recordPhotos}>
                    {record.photos.map((photo, index) => (
                      <View className={styles.photoItem} key={index}>
                        <Image className={styles.photo} src={photo} mode="aspectFill" />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {supplies.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>⛽</Text>
            油水补给记录
          </Text>
          <View className={styles.supplyList}>
            {supplies.map((supply) => (
              <View className={styles.supplyItem} key={supply.id}>
                <View className={styles.supplyHeader}>
                  <Text className={styles.supplyType}>
                    <Text className={styles.typeIcon}>{getSupplyTypeIcon(supply.type)}</Text>
                    {getSupplyTypeText(supply.type)}
                  </Text>
                  <Text className={styles.supplyTime}>{formatDateTime(supply.recordTime)}</Text>
                </View>
                <View className={styles.supplyInfo}>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>补给港口</Text>
                    <Text className={styles.infoValue}>{supply.port}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>补给数量</Text>
                    <Text className={styles.infoValue}>{supply.quantity} {supply.unit}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>供应商</Text>
                    <Text className={styles.infoValue}>{supply.supplier}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>费用金额</Text>
                    <Text className={styles.infoValue}>¥{supply.amount.toLocaleString()}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>记录人</Text>
                    <Text className={styles.infoValue}>{supply.operator}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 160 }} />

      {state.userRole === 'crew' && voyage.status !== 'completed' && (
        <View className={styles.actionBar}>
          <View className={styles.actionBtn} onClick={handleUpdatePosition}>
            更新动态
          </View>
          <View className={classnames(styles.actionBtn, styles.primary)} onClick={handleArrivalConfirm}>
            到港确认
          </View>
        </View>
      )}

      {state.userRole === 'dispatcher' && (
        <View className={styles.actionBar}>
          <View
            className={styles.actionBtn}
            onClick={() => Taro.navigateTo({ url: '/pages/export/index' })}
          >
            导出航次
          </View>
          <View
            className={classnames(styles.actionBtn, styles.primary)}
            onClick={() => Taro.navigateTo({ url: `/pages/exception/index?voyageId=${voyage.id}` })}
          >
            查看异常
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default VoyageDetailPage;
