import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Input, Button, Switch, Image } from '@tarojs/components';
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
  shipDynamicService,
  arrivalConfirmationService,
  messageService,
  onDataChange,
  getCurrentDateTime
} from '@/services/dataService';
import { formatDateTime } from '@/utils/format';
import type { 
  Voyage, VoyageTask, VoyageTaskType, LoadingRecord, OilWaterSupply, Exception, ShipDynamic, ArrivalConfirmation } from '@/types';

const VoyageTasksPage: React.FC = () => {
  const { state } = useApp();
  const [dataVersion, setDataVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VoyageTask | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [arrivalForm, setArrivalForm] = useState({
    draft: '',
    waterDepth: '',
    pilotOnBoard: false,
    tugUsed: false,
    remark: '',
    photos: [] as string[]
  });

  const currentVoyage = useMemo(() => {
    const activeVoyages = mockVoyages.filter(v => 
      v.status === 'sailing' || v.status === 'anchored' || 
      v.status === 'loading' || v.status === 'unloading'
    );
    return activeVoyages.length > 0 ? activeVoyages[0] : null;
  }, []);

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

  const tasks = useMemo((): VoyageTask[] => {
    if (!currentVoyage) return [];
    
    const loadingRecords = loadingRecordService.getByVoyageId(currentVoyage.id);
    const supplies = oilWaterSupplyService.getByVoyageId(currentVoyage.id);
    const exceptions = exceptionService.getByVoyageId(currentVoyage.id);
    const latestDynamic = shipDynamicService.getLatestByVoyageId(currentVoyage.id);
    const arrivalConfirmations = arrivalConfirmationService.getByVoyageId(currentVoyage.id);
    
    const confirmedLoading = loadingRecords.filter(r => r.status === 'confirmed');
    const pendingLoading = loadingRecords.filter(r => r.status === 'pending');
    
    const taskList: VoyageTask[] = [];
    
    if (latestDynamic) {
      taskList.push({
        id: `task_dynamic_${currentVoyage.id}`,
        voyageId: currentVoyage.id,
        type: 'dynamic',
        typeText: '更新动态',
        title: '更新船舶动态',
        description: `最新位置: ${latestDynamic.positionText} | 航速: ${latestDynamic.speed}节 | 天气: ${latestDynamic.weather}`,
        status: 'completed',
        statusText: '已完成',
        submitTime: latestDynamic.updateTime,
        submitter: latestDynamic.remark || '张船长',
        relatedRecordId: latestDynamic.id,
        required: true
      });
    } else {
      taskList.push({
        id: `task_dynamic_${currentVoyage.id}`,
        voyageId: currentVoyage.id,
        type: 'dynamic',
        typeText: '更新动态',
        title: '更新船舶动态',
        description: '每4小时更新一次位置、航速和航行状态',
        status: 'pending',
        statusText: '待更新',
        required: true
      });
    }
    
    if (confirmedLoading.length > 0) {
      confirmedLoading.forEach(record => {
        taskList.push({
          id: `task_loading_${record.id}`,
          voyageId: currentVoyage.id,
          type: 'loading',
          typeText: '装卸确认',
          title: `${record.type === 'loading' ? '装货' : '卸货'}确认 - ${record.cargoName}`,
          description: `${record.port} | 计划: ${record.plannedWeight}${record.unit} | 实际: ${record.actualWeight}${record.unit}`,
          status: 'completed',
          statusText: '已确认',
          submitTime: record.confirmTime,
          submitter: record.operator,
          relatedRecordId: record.id,
          required: true
        });
      });
    }
    
    if (pendingLoading.length > 0) {
      pendingLoading.forEach(record => {
        taskList.push({
          id: `task_loading_${record.id}`,
          voyageId: currentVoyage.id,
          type: 'loading',
          typeText: '装卸确认',
          title: `${record.type === 'loading' ? '装货' : '卸货'}确认 - ${record.cargoName}`,
          description: `${record.port} | 计划: ${record.plannedWeight}${record.unit}`,
          status: 'pending',
          statusText: '待确认',
          required: true
        });
      });
    }
    
    if (supplies.length > 0) {
      supplies.forEach(supply => {
        const typeText = supply.type === 'fuel' ? '燃油补给' : supply.type === 'water' ? '淡水补给' : '润滑油补给';
        taskList.push({
          id: `task_supply_${supply.id}`,
          voyageId: currentVoyage.id,
          type: 'supply',
          typeText: '记录补给',
          title: typeText,
          description: `${supply.port} | ${supply.quantity}${supply.unit} | 供应商: ${supply.supplier}`,
          status: 'completed',
          statusText: '已记录',
          submitTime: supply.recordTime,
          submitter: supply.operator,
          relatedRecordId: supply.id,
          required: false
        });
      });
    }
    
    if (exceptions.length > 0) {
      exceptions.forEach(exp => {
        taskList.push({
          id: `task_exception_${exp.id}`,
          voyageId: currentVoyage.id,
          type: 'exception',
          typeText: '异常上报',
          title: exp.title,
          description: `${exp.typeText} | ${exp.location} | ${exp.occurrenceTime}`,
          status: 'completed',
          statusText: exp.statusText,
          submitTime: exp.createTime,
          submitter: exp.reporter,
          relatedRecordId: exp.id,
          required: false
        });
      });
    }
    
    if (arrivalConfirmations.length > 0) {
      arrivalConfirmations.forEach(conf => {
        taskList.push({
          id: `task_arrival_${conf.id}`,
          voyageId: currentVoyage.id,
          type: 'arrival',
          typeText: '到港确认',
          title: `${conf.portType === 'loading' ? '装货港' : '卸货港'}到港确认 - ${conf.port}`,
          description: `吃水: ${conf.draft}m | 水深: ${conf.waterDepth}m | ${conf.pilotOnBoard ? '有引航员' : '无引航员'}`,
          status: 'completed',
          statusText: '已确认',
          submitTime: conf.confirmTime,
          submitter: conf.operator,
          relatedRecordId: conf.id,
          required: true
        });
      });
    } else {
      taskList.push({
      id: `task_arrival_${currentVoyage.id}`,
      voyageId: currentVoyage.id,
      type: 'arrival',
      typeText: '到港确认',
      title: '到港确认',
      description: `预计到达 ${currentVoyage.unloadingPort} 时间: ${currentVoyage.estimatedArrivalTime}`,
      status: 'pending',
      statusText: '待确认',
      required: true
    });
    }
    
    const taskOrder: VoyageTaskType[] = ['dynamic', 'loading', 'supply', 'exception', 'arrival'];
    taskList.sort((a, b) => {
      const orderA = taskOrder.indexOf(a.type);
      const orderB = taskOrder.indexOf(b.type);
      if (orderA !== orderB) return orderA - orderB;
      if (a.status === 'pending' && b.status === 'completed') return -1;
      if (a.status === 'completed' && b.status === 'pending') return 1;
      return 0;
    });
    
    return taskList;
  }, [currentVoyage, dataVersion]);

  const completedCount = useMemo(() => {
    return tasks.filter(t => t.status === 'completed').length;
  }, [tasks]);

  const totalRequired = useMemo(() => {
    return tasks.filter(t => t.required).length;
  }, [tasks]);

  const completedRequired = useMemo(() => {
    return tasks.filter(t => t.required && t.status === 'completed').length;
  }, [tasks]);

  const handleTaskClick = (task: VoyageTask) => {
    if (task.status === 'pending') {
      if (task.type === 'arrival') {
        setShowArrivalModal(true);
      } else {
        const navigateMap: Record<VoyageTaskType, string> = {
          dynamic: '/pages/ship/index',
          loading: '/pages/loading/index',
          supply: '/pages/loading/index',
          exception: '/pages/exception/index',
          arrival: '/pages/voyage/index'
        };
        Taro.navigateTo({ url: navigateMap[task.type] });
      }
    } else {
      setSelectedTask(task);
      setShowDetail(true);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedTask(null);
  };

  const handleCloseArrivalModal = () => {
    setShowArrivalModal(false);
    setArrivalForm({
      draft: '',
      waterDepth: '',
      pilotOnBoard: false,
      tugUsed: false,
      remark: '',
      photos: []
    });
  };

  const handleSubmitArrival = () => {
    if (!currentVoyage) return;
    
    if (!arrivalForm.draft || !arrivalForm.waterDepth) {
      Taro.showToast({ title: '请填写吃水和水深', icon: 'none' });
      return;
    }

    const ship = mockShips.find(s => s.currentVoyageId === currentVoyage.id);
    
    arrivalConfirmationService.addConfirmation({
      voyageId: currentVoyage.id,
      shipId: ship?.id || 's001',
      shipName: ship?.name || currentVoyage.shipName,
      port: currentVoyage.unloadingPort,
      portType: 'unloading',
      arrivalTime: getCurrentDateTime(),
      draft: parseFloat(arrivalForm.draft),
      waterDepth: parseFloat(arrivalForm.waterDepth),
      pilotOnBoard: arrivalForm.pilotOnBoard,
      tugUsed: arrivalForm.tugUsed,
      remark: arrivalForm.remark,
      operator: state.userRole === 'crew' ? '张船长' : '调度员',
      photos: arrivalForm.photos
    });

    Taro.showToast({ title: '到港确认成功', icon: 'success' });
    handleCloseArrivalModal();
    reloadData();
  };

  const getTaskIcon = (type: VoyageTaskType): string => {
    const icons: Record<VoyageTaskType, string> = {
      dynamic: '📍',
      loading: '📦',
      supply: '⛽',
      exception: '⚠️',
      arrival: '🏁'
    };
    return icons[type];
  };

  const getRelatedRecordDetail = (task: VoyageTask): string => {
    if (!task.relatedRecordId) return '';
    
    switch (task.type) {
      case 'dynamic':
        const dynamic = shipDynamicService.getById(task.relatedRecordId) as ShipDynamic;
        if (dynamic) {
          return `位置: ${dynamic.positionText}\n纬度: ${dynamic.latitude}\n经度: ${dynamic.longitude}\n航向: ${dynamic.heading}°\n航速: ${dynamic.speed}节\n天气: ${dynamic.weather}\n风力: ${dynamic.windSpeed}级 ${dynamic.windDirection}\n浪高: ${dynamic.waveHeight}m\n${dynamic.remark ? `备注: ${dynamic.remark}` : ''}`;
        }
        break;
      case 'loading':
        const record = loadingRecordService.getById(task.relatedRecordId) as LoadingRecord;
        if (record) {
          return `货物: ${record.cargoName}\n港口: ${record.port}\n计划: ${record.plannedWeight}${record.unit}\n实际: ${record.actualWeight}${record.unit}\n${record.remark ? `备注: ${record.remark}` : ''}`;
        }
        break;
      case 'supply':
        const supply = oilWaterSupplyService.getById(task.relatedRecordId) as OilWaterSupply;
        if (supply) {
          const typeText = supply.type === 'fuel' ? '燃油' : supply.type === 'water' ? '淡水' : '润滑油';
          return `类型: ${typeText}\n数量: ${supply.quantity}${supply.unit}\n港口: ${supply.port}\n供应商: ${supply.supplier}\n金额: ¥${supply.amount.toLocaleString()}`;
        }
        break;
      case 'exception':
        const exp = exceptionService.getById(task.relatedRecordId) as Exception;
        if (exp) {
          let detail = `类型: ${exp.typeText}\n位置: ${exp.location}\n发生时间: ${exp.occurrenceTime}\n描述: ${exp.description}`;
          if (exp.handler) {
            detail += `\n处理人: ${exp.handler}\n处理时间: ${exp.handleTime}`;
          }
          if (exp.handleResult) {
            detail += `\n处理意见: ${exp.handleResult}`;
          }
          return detail;
        }
        break;
      case 'arrival':
        const conf = arrivalConfirmationService.getById(task.relatedRecordId) as ArrivalConfirmation;
        if (conf) {
          return `港口: ${conf.port}\n到港时间: ${conf.arrivalTime}\n吃水: ${conf.draft}m\n水深: ${conf.waterDepth}m\n引航员: ${conf.pilotOnBoard ? '是' : '否'}\n拖船: ${conf.tugUsed ? '是' : '否'}\n${conf.remark ? `备注: ${conf.remark}` : ''}`;
        }
        break;
    }
    return '';
  };

  if (!currentVoyage) {
    return (
      <ScrollView className={styles.pageContainer} scrollY>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🚢</Text>
          <Text className={styles.emptyText}>暂无进行中的航次</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>航次任务清单</Text>
        <Text className={styles.subtitle}>{currentVoyage.voyageNo} - {currentVoyage.shipName}</Text>
        <View className={styles.progressSection}>
          <View className={styles.progressInfo}>
            <Text className={styles.progressLabel}>必做任务</Text>
            <Text className={styles.progressValue}>{completedRequired}/{totalRequired}</Text>
          </View>
          <View className={styles.progressInfo}>
            <Text className={styles.progressLabel}>总任务</Text>
            <Text className={styles.progressValue}>{completedCount}/{tasks.length}</Text>
          </View>
        </View>
        <View className={styles.progressBar}>
          <View 
            className={styles.progressFill} 
            style={{ width: `${totalRequired > 0 ? (completedRequired / totalRequired * 100) : 0}%` }}
          />
        </View>
      </View>

      <View className={styles.taskList}>
        {tasks.map((task, index) => (
          <View 
            key={task.id}
            className={classnames(
              styles.taskCard,
              task.status === 'completed' && styles.completed
            )}
            onClick={() => handleTaskClick(task)}
          >
            <View className={styles.taskIndex}>
              <Text className={styles.indexText}>{index + 1}</Text>
            </View>
            
            <View className={styles.taskIcon}>
              <Text>{getTaskIcon(task.type)}</Text>
            </View>
            
            <View className={styles.taskContent}>
              <View className={styles.taskHeader}>
                <Text className={styles.taskTitle}>{task.title}</Text>
                <View className={classnames(
                  styles.taskStatus,
                  task.status === 'completed' ? styles.statusDone : styles.statusPending
                )}>
                  <Text>{task.statusText}</Text>
                </View>
              </View>
              
              <Text className={styles.taskType}>{task.typeText}</Text>
              
              <Text className={styles.taskDesc}>{task.description}</Text>
              
              {task.submitTime && (
                <Text className={styles.taskTime}>
                  {task.status === 'completed' ? '完成时间' : '更新时间'}: {task.submitTime}
                  {task.submitter && ` | ${task.submitter}`}
                </Text>
              )}
              
              {task.required && (
                <View className={styles.requiredBadge}>
                  <Text>必做</Text>
                </View>
              )}
            </View>
            
            <View className={styles.taskArrow}>
              <Text className={styles.arrowText}>
                {task.status === 'completed' ? '查看' : '去完成'} →
              </Text>
            </View>
          </View>
        ))}
      </View>

      {showDetail && selectedTask && (
        <View className={styles.modalOverlay} onClick={handleCloseDetail}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>{selectedTask.title}</Text>
              <Text className={styles.modalClose} onClick={handleCloseDetail}>×</Text>
            </View>
            
            <View className={styles.modalBody}>
              <View className={styles.detailSection}>
                <Text className={styles.detailLabel}>任务类型</Text>
                <Text className={styles.detailValue}>{selectedTask.typeText}</Text>
              </View>
              
              <View className={styles.detailSection}>
                <Text className={styles.detailLabel}>任务状态</Text>
                <View className={classnames(
                  styles.detailStatus,
                  selectedTask.status === 'completed' ? styles.statusDone : styles.statusPending
                )}>
                  <Text>{selectedTask.statusText}</Text>
                </View>
              </View>
              
              {selectedTask.submitter && (
                <View className={styles.detailSection}>
                  <Text className={styles.detailLabel}>提交人</Text>
                  <Text className={styles.detailValue}>{selectedTask.submitter}</Text>
                </View>
              )}
              
              {selectedTask.submitTime && (
                <View className={styles.detailSection}>
                  <Text className={styles.detailLabel}>提交时间</Text>
                  <Text className={styles.detailValue}>{selectedTask.submitTime}</Text>
                </View>
              )}
              
              <View className={styles.detailSection}>
                <Text className={styles.detailLabel}>任务描述</Text>
                <Text className={styles.detailValue}>{selectedTask.description}</Text>
              </View>
              
              {selectedTask.relatedRecordId && (
                <View className={styles.detailSection}>
                  <Text className={styles.detailLabel}>详细信息</Text>
                  <Text className={styles.detailMultiValue}>
                    {getRelatedRecordDetail(selectedTask)}
                  </Text>
                </View>
              )}
              
              <View className={styles.detailSection}>
                <Text className={styles.detailLabel}>是否必做</Text>
                <Text className={styles.detailValue}>
                  {selectedTask.required ? '是' : '否'}
                </Text>
              </View>
            </View>
            
            <View className={styles.modalFooter}>
              <Text className={styles.modalBtn} onClick={handleCloseDetail}>
                关闭
              </Text>
            </View>
          </View>
        </View>
      )}

      {showArrivalModal && currentVoyage && (
        <View className={styles.modalOverlay} onClick={handleCloseArrivalModal}>
          <View className={styles.arrivalModalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>到港确认</Text>
              <Text className={styles.modalClose} onClick={handleCloseArrivalModal}>×</Text>
            </View>
            
            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.arrivalInfo}>
                <Text className={styles.arrivalInfoText}>
                  航次: {currentVoyage.voyageNo}
                </Text>
                <Text className={styles.arrivalInfoText}>
                  港口: {currentVoyage.unloadingPort}
                </Text>
                <Text className={styles.arrivalInfoText}>
                  预计到达: {currentVoyage.estimatedArrivalTime}
                </Text>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formLabel}>船舶吃水 (m) <Text className={styles.required}>*</Text></Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  placeholder="请输入吃水深度"
                  value={arrivalForm.draft}
                  onInput={(e) => setArrivalForm({ ...arrivalForm, draft: e.detail.value })}
                />
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formLabel}>港池水深 (m) <Text className={styles.required}>*</Text></Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  placeholder="请输入港池水深"
                  value={arrivalForm.waterDepth}
                  onInput={(e) => setArrivalForm({ ...arrivalForm, waterDepth: e.detail.value })}
                />
              </View>

              <View className={styles.formRow}>
                <View className={styles.formSectionInline}>
                  <Text className={styles.formLabel}>引航员在船</Text>
                  <Switch
                    checked={arrivalForm.pilotOnBoard}
                    onChange={(e) => setArrivalForm({ ...arrivalForm, pilotOnBoard: e.detail.value })}
                  />
                </View>
                <View className={styles.formSectionInline}>
                  <Text className={styles.formLabel}>使用拖船</Text>
                  <Switch
                    checked={arrivalForm.tugUsed}
                    onChange={(e) => setArrivalForm({ ...arrivalForm, tugUsed: e.detail.value })}
                  />
                </View>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formLabel}>备注</Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入备注信息"
                  value={arrivalForm.remark}
                  onInput={(e) => setArrivalForm({ ...arrivalForm, remark: e.detail.value })}
                />
              </View>

              {arrivalForm.photos.length > 0 && (
                <View className={styles.photoPreview}>
                  {arrivalForm.photos.map((photo, index) => (
                    <Image key={index} src={photo} className={styles.previewImage} />
                  ))}
                </View>
              )}
            </ScrollView>
            
            <View className={styles.modalFooter}>
              <Button className={styles.modalBtnSecondary} onClick={handleCloseArrivalModal}>
                取消
              </Button>
              <Button className={styles.modalBtnPrimary} onClick={handleSubmitArrival}>
                确认到港
              </Button>
            </View>
          </View>
        </View>
      )}

      <View className={styles.footerPadding} />
    </ScrollView>
  );
};

export default VoyageTasksPage;
