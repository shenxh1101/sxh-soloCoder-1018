import Taro from '@tarojs/taro';
import { BaseStorageService, generateId, getCurrentDateTime, getCurrentDate } from './storage';
import { mockLoadingRecords, mockOilWaterSupplies, mockExceptions, mockMessages } from '@/data';
import { mockVoyages } from '@/data/voyage';
import type {
  LoadingRecord,
  OilWaterSupply,
  Exception,
  Message,
  ExportRecord,
  Voyage
} from '@/types';

const DATA_CHANGE_EVENT = 'water_transport_data_changed';

class LoadingRecordService extends BaseStorageService<LoadingRecord> {
  constructor() {
    super('wt_loading_records', mockLoadingRecords);
  }

  public getByVoyageId(voyageId: string): LoadingRecord[] {
    return this.filter(r => r.voyageId === voyageId);
  }

  public confirmLoading(
    recordId: string,
    actualWeight: number,
    photos: string[],
    remark: string,
    operator: string
  ): LoadingRecord | undefined {
    const now = getCurrentDateTime();
    return this.update(recordId, {
      actualWeight,
      photos,
      remark,
      operator,
      confirmTime: now,
      status: 'confirmed',
      statusText: '已确认'
    });
  }
}

class OilWaterSupplyService extends BaseStorageService<OilWaterSupply> {
  constructor() {
    super('wt_oil_water_supplies', mockOilWaterSupplies);
  }

  public getByVoyageId(voyageId: string): OilWaterSupply[] {
    return this.filter(s => s.voyageId === voyageId);
  }

  public addSupply(supply: Omit<OilWaterSupply, 'id' | 'recordTime'>): OilWaterSupply {
    const newSupply: OilWaterSupply = {
      ...supply,
      id: generateId('ow'),
      recordTime: getCurrentDateTime()
    };
    return this.add(newSupply);
  }
}

class ExceptionService extends BaseStorageService<Exception> {
  constructor() {
    super('wt_exceptions', mockExceptions);
  }

  public getByVoyageId(voyageId: string): Exception[] {
    return this.filter(e => e.voyageId === voyageId);
  }

  public getByStatus(status: string): Exception[] {
    if (status === 'all') return this.getAll();
    return this.filter(e => e.status === status);
  }

  public getPendingCount(): number {
    return this.filter(e => e.status === 'pending' || e.status === 'processing').length;
  }

  public addException(exception: Omit<Exception, 'id' | 'status' | 'statusText'>): Exception {
    const now = getCurrentDateTime();
    const newException: Exception = {
      ...exception,
      id: generateId('e'),
      status: 'pending',
      statusText: '待处理',
      createTime: exception.createTime || now,
      updateTime: exception.updateTime || now
    };
    return this.add(newException);
  }

  public startProcessing(exceptionId: string, handler: string): Exception | undefined {
    const now = getCurrentDateTime();
    return this.update(exceptionId, {
      status: 'processing',
      statusText: '处理中',
      handler,
      handleTime: now,
      updateTime: now
    });
  }

  public resolveException(exceptionId: string, handleResult: string, handler: string): Exception | undefined {
    const now = getCurrentDateTime();
    return this.update(exceptionId, {
      status: 'resolved',
      statusText: '已解决',
      handleResult,
      handler,
      handleTime: now,
      updateTime: now
    });
  }

  public closeException(exceptionId: string, handleResult: string, handler: string): Exception | undefined {
    const now = getCurrentDateTime();
    return this.update(exceptionId, {
      status: 'closed',
      statusText: '已关闭',
      handleResult,
      handler,
      handleTime: now,
      updateTime: now
    });
  }

  public resolve(exceptionId: string, handler: string, handleTime: string): Exception | undefined {
    const now = getCurrentDateTime();
    return this.update(exceptionId, {
      status: 'resolved',
      statusText: '已解决',
      handler,
      handleTime: handleTime || now,
      updateTime: now
    });
  }

