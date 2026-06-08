import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Input, Picker } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { mockVoyages } from '@/data/voyage';
import { mockShips } from '@/data/ship';
import {
  loadingRecordService,
  oilWaterSupplyService,
  exceptionService,
  messageService,
  onDataChange,
  getCurrentDateTime
} from '@/services/dataService';
import {
  getVoyageStatusConfig,
  getExceptionStatusConfig,
  formatDate,
  formatWeight
} from '@/utils/format';
import type { Voyage, Ship, VoyageBoardSummary } from '@/types';

const shipFilterOptions = [
  { key: 'all', label: '全部船舶' },
  ...mockShips.map(s => ({ key: s.id, label: s.name }))
];

const voyageStatusOptions = [
  { key: 'all', label: '全部状态' },
  { key: 'sailing', label: '航行中' },
  { key: 'anchored', label: '锚泊' },
  { key: 'loading', label: '装货中' },
  { key: 'unloading', label: '卸货中' },
  { key: 'completed', label: '已完成' },
  { key: 'exception', label: '异常' }
];

const exceptionStatusOptions = [
  { key: 'all', label: '全部异常' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
  { key: 'closed', label: '已关闭' }
];

const VoyageBoardPage: React.FC = () => {
  const { state } = useApp();
  const [dataVersion, setDataVersion] = useState(0);
  const [shipFilter, setShipFilter] = useState('all');
  const [voyageStatusFilter, setVoyageStatusFilter] = useState('all');
  const [exceptionStatusFilter, setExceptionStatusFilter] = useState('all');
  const [selectedVoyageId, setSelectedVoyageId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const reloadData = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  useDidShow(() => {
    const unbind = onDataChange(() => {
      reloadData();
    });
    return () => unbind && unbind();
  });

  usePullDownRefresh(() => {
    setRefreshing(true);
    reloadData();
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const filteredVoyages = useMemo(() => {
    let result = [...mockVoyages];
    
    if (shipFilter !== 'all') {
      result = result.filter(v => v.shipId === shipFilter);
    }
    
    if (voyageStatusFilter !== 'all') {
      result = result.filter(v => v.status === voyageStatusFilter);
    }
    
    if (exceptionStatusFilter !== 'all') {
      const voyageIdsWithException = exceptionService.getByStatus(exceptionStatusFilter)
        .map(e => e.voyageId);
      result = result.filter(v => voyageIdsWithException.includes(v.id));
    }
    
    return result;
  }, [shipFilter, voyageStatusFilter, exceptionStatusFilter, dataVersion]);

  const getVoyageSummary = useCallback((voyageId: string): VoyageBoardSummary => {
    const loadingRecords = loadingRecordService.getByVoyageId(voyageId);
    const supplies = oilWaterSupplyService.getByVoyageId(voyageId);
    const exceptions = exceptionService.getByVoyageId(voyageId);
    const messages = messageService.getByType('all').filter(m => m.voyageId === voyageId);
    
    return {
      loadingCount: loadingRecords.length,
      loadingConfirmedCount: loadingRecords.filter(r => r.status === 'confirmed').length,
      supplyCount: supplies.length,
      exceptionCount: exceptions.length,
      exceptionPendingCount: exceptions.filter(e => e.status === 'pending' || e.status === 'processing').length,
      messageCount: messages.length,
      messageReadCount: messages.filter(m => m.isRead).length
    };
  }, [dataVersion]);

  const selectedVoyage = useMemo(() => {
    if (!selectedVoyageId) return null;
    return mockVoyages.find(v => v.id === selectedVoyageId) || null;
  }, [selectedVoyageId, dataVersion]);

  const selectedSummary = useMemo(() => {
    if (!selectedVoyageId) return null;
    return getVoyageSummary(selectedVoyageId);
  }, [selectedVoyageId, getVoyageSummary]);

  const selectedLoadingRecords = useMemo(() => {
    if (!selectedVoyageId) return [];
    return loadingRecordService.getByVoyageId(selectedVoyageId);
  }, [selectedVoyageId, dataVersion]);

  const selectedSupplies = useMemo(() => {
    if (!selectedVoyageId) return [];
    return oilWaterSupplyService.getByVoyageId(selectedVoyageId);
  }, [selectedVoyageId, dataVersion]);

  const selectedExceptions = useMemo(() => {
    if (!selectedVoyageId) return [];
    return exceptionService.getByVoyageId(selectedVoyageId);
  }, [selectedVoyageId, dataVersion]);

  const selectedMessages = useMemo(() => {
    if (!selectedVoyageId) return [];
    return messageService.getByType('all').filter(m => m.voyageId === selectedVoyageId);
  }, [selectedVoyageId, dataVersion]);

  const handleVoyageClick = (voyage: Voyage) => {
    setSelectedVoyageId(voyage.id);
  };

  const handleBackToList = () => {
    setSelectedVoyageId(null);
  };

  const handleViewDetail = (page: string, id?: string) => {
    const urls: Record<string, string> = {
      voyage: `/pages/voyage-detail/index?id=${selectedVoyageId}`,
      loading: '/pages/loading/index',
      exception: id ? `/pages/exception-detail/index?id=${id}` : '/pages/exception/index',
      message: '/pages/message/index'
    };
    Taro.navigateTo({ url: urls[page] });
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      loading: '📦',
      unloading: '📤',
      fuel: '⛽',
      water: '💧',
      lubricant: '🛢️',
      congestion: '🚧',
      weather: '🌧️',
      equipment: '🔧',
      other: '⚠️',
      dispatch: '📋',
      safety: '🛡️',
      system: '🔔',
      notification: '📢'
    };
    return icons[type] || '📄';
  };

  if (selectedVoyage && selectedSummary) {
    return (
      <ScrollView className={styles.pageContainer} scrollY>
        <View className={styles.detailHeader}>
          <Text className={styles.backBtn} onClick={handleBackToList}>← 返回</Text>
          <Text className={styles.detailTitle}>{selectedVoyage.voyageNo}</Text>
          <Text className={styles.detailShip}>{selectedVoyage.shipName}</Text>
          <View className={classnames(styles.statusTag, styles[selectedVoyage.status])}>
            {selectedVoyage.statusText}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>📊 执行概览</Text>
          <View className={styles.summaryGrid}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>
                {selectedSummary.loadingConfirmedCount}/{selectedSummary.loadingCount}
              </Text>
              <Text className={styles.summaryLabel}>装卸确认</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{selectedSummary.supplyCount}</Text>
              <Text className={styles.summaryLabel}>油水补给</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={classnames(
                styles.summaryValue,
                selectedSummary.exceptionPendingCount > 0 && styles.warning
              )}>
                {selectedSummary.exceptionPendingCount}/{selectedSummary.exceptionCount}
              </Text>
              <Text className={styles.summaryLabel}>异常待处理</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>
                {selectedSummary.messageReadCount}/{selectedSummary.messageCount}
              </Text>
              <Text className={styles.summaryLabel}>消息回执</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📦 装卸记录</Text>
            <Text 
              className={styles.sectionAction} 
              onClick={() => handleViewDetail('voyage')}
            >
              查看全部 →
            </Text>
          </View>
          {selectedLoadingRecords.length === 0 ? (
            <View className={styles.emptyState}>
              <Text>暂无装卸记录</Text>
            </View>
          ) : (
            selectedLoadingRecords.map(record => (
              <View key={record.id} className={styles.recordCard}>
                <View className={styles.recordIcon}>{getTypeIcon(record.type)}</View>
                <View className={styles.recordInfo}>
                  <Text className={styles.recordTitle}>
                    {record.type === 'loading' ? '装货' : '卸货'} - {record.cargoName}
                  </Text>
                  <Text className={styles.recordDesc}>
                    {record.port} | 计划: {record.plannedWeight}{record.unit}
                    {record.status === 'confirmed' && ` | 实际: ${record.actualWeight}${record.unit}`}
                  </Text>
                  <Text className={styles.recordTime}>
                    {record.status === 'confirmed' 
                      ? `确认时间: ${record.confirmTime}` 
                      : '状态: 待确认'}
                  </Text>
                </View>
                <View className={classnames(
                  styles.recordStatus,
                  record.status === 'confirmed' ? styles.confirmed : styles.pending
                )}>
                  {record.statusText}
                </View>
              </View>
            ))
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>⛽ 油水补给</Text>
            <Text 
              className={styles.sectionAction} 
              onClick={() => handleViewDetail('loading')}
            >
              查看全部 →
            </Text>
          </View>
          {selectedSupplies.length === 0 ? (
            <View className={styles.emptyState}>
              <Text>暂无补给记录</Text>
            </View>
          ) : (
            selectedSupplies.slice(0, 3).map(supply => (
              <View key={supply.id} className={styles.recordCard}>
                <View className={styles.recordIcon}>{getTypeIcon(supply.type)}</View>
                <View className={styles.recordInfo}>
                  <Text className={styles.recordTitle}>
                    {supply.type === 'fuel' ? '燃油补给' : supply.type === 'water' ? '淡水补给' : '润滑油补给'}
                  </Text>
                  <Text className={styles.recordDesc}>
                    {supply.port} | {supply.quantity}{supply.unit} | {supply.supplier}
                  </Text>
                  <Text className={styles.recordTime}>记录时间: {supply.recordTime}</Text>
                </View>
                <Text className={styles.recordAmount}>¥{supply.amount.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>⚠️ 异常记录</Text>
            <Text 
              className={styles.sectionAction} 
              onClick={() => handleViewDetail('exception')}
            >
              查看全部 →
            </Text>
          </View>
          {selectedExceptions.length === 0 ? (
            <View className={styles.emptyState}>
              <Text>暂无异常记录</Text>
            </View>
          ) : (
            selectedExceptions.map(exp => (
              <View 
                key={exp.id} 
                className={styles.recordCard}
                onClick={() => handleViewDetail('exception', exp.id)}
              >
                <View className={styles.recordIcon}>{getTypeIcon(exp.type)}</View>
                <View className={styles.recordInfo}>
                  <Text className={styles.recordTitle}>{exp.title}</Text>
                  <Text className={styles.recordDesc}>
                    {exp.location} | {exp.occurrenceTime}
                    {exp.handler && ` | 处理人: ${exp.handler}`}
                  </Text>
                  {exp.handleResult && (
                    <Text className={styles.recordResult}>
                      处理意见: {exp.handleResult.slice(0, 30)}
                      {exp.handleResult.length > 30 ? '...' : ''}
                    </Text>
                  )}
                </View>
                <View className={classnames(
                  styles.recordStatus,
                  styles[`exp_${exp.status}`]
                )}>
                  {exp.statusText}
                </View>
              </View>
            ))
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📨 消息记录</Text>
            <Text 
              className={styles.sectionAction} 
              onClick={() => handleViewDetail('message')}
            >
              查看全部 →
            </Text>
          </View>
          {selectedMessages.length === 0 ? (
            <View className={styles.emptyState}>
              <Text>暂无相关消息</Text>
            </View>
          ) : (
            selectedMessages.slice(0, 3).map(msg => (
              <View key={msg.id} className={styles.recordCard}>
                <View className={styles.recordIcon}>{getTypeIcon(msg.type)}</View>
                <View className={styles.recordInfo}>
                  <Text className={styles.recordTitle}>{msg.title}</Text>
                  <Text className={styles.recordDesc}>
                    发送人: {msg.sender} | {msg.createTime}
                  </Text>
                </View>
                <View className={classnames(
                  styles.recordStatus,
                  msg.isRead ? styles.read : styles.unread
                )}>
                  {msg.isRead ? '已读' : '未读'}
                </View>
              </View>
            ))
          )}
        </View>

        <View className={styles.footerPadding} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>航次执行看板</Text>
        <Text className={styles.subtitle}>调度员视角 - 航次执行全流程监控</Text>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterRow}>
          <View className={styles.filterItem}>
            <Text className={styles.filterLabel}>船舶</Text>
            <Picker
              mode="selector"
              range={shipFilterOptions.map(o => o.label)}
              value={shipFilterOptions.findIndex(o => o.key === shipFilter)}
              onChange={(e) => {
                const idx = parseInt(String(e.detail.value));
                setShipFilter(shipFilterOptions[idx].key);
              }}
            >
              <View className={styles.filterPicker}>
                {shipFilterOptions.find(o => o.key === shipFilter)?.label}
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
          </View>
          <View className={styles.filterItem}>
            <Text className={styles.filterLabel}>航次状态</Text>
            <Picker
              mode="selector"
              range={voyageStatusOptions.map(o => o.label)}
              value={voyageStatusOptions.findIndex(o => o.key === voyageStatusFilter)}
              onChange={(e) => {
                const idx = parseInt(String(e.detail.value));
                setVoyageStatusFilter(voyageStatusOptions[idx].key);
              }}
            >
              <View className={styles.filterPicker}>
                {voyageStatusOptions.find(o => o.key === voyageStatusFilter)?.label}
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
          </View>
        </View>
        <View className={styles.filterRow}>
          <View className={styles.filterItem}>
            <Text className={styles.filterLabel}>异常状态</Text>
            <Picker
              mode="selector"
              range={exceptionStatusOptions.map(o => o.label)}
              value={exceptionStatusOptions.findIndex(o => o.key === exceptionStatusFilter)}
              onChange={(e) => {
                const idx = parseInt(String(e.detail.value));
                setExceptionStatusFilter(exceptionStatusOptions[idx].key);
              }}
            >
              <View className={styles.filterPicker}>
                {exceptionStatusOptions.find(o => o.key === exceptionStatusFilter)?.label}
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
          </View>
          <View className={styles.filterItem}>
            <Text className={styles.filterLabel}>筛选结果</Text>
            <View className={styles.filterPicker}>
              共 {filteredVoyages.length} 条
            </View>
          </View>
        </View>
      </View>

      <View className={styles.voyageList}>
        {filteredVoyages.length === 0 ? (
          <View className={styles.emptyState}>
            <Text>暂无符合条件的航次</Text>
          </View>
        ) : (
          filteredVoyages.map(voyage => {
            const summary = getVoyageSummary(voyage.id);
            const ship = mockShips.find(s => s.id === voyage.shipId);
            return (
              <View 
                key={voyage.id} 
                className={styles.voyageCard}
                onClick={() => handleVoyageClick(voyage)}
              >
                <View className={styles.voyageHeader}>
                  <View className={styles.voyageInfo}>
                    <Text className={styles.voyageNo}>{voyage.voyageNo}</Text>
                    <Text className={styles.voyageShip}>{ship?.name}</Text>
                  </View>
                  <View className={classnames(styles.statusTag, styles[voyage.status])}>
                    {voyage.statusText}
                  </View>
                </View>
                
                <View className={styles.voyageRoute}>
                  <Text className={styles.routeText}>
                    {voyage.loadingPort} → {voyage.unloadingPort}
                  </Text>
                  <Text className={styles.routeDate}>
                    {formatDate(voyage.departureTime)} - {formatDate(voyage.estimatedArrivalTime)}
                  </Text>
                </View>

                <View className={styles.voyageCargo}>
                  <Text className={styles.cargoText}>
                    载货: {voyage.cargo.map(c => c.name).join('、')} | 
                    总重: {formatWeight(voyage.totalWeight)}
                  </Text>
                </View>

                <View className={styles.voyageStats}>
                  <View className={styles.statBadge}>
                    <Text className={styles.statIcon}>📦</Text>
                    <Text className={styles.statText}>
                      {summary.loadingConfirmedCount}/{summary.loadingCount}
                    </Text>
                  </View>
                  <View className={styles.statBadge}>
                    <Text className={styles.statIcon}>⛽</Text>
                    <Text className={styles.statText}>{summary.supplyCount}</Text>
                  </View>
                  <View className={classnames(
                    styles.statBadge,
                    summary.exceptionPendingCount > 0 && styles.statWarning
                  )}>
                    <Text className={styles.statIcon}>⚠️</Text>
                    <Text className={styles.statText}>
                      {summary.exceptionPendingCount}/{summary.exceptionCount}
                    </Text>
                  </View>
                  <View className={styles.statBadge}>
                    <Text className={styles.statIcon}>📨</Text>
                    <Text className={styles.statText}>
                      {summary.messageReadCount}/{summary.messageCount}
                    </Text>
                  </View>
                </View>

                <View className={styles.progressBar}>
                  <View 
                    className={styles.progressFill} 
                    style={{ width: `${voyage.progress}%` }}
                  />
                  <Text className={styles.progressText}>
                    进度 {voyage.progress}%
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View className={styles.footerPadding} />
    </ScrollView>
  );
};

export default VoyageBoardPage;
