import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Button, Input, Textarea, ScrollView, Picker } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getCurrentVoyage } from '@/data/voyage';
import { formatDateTime, formatWeight, formatNumber } from '@/utils/format';
import UploadItem from '@/components/UploadItem';
import {
  loadingRecordService,
  oilWaterSupplyService,
  onDataChange,
  refreshData
} from '@/services/dataService';
import type { LoadingRecord, OilWaterSupply } from '@/types';

const supplyTypeOptions = [
  { key: 'fuel', label: '燃油补给' },
  { key: 'water', label: '淡水补给' },
  { key: 'lubricant', label: '润滑油补给' }
];

const LoadingPage: React.FC = () => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'loading' | 'supply'>('loading');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'confirm' | 'supply'>('confirm');
  const [selectedRecord, setSelectedRecord] = useState<LoadingRecord | null>(null);
  const [actualWeight, setActualWeight] = useState('');
  const [remark, setRemark] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [, setRefreshing] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const [supplyType, setSupplyType] = useState<'fuel' | 'water' | 'lubricant'>('fuel');
  const [supplyQuantity, setSupplyQuantity] = useState('');
  const [supplyPort, setSupplyPort] = useState('');
  const [supplySupplier, setSupplySupplier] = useState('');
  const [supplyAmount, setSupplyAmount] = useState('');
  const [supplyOperator, setSupplyOperator] = useState('');

  const currentVoyage = useMemo(() => getCurrentVoyage(), []);

  const reloadData = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  useDidShow(() => {
    console.log('[LoadingPage] 页面显示');
    reloadData();
  });

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
    }, 1000);
  });

  const loadingRecords = useMemo(() => {
    if (currentVoyage) {
      return loadingRecordService.getByVoyageId(currentVoyage.id);
    }
    return loadingRecordService.getAll();
  }, [currentVoyage, dataVersion]);

  const supplyRecords = useMemo(() => {
    if (currentVoyage) {
      return oilWaterSupplyService.getByVoyageId(currentVoyage.id);
    }
    return oilWaterSupplyService.getAll();
  }, [currentVoyage, dataVersion]);

  const handleConfirm = (record: LoadingRecord) => {
    setSelectedRecord(record);
    setActualWeight(record.plannedWeight.toString());
    setRemark('');
    setPhotos([...record.photos]);
    setFormType('confirm');
    setShowForm(true);
  };

  const handleAddSupply = () => {
    setFormType('supply');
    setSupplyType('fuel');
    setSupplyQuantity('');
    setSupplyPort('');
    setSupplySupplier('');
    setSupplyAmount('');
    setSupplyOperator('张船长');
    setPhotos([]);
    setShowForm(true);
  };

  const handleAddPhoto = () => {
    Taro.chooseImage({
      count: 3,
      success: (res) => {
        const newPhotos = [...photos, ...res.tempFilePaths];
        setPhotos(newPhotos.slice(0, 9));
        console.log('[LoadingPage] 选择图片:', res.tempFilePaths);
      },
      fail: (error) => {
        console.error('[LoadingPage] 选择图片失败:', error);
      }
    });
  };

  const handleDeletePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleSubmitLoadingConfirm = () => {
    if (!selectedRecord) return;
    if (!actualWeight) {
      Taro.showToast({ title: '请输入实际重量', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      try {
        const weight = parseFloat(actualWeight);
        const result = loadingRecordService.confirmLoading(
          selectedRecord.id,
          weight,
          photos,
          remark,
          '张船长'
        );

        if (result) {
          Taro.hideLoading();
          Taro.showToast({ title: '提交成功', icon: 'success' });
          setShowForm(false);
          refreshData();
          reloadData();
          console.log('[LoadingPage] 装卸确认成功:', result);
        } else {
          Taro.hideLoading();
          Taro.showToast({ title: '提交失败', icon: 'none' });
        }
      } catch (error) {
        Taro.hideLoading();
        Taro.showToast({ title: '提交失败', icon: 'none' });
        console.error('[LoadingPage] 装卸确认失败:', error);
      }
    }, 800);
  };

  const handleSubmitSupply = () => {
    if (!supplyQuantity) {
      Taro.showToast({ title: '请输入补给数量', icon: 'none' });
      return;
    }
    if (!supplyPort) {
      Taro.showToast({ title: '请输入补给港口', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      try {
        const typeConfig = supplyTypeOptions.find(o => o.key === supplyType);
        const quantity = parseFloat(supplyQuantity);
        const amount = parseFloat(supplyAmount) || 0;

        if (!currentVoyage) {
          Taro.hideLoading();
          Taro.showToast({ title: '无当前航次', icon: 'none' });
          return;
        }

        const newSupply: Omit<OilWaterSupply, 'id' | 'recordTime'> = {
          voyageId: currentVoyage.id,
          type: supplyType,
          quantity,
          unit: supplyType === 'water' ? '吨' : supplyType === 'lubricant' ? '桶' : '吨',
          port: supplyPort,
          supplier: supplySupplier || (typeConfig?.label || '补给'),
          amount,
          receiptPhotos: photos,
          operator: supplyOperator || '张船长'
        };

        const result = oilWaterSupplyService.addSupply(newSupply);
        Taro.hideLoading();
        Taro.showToast({ title: '记录成功', icon: 'success' });
        setShowForm(false);
        refreshData();
        reloadData();
        console.log('[LoadingPage] 补给记录成功:', result);
      } catch (error) {
        Taro.hideLoading();
        Taro.showToast({ title: '记录失败', icon: 'none' });
        console.error('[LoadingPage] 补给记录失败:', error);
      }
    }, 800);
  };

  const handleSubmit = () => {
    if (formType === 'confirm') {
      handleSubmitLoadingConfirm();
    } else {
      handleSubmitSupply();
    }
  };

  const handleArrivalConfirm = () => {
    Taro.showModal({
      title: '到港确认',
      content: `确认已抵达${currentVoyage?.ports[currentVoyage.currentPortIndex + 1]?.name || '目的港'}？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '确认中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '到港确认成功', icon: 'success' });
            console.log('[LoadingPage] 到港确认成功');
          }, 1000);
        }
      }
    });
  };

  const getSupplyTypeText = (type: string) => {
    const map: Record<string, string> = {
      fuel: '燃油补给',
      water: '淡水补给',
      lubricant: '润滑油补给'
    };
    return map[type] || type;
  };

  const renderLoadingRecords = () => {
    if (loadingRecords.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📦</Text>
          <Text className={styles.emptyText}>暂无装卸记录</Text>
        </View>
      );
    }

    return loadingRecords.map((record) => (
      <View className={styles.recordCard} key={record.id}>
        <View className={styles.cardHeader}>
          <View className={classnames(styles.typeTag, styles[record.type])}>
            {record.type === 'loading' ? '装货' : '卸货'}
          </View>
          <View className={classnames(styles.statusTag, styles[record.status])}>
            {record.status === 'pending' ? '待确认' : record.status === 'confirmed' ? '已确认' : '已驳回'}
          </View>
        </View>

        <Text className={styles.cargoName}>{record.cargoName}</Text>

        <View className={styles.weightRow}>
          <View className={styles.weightItem}>
            <Text className={styles.label}>计划重量</Text>
            <Text className={classnames(styles.value, styles.planned)}>
              {formatWeight(record.plannedWeight, record.unit)}
            </Text>
          </View>
          <View className={styles.weightItem}>
            <Text className={styles.label}>实际重量</Text>
            <Text className={styles.value}>
              {record.actualWeight > 0 ? formatWeight(record.actualWeight, record.unit) : '待确认'}
            </Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.label}>作业港口</Text>
          <Text className={styles.value}>{record.port}</Text>
        </View>
        {record.operator && (
          <View className={styles.infoRow}>
            <Text className={styles.label}>操作人</Text>
            <Text className={styles.value}>{record.operator}</Text>
          </View>
        )}
        {record.confirmTime && (
          <View className={styles.infoRow}>
            <Text className={styles.label}>确认时间</Text>
            <Text className={styles.value}>{formatDateTime(record.confirmTime)}</Text>
          </View>
        )}
        {record.remark && (
          <View className={styles.infoRow}>
            <Text className={styles.label}>备注</Text>
            <Text className={styles.value}>{record.remark}</Text>
          </View>
        )}

        {record.photos.length > 0 && (
          <View className={styles.photoSection}>
            <Text className={styles.photoLabel}>单据照片</Text>
            <ScrollView className={styles.photoList} scrollX>
              {record.photos.map((photo, index) => (
                <UploadItem key={index} src={photo} />
              ))}
            </ScrollView>
          </View>
        )}

        {state.userRole === 'crew' && record.status === 'pending' && (
          <View className={styles.actionRow}>
            <Button className={styles.confirmBtn} onClick={() => handleConfirm(record)}>
              确认装卸
            </Button>
          </View>
        )}
      </View>
    ));
  };

  const renderSupplyRecords = () => {
    if (supplyRecords.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>⛽</Text>
          <Text className={styles.emptyText}>暂无补给记录</Text>
        </View>
      );
    }

    return supplyRecords.map((record) => (
      <View className={styles.supplyCard} key={record.id}>
        <View className={styles.supplyHeader}>
          <View className={classnames(styles.typeTag, styles[record.type])}>
            {getSupplyTypeText(record.type)}
          </View>
          <Text className={styles.time}>{formatDateTime(record.recordTime)}</Text>
        </View>

        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.label}>补给数量</Text>
            <Text className={styles.value}>{formatNumber(record.quantity)} {record.unit}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>补给港口</Text>
            <Text className={styles.value}>{record.port}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>供应商</Text>
            <Text className={styles.value}>{record.supplier}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.label}>操作人</Text>
            <Text className={styles.value}>{record.operator}</Text>
          </View>
        </View>

        {record.receiptPhotos.length > 0 && (
          <View className={styles.photoSection}>
            <Text className={styles.photoLabel}>票据照片</Text>
            <ScrollView className={styles.photoList} scrollX>
              {record.receiptPhotos.map((photo, index) => (
                <UploadItem key={index} src={photo} />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    ));
  };

  const renderForm = () => {
    if (!showForm) return null;

    return (
      <View className={styles.formModal} onClick={() => setShowForm(false)}>
        <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <View className={styles.modalHeader}>
            <Text className={styles.modalTitle}>
              {formType === 'confirm' ? '确认装卸量' : '记录油水补给'}
            </Text>
            <Text className={styles.closeBtn} onClick={() => setShowForm(false)}>×</Text>
          </View>

          {formType === 'confirm' && selectedRecord && (
            <>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>
                  <Text className={styles.required}>*</Text>货物名称
                </Text>
                <View className={styles.formInput} style={{ display: 'flex', alignItems: 'center' }}>
                  <Text>{selectedRecord.cargoName}</Text>
                </View>
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>
                  <Text className={styles.required}>*</Text>计划重量（{selectedRecord.unit}）
                </Text>
                <View className={styles.formInput} style={{ display: 'flex', alignItems: 'center' }}>
                  <Text>{selectedRecord.plannedWeight}</Text>
                </View>
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>
                  <Text className={styles.required}>*</Text>实际重量（{selectedRecord.unit}）
                </Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  placeholder="请输入实际重量"
                  value={actualWeight}
                  onInput={(e) => setActualWeight(e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>单据照片</Text>
                <View className={styles.photoUploadRow}>
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
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>备注</Text>
                <Textarea
                  className={styles.formTextarea}
                  placeholder="请输入备注信息（可选）"
                  value={remark}
                  onInput={(e) => setRemark(e.detail.value)}
                />
              </View>
            </>
          )}

          {formType === 'supply' && (
            <>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>
                  <Text className={styles.required}>*</Text>补给类型
                </Text>
                <Picker
                  mode="selector"
                  range={supplyTypeOptions.map(o => o.label)}
                  value={supplyTypeOptions.findIndex(o => o.key === supplyType)}
                  onChange={(e) => {
                    const idx = parseInt(String(e.detail.value));
                    setSupplyType(supplyTypeOptions[idx].key as any);
                  }}
                >
                  <View className={styles.formInput}>
                    {supplyTypeOptions.find(o => o.key === supplyType)?.label}
                  </View>
                </Picker>
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>
                  <Text className={styles.required}>*</Text>补给数量（{supplyType === 'lubricant' ? '桶' : '吨'}）
                </Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  placeholder="请输入补给数量"
                  value={supplyQuantity}
                  onInput={(e) => setSupplyQuantity(e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>
                  <Text className={styles.required}>*</Text>补给港口
                </Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入补给港口"
                  value={supplyPort}
                  onInput={(e) => setSupplyPort(e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>供应商</Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入供应商（可选）"
                  value={supplySupplier}
                  onInput={(e) => setSupplySupplier(e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>金额（元）</Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  placeholder="请输入金额（可选）"
                  value={supplyAmount}
                  onInput={(e) => setSupplyAmount(e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>操作人</Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入操作人"
                  value={supplyOperator}
                  onInput={(e) => setSupplyOperator(e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>票据照片</Text>
                <View className={styles.photoUploadRow}>
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
            </>
          )}

          <Button className={styles.submitBtn} onClick={handleSubmit}>
            提交确认
          </Button>
        </View>
      </View>
    );
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>装卸确认</Text>
        <Text className={styles.subtitle}>
          {currentVoyage ? `${currentVoyage.voyageNo} · ${currentVoyage.loadingPort} → ${currentVoyage.unloadingPort}` : '暂无航次信息'}
        </Text>
      </View>

      <View className={styles.tabBar}>
        <Button
          className={classnames(styles.tabItem, activeTab === 'loading' && styles.active)}
          onClick={() => setActiveTab('loading')}
        >
          装卸记录
        </Button>
        <Button
          className={classnames(styles.tabItem, activeTab === 'supply' && styles.active)}
          onClick={() => setActiveTab('supply')}
        >
          油水补给
        </Button>
      </View>

      <View className={styles.content}>
        {activeTab === 'loading' ? renderLoadingRecords() : renderSupplyRecords()}
      </View>

      {state.userRole === 'crew' && (
        <View className={styles.bottomBar}>
          <Button className={styles.supplyBtn} onClick={handleAddSupply}>
            记录补给
          </Button>
          <Button className={styles.arrivalBtn} onClick={handleArrivalConfirm}>
            到港确认
          </Button>
        </View>
      )}

      {renderForm()}
    </ScrollView>
  );
};

export default LoadingPage;
