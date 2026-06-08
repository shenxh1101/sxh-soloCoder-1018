import dayjs from 'dayjs';
import type { VoyageStatus, ShipStatus, ExceptionType, ExceptionStatus, MessageType } from '@/types';

export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm'): string => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatDate = (date: string | Date): string => {
  return formatDateTime(date, 'YYYY-MM-DD');
};

export const formatTime = (date: string | Date): string => {
  return formatDateTime(date, 'HH:mm');
};

export const formatNumber = (num: number, decimals = 2): string => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return num.toFixed(decimals);
};

export const getVoyageStatusConfig = (status: VoyageStatus): { text: string; className: string } => {
  const configs: Record<VoyageStatus, { text: string; className: string }> = {
    pending: { text: '待执行', className: 'primary' },
    sailing: { text: '航行中', className: 'success' },
    anchored: { text: '锚泊', className: 'warning' },
    loading: { text: '装货中', className: 'primary' },
    unloading: { text: '卸货中', className: 'primary' },
    completed: { text: '已完成', className: 'primary' },
    exception: { text: '异常', className: 'error' }
  };
  return configs[status] || { text: status, className: 'primary' };
};

export const getShipStatusConfig = (status: ShipStatus): { text: string; className: string } => {
  const configs: Record<ShipStatus, { text: string; className: string }> = {
    sailing: { text: '航行中', className: 'success' },
    anchored: { text: '锚泊', className: 'warning' },
    docked: { text: '停靠', className: 'primary' },
    maintenance: { text: '维护中', className: 'error' }
  };
  return configs[status] || { text: status, className: 'primary' };
};

export const getExceptionTypeConfig = (type: ExceptionType): { text: string; className: string } => {
  const configs: Record<ExceptionType, { text: string; className: string }> = {
    congestion: { text: '航道拥堵', className: 'warning' },
    weather: { text: '恶劣天气', className: 'error' },
    equipment: { text: '设备故障', className: 'error' },
    other: { text: '其他异常', className: 'primary' }
  };
  return configs[type] || { text: type, className: 'primary' };
};

export const getExceptionStatusConfig = (status: ExceptionStatus): { text: string; className: string } => {
  const configs: Record<ExceptionStatus, { text: string; className: string }> = {
    pending: { text: '待处理', className: 'error' },
    processing: { text: '处理中', className: 'warning' },
    resolved: { text: '已解决', className: 'success' },
    closed: { text: '已关闭', className: 'primary' }
  };
  return configs[status] || { text: status, className: 'primary' };
};

export const getMessageTypeConfig = (type: MessageType): { text: string; className: string } => {
  const configs: Record<MessageType, { text: string; className: string }> = {
    dispatch: { text: '调度指令', className: 'primary' },
    safety: { text: '安全提醒', className: 'warning' },
    system: { text: '系统通知', className: 'primary' },
    notification: { text: '消息通知', className: 'success' }
  };
  return configs[type] || { text: type, className: 'primary' };
};

export const formatDuration = (minutes: number): string => {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  }
  return `${mins}分钟`;
};

export const getRelativeTime = (date: string | Date): string => {
  if (!date) return '';
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');
  
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  
  const diffHours = now.diff(target, 'hour');
  if (diffHours < 24) return `${diffHours}小时前`;
  
  const diffDays = now.diff(target, 'day');
  if (diffDays < 7) return `${diffDays}天前`;
  
  return formatDate(date);
};

export const getHeadingText = (heading: number): string => {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const index = Math.round(heading / 45) % 8;
  return `${heading}° ${directions[index]}`;
};

export const formatSpeed = (speed: number): string => {
  if (speed === null || speed === undefined) return '-';
  return `${speed.toFixed(1)} 节`;
};

export const formatWeight = (weight: number, unit = '吨'): string => {
  if (weight === null || weight === undefined) return '-';
  return `${weight.toFixed(2)} ${unit}`;
};

export const formatPercentage = (value: number): string => {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}%`;
};