  public close(exceptionId: string, handler: string, handleTime: string): Exception | undefined {
    const now = getCurrentDateTime();
    return this.update(exceptionId, {
      status: 'closed',
      statusText: '已关闭',
      handler,
      handleTime: handleTime || now,
      updateTime: now
    });
  }

  public process(exceptionId: string, handler: string, handleResult: string, handleTime: string): Exception | undefined {
    const now = getCurrentDateTime();
    return this.update(exceptionId, {
      status: 'processing',
      statusText: '处理中',
      handleResult,
      handler,
      handleTime: handleTime || now,
      updateTime: now
    });
  }
}

class MessageService extends BaseStorageService<Message> {
  constructor() {
    super('wt_messages', mockMessages);
  }

  public getByType(type: string): Message[] {
    if (type === 'all') return this.getAll();
    return this.filter(m => m.type === type);
  }

  public getUnreadCount(): number {
    return this.filter(m => !m.isRead).length;
  }

  public getUnreadCountByType(type: string): number {
    return this.filter(m => !m.isRead && (type === 'all' || m.type === type)).length;
  }

  public markAsRead(messageId: string, readTime?: string): Message | undefined {
    const now = getCurrentDateTime();
    return this.update(messageId, { 
      isRead: true, 
      readTime: readTime || now 
    });
  }

  public markAllAsRead(): void {
    const all = this.getAll();
    const updated = all.map(m => ({ ...m, isRead: true }));
    Taro.setStorageSync(this.storageKey, updated);
  }
}

class ExportRecordService extends BaseStorageService<ExportRecord> {
  constructor() {
    super('wt_export_records', []);
  }

  public createExport(record: Omit<ExportRecord, 'id'>): ExportRecord;
  public createExport(
    format: 'excel' | 'pdf' | 'csv',
    formatText: string,
    voyages: Voyage[],
    contents: string[],
    operator: string
  ): ExportRecord;
  public createExport(
    recordOrFormat: Omit<ExportRecord, 'id'> | 'excel' | 'pdf' | 'csv',
    formatText?: string,
    voyages?: Voyage[],
    contents?: string[],
    operator?: string
  ): ExportRecord {
    if (typeof recordOrFormat === 'string') {
      const dateStr = getCurrentDate().replace(/-/g, '');
      const formatMap: Record<string, string> = { excel: 'xlsx', pdf: 'pdf', csv: 'csv' };
      const ext = formatMap[recordOrFormat] || 'xlsx';
      const voyageList = voyages || [];

      const newExport: ExportRecord = {
        id: generateId('exp'),
        fileName: `航次记录_${dateStr}_${voyageList.length}条.${ext}`,
        format: recordOrFormat,
        formatText: formatText || '',
        voyageCount: voyageList.length,
        totalWeight: voyageList.reduce((sum, v) => sum + v.totalWeight, 0),
        contents: contents || [],
        voyageIds: voyageList.map(v => v.id),
        status: 'completed',
        statusText: '已完成',
        fileUrl: '',
        createTime: getCurrentDateTime(),
        operator: operator || ''
      };
      return this.add(newExport);
    } else {
      const newExport: ExportRecord = {
        ...recordOrFormat,
        id: generateId('exp')
      };
      return this.add(newExport);
    }
  }
}

export const loadingRecordService = new LoadingRecordService();
export const oilWaterSupplyService = new OilWaterSupplyService();
export const exceptionService = new ExceptionService();
export const messageService = new MessageService();
export const exportRecordService = new ExportRecordService();

export const refreshData = (): void => {
  Taro.eventCenter.trigger(DATA_CHANGE_EVENT);
};

export const onDataChange = (callback: () => void): () => void => {
  Taro.eventCenter.on(DATA_CHANGE_EVENT, callback);
  return () => {
    Taro.eventCenter.off(DATA_CHANGE_EVENT, callback);
  };
};

export const getVoyageById = (id: string): Voyage | undefined => {
  return mockVoyages.find(v => v.id === id);
};

export { generateId, getCurrentDateTime, getCurrentDate };
