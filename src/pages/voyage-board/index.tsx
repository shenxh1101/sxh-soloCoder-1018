import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Input, Picker, Textarea, Button } from '@tarojs/components';
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
  messageReceiptService,
  onDataChange,
  getCurrentDateTime
} from '@/services/dataService';
import {
  getVoyageStatusConfig,
  getExceptionStatusConfig,
  formatDate,
  formatWeight
} from '@/utils/format';
import type { Voyage, Ship, VoyageBoardSummary, Exception } from '@/types';

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
  const [exceptionTab, setExceptionTab] = useState('all');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [handleResult, setHandleResult] = useState('');
  const [handleAction, setHandleAction] = useState<'start' | 'resolve' | 'close'>('start');

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

  const groupedExceptions = useMemo(() => {
    if (!selectedVoyageId) return { all: [], pending: [], processing: [], resolved: [] };
    
    const all = exceptionService.getByVoyageId(selectedVoyageId);
    return {
      all,
      pending: all.filter(e => e.status === 'pending'),
      processing: all.filter(e => e.status === 'processing'),
      resolved: all.filter(e => e.status === 'resolved' || e.status === 'closed')
    };
  }, [selectedVoyageId, dataVersion]);

  const displayedExceptions = useMemo(() => {
    return groupedExceptions[exceptionTab as keyof typeof groupedExceptions] || [];
  }, [groupedExceptions, exceptionTab]);

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

  const handleExceptionClick = (exception: Exception) => {
    if (exception.status === 'pending' || exception.status === 'processing') {
      setSelectedException(exception);
      setHandleResult(exception.handleResult || '');
      if (exception.status === 'pending') {
        setHandleAction('start');
      } else {
        setHandleAction('resolve');
      }
      setShowExceptionModal(true);
    } else {
      handleViewDetail('exception', exception.id);
    }
  };

  const handleProcessException = () => {
    if (!selectedException) return;
    
    const handler = state.userRole === 'dispatcher' ? '李调度' : '张船长';
    const now = getCurrentDateTime();

    if (handleAction === 'start') {
      exceptionService.startProcessing(selectedException.id, handler);
      Taro.showToast({ title: '已开始处理', icon: 'success' });
    } else if (handleAction === 'resolve') {
      if (!handleResult.trim()) {
        Taro.showToast({ title: '请填写处理意见', icon: 'none' });
        return;
      }
      exceptionService.resolveException(selectedException.id, handleResult, handler);
      Taro.showToast({ title: '已标记解决', icon: 'success' });
    } else if (handleAction === 'close') {
      if (!handleResult.trim()) {
        Taro.showToast({ title: '请填写关闭原因', icon: 'none' });
        return;
      }
      exceptionService.closeException(selectedException.id, handleResult, handler);
      Taro.showToast({ title: '已关闭异常', icon: 'success' });
    }

    setShowExceptionModal(false);
    setSelectedException(null);
    setHandleResult('');
    reloadData();
  };

  const getMessageReceipts = (messageId: string) => {
    return messageReceiptService.getByMessageId(messageId);
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
            <Text className={styles.sectionTitle}>⚠️ 异常处理跟进</Text>
            <Text 
              className={styles.sectionAction} 
              onClick={() => handleViewDetail('exception')}
            >
              查看全部 →
            </Text>
          </View>
          
          <View className={styles.exceptionTabs}>
            <View 
              className={classnames(styles.tabItem, exceptionTab === 'all' && styles.active)}
              onClick={() => setExceptionTab('all')}
            >
              <Text className={styles.tabText}>全部</Text>
              <Text className={styles.tabCount}>{groupedExceptions.all.length}</Text>
            </View>
            <View 
              className={classnames(styles.tabItem, exceptionTab === 'pending' && styles.active)}
              onClick={() => setExceptionTab('pending')}
            >
              <Text className={styles.tabText}>待处理</Text>
              <Text className={styles.tabCount}>{groupedExceptions.pending.length}</Text>
            </View>
            <View 
              className={classnames(styles.tabItem, exceptionTab === 'processing' && styles.active)}
              onClick={() => setExceptionTab('processing')}
            >
              <Text className={styles.tabText}>处理中</Text>
              <Text className={styles.tabCount}>{groupedExceptions.processing.length}</Text>
            </View>
            <View 
              className={classnames(styles.tabItem, exceptionTab === 'resolved' && styles.active)}
              onClick={() => setExceptionTab('resolved')}
            >
              <Text className={styles.tabText}>已解决</Text>
              <Text className={styles.tabCount}>{groupedExceptions.resolved.length}</Text>
            </View>
          </View>
          
          {displayedExceptions.length === 0 ? (
            <View className={styles.emptyState}>
              <Text>暂无{exceptionTab === 'all' ? '异常' : exceptionTab === 'pending' ? '待处理' : exceptionTab === 'processing' ? '处理中' : '已解决'}异常记录</Text>
            </View>
          ) : (
            displayedExceptions.map(exp => (
              <View 
                key={exp.id} 
                className={styles.exceptionCard}
                onClick={() => handleExceptionClick(exp)}
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
                <View className={styles.exceptionActions}>
                  <View className={classnames(
                    styles.recordStatus,
                    styles[`exp_${exp.status}`]
                  )}>
                    {exp.statusText}
                  </View>
                  {(exp.status === 'pending' || exp.status === 'processing') && (
                    <Text className={styles.processBtn}>
                      {exp.status === 'pending' ? '处理' : '跟进'}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📨 消息记录与回执</Text>
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
            selectedMessages.map(msg => {
              const receipts = getMessageReceipts(msg.id);
              return (
                <View key={msg.id} className={styles.messageCard}>
                  <View className={styles.messageHeader}>
                    <View className={styles.recordIcon}>{getTypeIcon(msg.type)}</View>
                    <View className={styles.messageInfo}>
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
                  
                  {msg.type === 'dispatch' && receipts.length > 0 && (
                    <View className={styles.receiptSection}>
                      <Text className={styles.receiptTitle}>确认回执 ({receipts.length}人)</Text>
                      <View className={styles.receiptList}>
                        {receipts.map(receipt => (
                          <View key={receipt.id} className={styles.receiptItem}>
                            <Text className={styles.receiptName}>👤 {receipt.receiverName}</Text>
                            <Text className={styles.receiptTime}>{receipt.confirmTime}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {showExceptionModal && selectedException && (
          <View className={styles.modalOverlay} onClick={() => setShowExceptionModal(false)}>
            <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <View className={styles.modalHeader}>
                <Text className={styles.modalTitle}>异常处理</Text>
                <Text className={styles.modalClose} onClick={() => setShowExceptionModal(false)}>×</Text>
              </View>
              
              <ScrollView className={styles.modalBody} scrollY>
                <View className={styles.exceptionInfo}>
                  <View className={styles.exceptionInfoRow}>
                    <Text className={styles.exceptionInfoLabel}>异常标题</Text>
                    <Text className={styles.exceptionInfoValue}>{selectedException.title}</Text>
                  </View>
                  <View className={styles.exceptionInfoRow}>
                    <Text className={styles.exceptionInfoLabel}>异常类型</Text>
                    <Text className={styles.exceptionInfoValue}>{selectedException.typeText}</Text>
                  </View>
                  <View className={styles.exceptionInfoRow}>
                    <Text className={styles.exceptionInfoLabel}>发生位置</Text>
                    <Text className={styles.exceptionInfoValue}>{selectedException.location}</Text>
                  </View>
                  <View className={styles.exceptionInfoRow}>
                    <Text className={styles.exceptionInfoLabel}>发生时间</Text>
                    <Text className={styles.exceptionInfoValue}>{selectedException.occurrenceTime}</Text>
                  </View>
                  <View className={styles.exceptionInfoRow}>
                    <Text className={styles.exceptionInfoLabel}>异常描述</Text>
                    <Text className={styles.exceptionInfoValue}>{selectedException.description}</Text>
                  </View>
                  <View className={styles.exceptionInfoRow}>
                    <Text className={styles.exceptionInfoLabel}>当前状态</Text>
                    <View className={classnames(
                      styles.recordStatus,
                      styles[`exp_${selectedException.status}`]
                    )}>
                      {selectedException.statusText}
                    </View>
                  </View>
                  {selectedException.handler && (
                    <View className={styles.exceptionInfoRow}>
                      <Text className={styles.exceptionInfoLabel}>处理人</Text>
                      <Text className={styles.exceptionInfoValue}>{selectedException.handler}</Text>
                    </View>
                  )}
                </View>

                <View className={styles.actionTabs}>
                  {selectedException.status === 'pending' && (
                    <View 
                      className={classnames(styles.actionTab, handleAction === 'start' && styles.active)}
                      onClick={() => setHandleAction('start')}
                    >
                      <Text>开始处理</Text>
                    </View>
                  )}
                  {(selectedException.status === 'pending' || selectedException.status === 'processing') && (
                    <View 
                      className={classnames(styles.actionTab, handleAction === 'resolve' && styles.active)}
                      onClick={() => setHandleAction('resolve')}
                    >
                      <Text>标记解决</Text>
                    </View>
                  )}
                  {(selectedException.status === 'pending' || selectedException.status === 'processing' || selectedException.status === 'resolved') && (
                    <View 
                      className={classnames(styles.actionTab, handleAction === 'close' && styles.active)}
                      onClick={() => setHandleAction('close')}
                    >
                      <Text>关闭异常</Text>
                    </View>
                  )}
                </View>

                {handleAction !== 'start' && (
                  <View className={styles.formSection}>
                    <Text className={styles.formLabel}>
                      {handleAction === 'resolve' ? '处理意见' : '关闭原因'} <Text className={styles.required}>*</Text>
                    </Text>
                    <Textarea
                      className={styles.formTextarea}
                      placeholder={`请输入${handleAction === 'resolve' ? '处理意见' : '关闭原因'}`}
                      value={handleResult}
                      onInput={(e) => setHandleResult(e.detail.value)}
                      maxlength={500}
                    />
                  </View>
                )}
              </ScrollView>
              
              <View className={styles.modalFooter}>
                <Button className={styles.modalBtnSecondary} onClick={() => setShowExceptionModal(false)}>
                  取消
                </Button>
                <Button className={styles.modalBtnPrimary} onClick={handleProcessException}>
                  {handleAction === 'start' ? '开始处理' : handleAction === 'resolve' ? '确认解决' : '确认关闭'}
                </Button>
              </View>
            </View>
          </View>
        )}

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
