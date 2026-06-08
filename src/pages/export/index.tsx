import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { mockVoyages } from '@/data/voyage';
import {
  getVoyageStatusConfig,
  formatDate,
  formatWeight
} from '@/utils/format';
import { exportRecordService, refreshData, onDataChange, getCurrentDateTime } from '@/services/dataService';
import type { ExportRecord } from '@/types';

const statusOptions = [
  { key: 'completed', label: '已完成' },
  { key: 'sailing', label: '航行中' },
  { key: 'anchored', label: '锚泊' },
  { key: 'loading', label: '装货中' },
  { key: 'unloading', label: '卸货中' },
  { key: 'pending', label: '待执行' }
];

const formatOptions = [
  { key: 'excel', label: 'Excel (.xlsx)', icon: '📊', ext: '.xlsx' },
  { key: 'pdf', label: 'PDF (.pdf)', icon: '📄', ext: '.pdf' },
  { key: 'csv', label: 'CSV (.csv)', icon: '📋', ext: '.csv' }
];

const contentOptions = [
  { key: 'basic', label: '基本信息' },
  { key: 'cargo', label: '货物信息' },
  { key: 'ports', label: '港口记录' },
  { key: 'loading', label: '装卸记录' },
  { key: 'supply', label: '补给记录' },
  { key: 'exception', label: '异常记录' }
];

