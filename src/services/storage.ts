import Taro from '@tarojs/taro';

const STORAGE_VERSION_KEY = 'water_transport_storage_version';
const CURRENT_STORAGE_VERSION = '1.0.0';

export abstract class BaseStorageService<T extends { id: string }> {
  protected storageKey: string;
  protected mockData: T[];

  constructor(storageKey: string, mockData: T[]) {
    this.storageKey = storageKey;
    this.mockData = mockData;
    this.initializeStorage();
  }

  protected initializeStorage(): void {
    try {
      const version = Taro.getStorageSync(STORAGE_VERSION_KEY);
      if (version !== CURRENT_STORAGE_VERSION) {
        Taro.setStorageSync(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
        this.resetToMockData();
        return;
      }

      const existingData = Taro.getStorageSync(this.storageKey);
      if (!existingData || !Array.isArray(existingData) || existingData.length === 0) {
        this.resetToMockData();
      }
    } catch (error) {
      console.error(`[BaseStorageService] 初始化存储失败 [${this.storageKey}]:`, error);
      this.resetToMockData();
    }
  }

  protected resetToMockData(): void {
    try {
      Taro.setStorageSync(this.storageKey, [...this.mockData]);
    } catch (error) {
      console.error(`[BaseStorageService] 重置数据失败 [${this.storageKey}]:`, error);
    }
  }

  public getAll(): T[] {
    try {
      const data = Taro.getStorageSync(this.storageKey);
      return Array.isArray(data) ? data : [...this.mockData];
    } catch (error) {
      console.error(`[BaseStorageService] 获取数据失败 [${this.storageKey}]:`, error);
      return [...this.mockData];
    }
  }

  public getById(id: string): T | undefined {
    const all = this.getAll();
    return all.find(item => item.id === id);
  }

  public add(item: T): T {
    try {
      const all = this.getAll();
      all.unshift(item);
      Taro.setStorageSync(this.storageKey, all);
      console.log(`[BaseStorageService] 添加数据 [${this.storageKey}]:`, item.id);
      return item;
    } catch (error) {
      console.error(`[BaseStorageService] 添加数据失败 [${this.storageKey}]:`, error);
      throw error;
    }
  }

  public update(id: string, updates: Partial<T>): T | undefined {
    try {
      const all = this.getAll();
      const index = all.findIndex(item => item.id === id);
      if (index === -1) {
        console.warn(`[BaseStorageService] 更新数据未找到 [${this.storageKey}]:`, id);
        return undefined;
      }

      const updated = { ...all[index], ...updates } as T;
      all[index] = updated;
      Taro.setStorageSync(this.storageKey, all);
      console.log(`[BaseStorageService] 更新数据 [${this.storageKey}]:`, id);
      return updated;
    } catch (error) {
      console.error(`[BaseStorageService] 更新数据失败 [${this.storageKey}]:`, error);
      throw error;
    }
  }

  public delete(id: string): boolean {
    try {
      const all = this.getAll();
      const filtered = all.filter(item => item.id !== id);
      if (filtered.length === all.length) {
        return false;
      }
      Taro.setStorageSync(this.storageKey, filtered);
      console.log(`[BaseStorageService] 删除数据 [${this.storageKey}]:`, id);
      return true;
    } catch (error) {
      console.error(`[BaseStorageService] 删除数据失败 [${this.storageKey}]:`, error);
      return false;
    }
  }

  public filter(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  public clear(): void {
    try {
      Taro.removeStorageSync(this.storageKey);
      this.initializeStorage();
    } catch (error) {
      console.error(`[BaseStorageService] 清空数据失败 [${this.storageKey}]:`, error);
    }
  }
}

export const generateId = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
};

export const getCurrentDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
