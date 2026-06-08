import Taro from '@tarojs/taro';
import { BaseStorageService, generateId, getCurrentDateTime, getCurrentDate } from './storage';
import { mockLoadingRecords, mockOilWaterSupplies, mockExceptions, mockMessages, mockShipDynamics } from '@/data';
import { mockVoyages } from '@/data/voyage';
import type {
  LoadingRecord,
  OilWaterSupply,
  Exception,
  Message,
  ExportRecord,
  ExportTemplate,
  ArrivalConfirmation,
  MessageReceipt,
  ShipDynamic,
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

class ShipDynamicService extends BaseStorageService<ShipDynamic> {
  constructor() {
    super('wt_ship_dynamics', mockShipDynamics);
  }

  public getByVoyageId(voyageId: string): ShipDynamic[] {
    return this.filter(d => d.voyageId === voyageId);
  }

  public getLatestByVoyageId(voyageId: string): ShipDynamic | undefined {
    const list = this.getByVoyageId(voyageId);
    return list.length > 0 ? list[0] : undefined;
  }

  public addDynamic(dynamic: Omit<ShipDynamic, 'id' | 'updateTime'>): ShipDynamic {
    const now = getCurrentDateTime();
    const newDynamic: ShipDynamic = {
      ...dynamic,
      id: generateId('dyn'),
      updateTime: now
    };
    return this.add(newDynamic);
  }
}

class ArrivalConfirmationService extends BaseStorageService<ArrivalConfirmation> {
  constructor() {
    super('wt_arrival_confirmations', []);
  }

  public getByVoyageId(voyageId: string): ArrivalConfirmation[] {
    return this.filter(c => c.voyageId === voyageId);
  }

  public getLatestByVoyageId(voyageId: string): ArrivalConfirmation | undefined {
    const list = this.getByVoyageId(voyageId);
    return list.length > 0 ? list[0] : undefined;
  }

  public addConfirmation(confirmation: Omit<ArrivalConfirmation, 'id' | 'confirmTime'>): ArrivalConfirmation {
    const now = getCurrentDateTime();
    const newConfirmation: ArrivalConfirmation = {
      ...confirmation,
      id: generateId('arr'),
      confirmTime: now
    };
    return this.add(newConfirmation);
  }
}

class MessageReceiptService extends BaseStorageService<MessageReceipt> {
  constructor() {
    super('wt_message_receipts', []);
  }

  public getByMessageId(messageId: string): MessageReceipt[] {
    return this.filter(r => r.messageId === messageId);
  }

  public getByVoyageId(voyageId: string): MessageReceipt[] {
    return this.filter(r => r.voyageId === voyageId);
  }

  public getReadCountByMessageId(messageId: string): number {
    return this.getByMessageId(messageId).length;
  }

  public addReceipt(receipt: Omit<MessageReceipt, 'id' | 'confirmTime'>): MessageReceipt {
    const now = getCurrentDateTime();
    const newReceipt: MessageReceipt = {
      ...receipt,
      id: generateId('rcpt'),
      confirmTime: now
    };
    return this.add(newReceipt);
  }
}

class ExportTemplateService extends BaseStorageService<ExportTemplate> {
  constructor() {
    super('wt_export_templates', []);
  }

  public getDefault(): ExportTemplate | undefined {
    return this.find(t => t.isDefault);
  }

  public incrementUseCount(templateId: string): ExportTemplate | undefined {
    const template = this.getById(templateId);
    if (template) {
      return this.update(templateId, {
        useCount: template.useCount + 1,
        updateTime: getCurrentDateTime()
      });
    }
    return undefined;
  }

  public setDefault(templateId: string): void {
    const all = this.getAll();
    const updated = all.map(t => ({
      ...t,
      isDefault: t.id === templateId
    }));
    Taro.setStorageSync(this.storageKey, updated);
    refreshData();
  }

  public createTemplate(template: Omit<ExportTemplate, 'id' | 'createTime' | 'updateTime' | 'useCount'>): ExportTemplate {
    const now = getCurrentDateTime();
    const newTemplate: ExportTemplate = {
      ...template,
      id: generateId('tpl'),
      createTime: now,
      updateTime: now,
      useCount: 0
    };
    return this.add(newTemplate);
  }
}

export const loadingRecordService = new LoadingRecordService();
export const oilWaterSupplyService = new OilWaterSupplyService();
export const exceptionService = new ExceptionService();
export const messageService = new MessageService();
export const exportRecordService = new ExportRecordService();
export const shipDynamicService = new ShipDynamicService();
export const arrivalConfirmationService = new ArrivalConfirmationService();
export const messageReceiptService = new MessageReceiptService();
export const exportTemplateService = new ExportTemplateService();

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