const ExportPage: React.FC = () => {
  const { state } = useApp();
  const [, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'history'>('export');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['completed']);
  const [selectedFormat, setSelectedFormat] = useState<string>('excel');
  const [selectedContents, setSelectedContents] = useState<string[]>(['basic', 'cargo', 'ports']);
  const [selectedVoyages, setSelectedVoyages] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [dataVersion, setDataVersion] = useState(0);
  const [historyFormatFilter, setHistoryFormatFilter] = useState<string>('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [showRecordDetail, setShowRecordDetail] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExportRecord | null>(null);

  const reloadData = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  useDidShow(() => {
    console.log('[ExportPage] 页面显示');
    reloadData();
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

  const filteredVoyages = useMemo(() => {
    let result = [...mockVoyages];

    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      result = result.filter(v =>
        v.voyageNo.toLowerCase().includes(lowerKeyword) ||
        v.shipName.toLowerCase().includes(lowerKeyword) ||
        v.loadingPort.toLowerCase().includes(lowerKeyword) ||
        v.unloadingPort.toLowerCase().includes(lowerKeyword)
      );
    }

    if (selectedStatuses.length > 0) {
      result = result.filter(v => selectedStatuses.includes(v.status));
    }

    if (startDate) {
      result = result.filter(v => v.departureTime >= startDate);
    }
    if (endDate) {
      result = result.filter(v => v.departureTime <= endDate + ' 23:59:59');
    }

    return result;
  }, [keyword, selectedStatuses, startDate, endDate]);

  const exportRecords = useMemo(() => {
    return exportRecordService.getAll();
  }, [dataVersion]);

  const filteredExportRecords = useMemo(() => {
    let result = [...exportRecords];
    
    if (historyFormatFilter !== 'all') {
      result = result.filter(r => r.format === historyFormatFilter);
    }
    
    if (historyStartDate) {
      result = result.filter(r => r.createTime >= historyStartDate);
    }
    
    if (historyEndDate) {
      result = result.filter(r => r.createTime <= historyEndDate + ' 23:59:59');
    }
    
    return result;
  }, [exportRecords, historyFormatFilter, historyStartDate, historyEndDate]);

  const isAllSelected = useMemo(() => {
    return filteredVoyages.length > 0 && selectedVoyages.length === filteredVoyages.length;
  }, [filteredVoyages, selectedVoyages]);

  const totalWeight = useMemo(() => {
    return filteredVoyages
      .filter(v => selectedVoyages.includes(v.id))
      .reduce((sum, v) => sum + v.totalWeight, 0);
  }, [filteredVoyages, selectedVoyages]);

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      }
      return [...prev, status];
    });
  };

  const handleContentToggle = (content: string) => {
    setSelectedContents(prev => {
      if (prev.includes(content)) {
        return prev.filter(c => c !== content);
      }
      return [...prev, content];
    });
  };

  const handleVoyageSelect = (voyageId: string) => {
    setSelectedVoyages(prev => {
      if (prev.includes(voyageId)) {
        return prev.filter(id => id !== voyageId);
      }
      return [...prev, voyageId];
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVoyages([]);
    } else {
      setSelectedVoyages(filteredVoyages.map(v => v.id));
    }
  };

  const handleStartDateClick = () => {
    const taroAny = Taro as any;
    taroAny.showDatePicker?.({
      format: 'YYYY-MM-DD',
      success: (res: any) => {
        setStartDate(res.value);
      }
    }) || Taro.showActionSheet({
      itemList: ['2026-06-01', '2026-06-08', '2026-06-15'],
      success: (res) => {
        const dates = ['2026-06-01', '2026-06-08', '2026-06-15'];
        setStartDate(dates[res.tapIndex]);
      }
    });
  };

  const handleEndDateClick = () => {
    const taroAny = Taro as any;
    taroAny.showDatePicker?.({
      format: 'YYYY-MM-DD',
      success: (res: any) => {
        setEndDate(res.value);
      }
    }) || Taro.showActionSheet({
      itemList: ['2026-06-15', '2026-06-20', '2026-06-30'],
      success: (res) => {
        const dates = ['2026-06-15', '2026-06-20', '2026-06-30'];
        setEndDate(dates[res.tapIndex]);
      }
    });
  };

  const generateFileName = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const formatConfig = formatOptions.find(f => f.key === selectedFormat);
    return `航次报表_${dateStr}_${timeStr}${formatConfig?.ext || '.xlsx'}`;
  };

  const handleExport = () => {
    if (selectedVoyages.length === 0) {
      Taro.showToast({ title: '请选择要导出的航次', icon: 'none' });
      return;
    }
    if (selectedContents.length === 0) {
      Taro.showToast({ title: '请选择导出内容', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认导出',
      content: `即将导出 ${selectedVoyages.length} 条航次记录，格式为 ${selectedFormat.toUpperCase()}，是否继续？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '正在导出...' });
          setTimeout(() => {
            try {
              const now = getCurrentDateTime();
              const fileName = generateFileName();
              const formatConfig = formatOptions.find(f => f.key === selectedFormat);
              const contentTexts = selectedContents.map(c => {
                const config = contentOptions.find(o => o.key === c);
                return config?.label || c;
              });

              const newRecord: Omit<ExportRecord, 'id'> = {
                fileName: fileName,
                format: selectedFormat as 'excel' | 'pdf' | 'csv',
                formatText: formatConfig?.label || selectedFormat.toUpperCase(),
                voyageCount: selectedVoyages.length,
                totalWeight: totalWeight,
                contents: contentTexts,
                voyageIds: [...selectedVoyages],
                status: 'completed',
                statusText: '已完成',
                fileUrl: undefined,
                createTime: now,
                operator: state.userRole === 'dispatcher' ? '李调度' : '张船长'
              };

              const result = exportRecordService.createExport(newRecord);
              Taro.hideLoading();
              Taro.showToast({ title: '导出成功', icon: 'success' });
              refreshData();
              reloadData();
              setActiveTab('history');
              console.log('[ExportPage] 导出成功:', result);
            } catch (error) {
              Taro.hideLoading();
              Taro.showToast({ title: '导出失败', icon: 'none' });
              console.error('[ExportPage] 导出失败:', error);
            }
          }, 2000);
        }
      }
    });
  };

  const handleViewRecord = (record: ExportRecord) => {
    setSelectedRecord(record);
    setShowRecordDetail(true);
  };

  const handleCloseRecordDetail = () => {
    setShowRecordDetail(false);
    setSelectedRecord(null);
  };

  const getRecordVoyages = (record: ExportRecord) => {
    return mockVoyages.filter(v => record.voyageIds.includes(v.id));
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedStatuses(['completed']);
    setSelectedFormat('excel');
    setSelectedContents(['basic', 'cargo', 'ports']);
    setSelectedVoyages([]);
    setKeyword('');
  };

  const renderExportForm = () => (
    <>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>🔍</Text>
          筛选条件
        </Text>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>关键词搜索</Text>
          <Input
            className={styles.formInput}
            placeholder="输入航次号、船名、港口..."
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>日期范围</Text>
          <View className={styles.dateRange}>
            <View className={styles.dateItem}>
              <View className={styles.formPicker} onClick={handleStartDateClick}>
                {startDate ? (
                  <Text className={styles.value}>{startDate}</Text>
                ) : (
                  <Text className={styles.placeholder}>开始日期</Text>
                )}
                <Text className={styles.arrow}>▼</Text>
              </View>
            </View>
            <View className={styles.dateItem}>
              <View className={styles.formPicker} onClick={handleEndDateClick}>
                {endDate ? (
                  <Text className={styles.value}>{endDate}</Text>
                ) : (
                  <Text className={styles.placeholder}>结束日期</Text>
                )}
                <Text className={styles.arrow}>▼</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>航次状态</Text>
          <View className={styles.checkboxGroup}>
            {statusOptions.map((option) => (
              <View
                key={option.key}
                className={classnames(
                  styles.checkboxItem,
                  selectedStatuses.includes(option.key) && styles.active
                )}
                onClick={() => handleStatusToggle(option.key)}
              >
                <View
                  className={classnames(
                    styles.checkboxIcon,
                    selectedStatuses.includes(option.key) && styles.active
                  )}
                >
                  {selectedStatuses.includes(option.key) && '✓'}
                </View>
                <Text className={styles.checkboxLabel}>{option.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>📄</Text>
          导出设置
        </Text>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>导出格式</Text>
          <View className={styles.checkboxGroup}>
            {formatOptions.map((option) => (
              <View
                key={option.key}
                className={classnames(
                  styles.checkboxItem,
                  selectedFormat === option.key && styles.active
                )}
                onClick={() => setSelectedFormat(option.key)}
              >
                <View
                  className={classnames(
                    styles.checkboxIcon,
                    selectedFormat === option.key && styles.active
                  )}
                >
                  {selectedFormat === option.key && '✓'}
                </View>
                <Text className={styles.checkboxLabel}>
                  {option.icon} {option.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>导出内容</Text>
          <View className={styles.checkboxGroup}>
            {contentOptions.map((option) => (
              <View
                key={option.key}
                className={classnames(
                  styles.checkboxItem,
                  selectedContents.includes(option.key) && styles.active
                )}
                onClick={() => handleContentToggle(option.key)}
              >
                <View
                  className={classnames(
                    styles.checkboxIcon,
                    selectedContents.includes(option.key) && styles.active
                  )}
                >
                  {selectedContents.includes(option.key) && '✓'}
                </View>
                <Text className={styles.checkboxLabel}>{option.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📋</Text>
            选择航次
          </Text>
        </View>

        <View className={styles.selectAll} onClick={handleSelectAll}>
          <View className={classnames(styles.checkbox, isAllSelected && styles.active)}>
            {isAllSelected && '✓'}
          </View>
          <Text className={styles.label}>全选</Text>
          <Text className={styles.count}>
            已选 {selectedVoyages.length} / {filteredVoyages.length} 条
          </Text>
        </View>

        {filteredVoyages.length > 0 ? (
          <View className={styles.voyageList}>
            {filteredVoyages.map((voyage) => {
              const statusConfig = getVoyageStatusConfig(voyage.status);
              const isSelected = selectedVoyages.includes(voyage.id);

              return (
                <View
                  key={voyage.id}
                  className={styles.voyageItem}
                  onClick={() => handleVoyageSelect(voyage.id)}
                >
                  <View className={classnames(styles.checkbox, isSelected && styles.active)}>
                    {isSelected && '✓'}
                  </View>
                  <View className={styles.voyageInfo}>
                    <Text className={styles.voyageNo}>{voyage.voyageNo}</Text>
                    <Text className={styles.voyageRoute}>
                      {voyage.shipName} · {voyage.loadingPort} → {voyage.unloadingPort}
                    </Text>
                    <Text className={styles.voyageDate}>
                      {formatDate(voyage.departureTime)} · {formatWeight(voyage.totalWeight)}
                    </Text>
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
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无符合条件的航次</Text>
          </View>
        )}
      </View>

      {selectedVoyages.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📊</Text>
            导出摘要
          </Text>
          <View className={styles.exportSummary}>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>航次数量</Text>
              <Text className={styles.summaryValue}>{selectedVoyages.length} 条</Text>
            </View>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>总载货量</Text>
              <Text className={styles.summaryValue}>{formatWeight(totalWeight)}</Text>
            </View>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>导出格式</Text>
              <Text className={styles.summaryValue}>{selectedFormat.toUpperCase()}</Text>
            </View>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>导出内容</Text>
              <Text className={styles.summaryValue}>{selectedContents.length} 项</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 160 }} />

      <View className={styles.actionBar}>
        <View className={styles.actionBtn} onClick={handleReset}>
          <Text className={styles.btnIcon}>🔄</Text>
          重置筛选
        </View>
        <View
          className={classnames(styles.actionBtn, styles.primary)}
          onClick={handleExport}
        >
          <Text className={styles.btnIcon}>📤</Text>
          导出 {selectedVoyages.length > 0 && `(${selectedVoyages.length})`}
        </View>
      </View>
    </>
  );

  const handleHistoryStartDateClick = () => {
    const dates = ['2026-06-01', '2026-06-08', '2026-06-15'];
    Taro.showActionSheet({
      itemList: dates,
      success: (res) => {
        setHistoryStartDate(dates[res.tapIndex]);
      }
    });
  };

  const handleHistoryEndDateClick = () => {
    const dates = ['2026-06-15', '2026-06-20', '2026-06-30'];
    Taro.showActionSheet({
      itemList: dates,
      success: (res) => {
        setHistoryEndDate(dates[res.tapIndex]);
      }
    });
  };

  const handleHistoryReset = () => {
    setHistoryFormatFilter('all');
    setHistoryStartDate('');
    setHistoryEndDate('');
  };

  const renderRecordDetailModal = () => {
    if (!showRecordDetail || !selectedRecord) return null;
    
    const recordVoyages = getRecordVoyages(selectedRecord);
    
    return (
      <View className={styles.detailModal} onClick={handleCloseRecordDetail}>
        <View className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
          <View className={styles.detailModalHeader}>
            <Text className={styles.detailModalTitle}>导出记录详情</Text>
            <Text className={styles.detailModalClose} onClick={handleCloseRecordDetail}>×</Text>
          </View>
          
          <ScrollView className={styles.detailModalBody} scrollY>
            <View className={styles.detailSection}>
              <Text className={styles.detailSectionTitle}>基本信息</Text>
              <View className={styles.detailGrid}>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>文件名</Text>
                  <Text className={styles.detailValue}>{selectedRecord.fileName}</Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>格式</Text>
                  <Text className={styles.detailValue}>{selectedRecord.formatText}</Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>航次数量</Text>
                  <Text className={styles.detailValue}>{selectedRecord.voyageCount} 条</Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>总载货量</Text>
                  <Text className={styles.detailValue}>{formatWeight(selectedRecord.totalWeight)}</Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>生成时间</Text>
                  <Text className={styles.detailValue}>{selectedRecord.createTime}</Text>
                </View>
                <View className={styles.detailItem}>
                  <Text className={styles.detailLabel}>操作人</Text>
                  <Text className={styles.detailValue}>{selectedRecord.operator}</Text>
                </View>
              </View>
            </View>
            
            <View className={styles.detailSection}>
              <Text className={styles.detailSectionTitle}>导出内容项</Text>
              <View className={styles.contentsList}>
                {selectedRecord.contents.map((content, index) => (
                  <View key={index} className={styles.contentTag}>
                    <Text className={styles.contentTagText}>{content}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View className={styles.detailSection}>
              <Text className={styles.detailSectionTitle}>包含航次 ({recordVoyages.length})</Text>
              {recordVoyages.length === 0 ? (
                <View className={styles.detailEmpty}>
                  <Text>暂无航次信息</Text>
                </View>
              ) : (
                <View className={styles.voyagePreviewList}>
                  {recordVoyages.map((voyage) => {
                    const statusConfig = getVoyageStatusConfig(voyage.status);
                    return (
                      <View key={voyage.id} className={styles.voyagePreviewItem}>
                        <View className={styles.voyagePreviewInfo}>
                          <Text className={styles.voyagePreviewNo}>{voyage.voyageNo}</Text>
                          <Text className={styles.voyagePreviewRoute}>
                            {voyage.shipName} · {voyage.loadingPort} → {voyage.unloadingPort}
                          </Text>
                          <Text className={styles.voyagePreviewDate}>
                            {formatDate(voyage.departureTime)} · {formatWeight(voyage.totalWeight)}
                          </Text>
                        </View>
                        <View className={classnames(styles.statusTag, styles[voyage.status])}>
                          {statusConfig.text}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
          
          <View className={styles.detailModalFooter}>
            <Text className={styles.detailModalBtn} onClick={handleCloseRecordDetail}>
              关闭
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderExportHistory = () => (
    <>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.titleIcon}>📁</Text>
          导出记录
        </Text>

        <View className={styles.historyFilter}>
          <View className={styles.filterRow}>
            <View className={styles.filterItem}>
              <Text className={styles.filterLabel}>文件格式</Text>
              <View className={styles.formatFilterGroup}>
                <View
                  className={classnames(
                    styles.formatFilterBtn,
                    historyFormatFilter === 'all' && styles.active
                  )}
                  onClick={() => setHistoryFormatFilter('all')}
                >
                  全部
                </View>
                <View
                  className={classnames(
                    styles.formatFilterBtn,
                    historyFormatFilter === 'excel' && styles.active
                  )}
                  onClick={() => setHistoryFormatFilter('excel')}
                >
                  Excel
                </View>
                <View
                  className={classnames(
                    styles.formatFilterBtn,
                    historyFormatFilter === 'pdf' && styles.active
                  )}
                  onClick={() => setHistoryFormatFilter('pdf')}
                >
                  PDF
                </View>
                <View
                  className={classnames(
                    styles.formatFilterBtn,
                    historyFormatFilter === 'csv' && styles.active
                  )}
                  onClick={() => setHistoryFormatFilter('csv')}
                >
                  CSV
                </View>
              </View>
            </View>
          </View>
          
          <View className={styles.filterRow}>
            <View className={styles.filterItem}>
              <Text className={styles.filterLabel}>生成日期</Text>
              <View className={styles.dateFilterGroup}>
                <View
                  className={styles.dateFilterBtn}
                  onClick={handleHistoryStartDateClick}
                >
                  {historyStartDate || '开始日期'}
                  <Text className={styles.filterArrow}>▼</Text>
                </View>
                <Text className={styles.dateSeparator}>至</Text>
                <View
                  className={styles.dateFilterBtn}
                  onClick={handleHistoryEndDateClick}
                >
                  {historyEndDate || '结束日期'}
                  <Text className={styles.filterArrow}>▼</Text>
                </View>
                <View
                  className={styles.resetFilterBtn}
                  onClick={handleHistoryReset}
                >
                  重置
                </View>
              </View>
            </View>
          </View>
          
          <View className={styles.filterResult}>
            <Text>共 {filteredExportRecords.length} 条记录</Text>
          </View>
        </View>

        {filteredExportRecords.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无符合条件的导出记录</Text>
          </View>
        ) : (
          <View className={styles.recordList}>
            {filteredExportRecords.map((record) => (
              <View
                key={record.id}
                className={styles.recordItem}
                onClick={() => handleViewRecord(record)}
              >
                <View className={styles.recordIcon}>
                  {record.format === 'excel' && '📊'}
                  {record.format === 'pdf' && '📄'}
                  {record.format === 'csv' && '📋'}
                </View>
                <View className={styles.recordInfo}>
                  <Text className={styles.recordName}>{record.fileName}</Text>
                  <Text className={styles.recordMeta}>
                    {record.formatText} · {record.voyageCount} 条 · {formatWeight(record.totalWeight)}
                  </Text>
                  <Text className={styles.recordTime}>
                    生成于 {record.createTime} · {record.operator}
                  </Text>
                </View>
                <View className={classnames(styles.recordStatus, styles[record.status])}>
                  {record.statusText}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      {renderRecordDetailModal()}
    </>
  );

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>航次导出</Text>
        <Text className={styles.subtitle}>导出航次记录报表</Text>
      </View>

      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, activeTab === 'export' && styles.active)}
          onClick={() => setActiveTab('export')}
        >
          <Text className={styles.tabText}>导出</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'history' && styles.active)}
          onClick={() => setActiveTab('history')}
        >
          <Text className={styles.tabText}>导出记录</Text>
          {exportRecords.length > 0 && (
            <View className={styles.tabBadge}>{exportRecords.length}</View>
          )}
        </View>
      </View>

      <View className={styles.content}>
        {activeTab === 'export' ? renderExportForm() : renderExportHistory()}
      </View>
    </ScrollView>
  );
};

export default ExportPage;
