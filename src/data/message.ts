import type { Message } from '@/types';

export const mockMessages: Message[] = [
  {
    id: 'm001',
    type: 'dispatch',
    typeText: '调度指令',
    title: '航行计划调整通知',
    content: '因长江武汉段交通管制，HC20260608001航次在武汉港停靠时间延长2小时，请船员注意调整休息安排，确保后续航行安全。预计到达重庆港时间不变。',
    sender: '调度中心-李明',
    receiver: '全体船员',
    voyageId: 'v001',
    isRead: false,
    priority: 'important',
    createTime: '2026-06-08 14:00',
    extra: {
      actionRequired: true,
      deadline: '2026-06-10 18:00'
    }
  },
  {
    id: 'm002',
    type: 'safety',
    typeText: '安全提醒',
    title: '汛期航行安全提醒',
    content: '目前长江流域已进入主汛期，水位上涨较快，水流湍急。请各船舶注意：1. 加强瞭望，谨慎驾驶；2. 严格遵守限速规定；3. 检查系泊设备，确保牢固；4. 遇异常情况及时报告调度中心。',
    sender: '安全管理部',
    receiver: '所有船舶',
    isRead: false,
    priority: 'urgent',
    createTime: '2026-06-08 09:00'
  },
  {
    id: 'm003',
    type: 'system',
    typeText: '系统通知',
    title: '版本更新通知',
    content: '水路运输管理App已更新至v2.1.0版本，新增功能包括：1. 船舶轨迹回放；2. 异常上报优化；3. 消息推送提醒设置。请及时更新体验新功能。',
    sender: '系统管理员',
    receiver: '所有用户',
    isRead: true,
    priority: 'normal',
    createTime: '2026-06-07 18:00'
  },
  {
    id: 'm004',
    type: 'notification',
    typeText: '消息通知',
    title: 'HC20260608001航次装货确认完成',
    content: '您提交的HC20260608001航次装货确认已通过审核，实际装货量4980吨，比计划少20吨。已生成装货单，可在航次详情中查看。',
    sender: '调度中心',
    receiver: '张船长',
    voyageId: 'v001',
    isRead: true,
    priority: 'normal',
    createTime: '2026-06-08 08:30'
  },
  {
    id: 'm005',
    type: 'dispatch',
    typeText: '调度指令',
    title: 'HC20260607001航次避险指令',
    content: '收到珠江明珠号台风预警报告，同意在肇庆港外锚地锚泊避险。请：1. 立即检查锚链、锚机状态；2. 加强值班瞭望；3. 每30分钟报告一次船舶动态；4. 台风过后及时续航，尽量追回延误时间。',
    sender: '调度中心-王芳',
    receiver: '黄船长',
    voyageId: 'v003',
    isRead: true,
    priority: 'urgent',
    createTime: '2026-06-08 12:30',
    extra: {
      actionRequired: true,
      deadline: '2026-06-08 13:00'
    }
  },
  {
    id: 'm006',
    type: 'safety',
    typeText: '安全提醒',
    title: '高温天气作业安全提醒',
    content: '近日多地出现35℃以上高温天气，请注意：1. 合理安排作业时间，避开高温时段；2. 做好防暑降温措施，配备充足饮用水；3. 检查船舶电气设备，防止过热引发火灾；4. 关注船员身体状况，发现不适及时处理。',
    sender: '安全管理部',
    receiver: '所有船舶',
    isRead: true,
    priority: 'normal',
    createTime: '2026-06-06 10:00'
  },
  {
    id: 'm007',
    type: 'notification',
    typeText: '消息通知',
    title: '异常e003已处理完成',
    content: '您上报的"武汉港待泊船舶较多"异常（编号e003）已处理完成。调度已协调缩短等待时间至3小时，请保持与VTS联系。',
    sender: '调度中心',
    receiver: '李大副',
    voyageId: 'v001',
    isRead: true,
    priority: 'normal',
    createTime: '2026-06-08 11:00'
  },
  {
    id: 'm008',
    type: 'system',
    typeText: '系统通知',
    title: '月度安全培训通知',
    content: '6月份安全培训将于6月15日14:00在线进行，培训内容包括：汛期航行安全、应急处置流程、消防设备使用。请所有船员准时参加。',
    sender: '人力资源部',
    receiver: '所有船员',
    isRead: true,
    priority: 'normal',
    createTime: '2026-06-05 09:00'
  }
];

export const getMessageById = (id: string): Message | undefined => {
  return mockMessages.find(m => m.id === id);
};

export const getMessagesByType = (type: string): Message[] => {
  if (type === 'all') return mockMessages;
  return mockMessages.filter(m => m.type === type);
};

export const getUnreadMessagesCount = (): number => {
  return mockMessages.filter(m => !m.isRead).length;
};

export const getUnreadMessagesByType = (type: string): number => {
  return mockMessages.filter(m => !m.isRead && (type === 'all' || m.type === type)).length;
};
