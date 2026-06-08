import type { Exception } from '@/types';

export const mockExceptions: Exception[] = [
  {
    id: 'e001',
    voyageId: 'v003',
    shipId: 's003',
    shipName: '珠江明珠',
    type: 'weather',
    typeText: '恶劣天气',
    title: '台风预警，需紧急避险',
    description: '收到气象部门台风预警，预计2小时后将受台风外围影响，风力可达8-9级，浪高2.5米。现已在肇庆港外锚地锚泊避险，请求调度指示。',
    location: '珠江口肇庆段',
    occurrenceTime: '2026-06-08 12:00',
    photos: [
      'https://picsum.photos/id/1036/600/400',
      'https://picsum.photos/id/1018/600/400'
    ],
    reporter: '黄船长',
    status: 'processing',
    statusText: '处理中',
    handler: '李调度',
    handleTime: '2026-06-08 12:30',
    handleResult: '已收到报告，请保持锚泊状态，注意观察天气变化，每30分钟报告一次船舶状态。已联系肇庆港务协调临时停靠泊位。',
    createTime: '2026-06-08 12:05',
    updateTime: '2026-06-08 13:00'
  },
  {
    id: 'e002',
    voyageId: 'v006',
    shipId: 's001',
    shipName: '长江之星',
    type: 'equipment',
    typeText: '设备故障',
    title: '主机冷却水系统故障',
    description: '航行中发现主机冷却水温度异常升高，检查发现冷却水泵出现异响，已降低航速至6节，目前温度维持在85℃（正常65-75℃）。预计到达前方宜昌港需12小时，请求安排维修人员在宜昌港待命。',
    location: '长江宜昌段',
    occurrenceTime: '2026-06-08 10:30',
    photos: [
      'https://picsum.photos/id/160/600/400',
      'https://picsum.photos/id/201/600/400'
    ],
    reporter: '王轮机长',
    status: 'pending',
    statusText: '待处理',
    createTime: '2026-06-08 10:35',
    updateTime: '2026-06-08 10:35'
  },
  {
    id: 'e003',
    voyageId: 'v001',
    shipId: 's001',
    shipName: '长江之星',
    type: 'congestion',
    typeText: '航道拥堵',
    title: '武汉港待泊船舶较多',
    description: '接近武汉港，收到VTS通知，目前武汉港待泊船舶有15艘，预计需等待6-8小时才能靠泊。目前船舶状态良好，燃油充足。',
    location: '长江武汉段上游',
    occurrenceTime: '2026-06-08 08:00',
    photos: [
      'https://picsum.photos/id/1039/600/400'
    ],
    reporter: '李大副',
    status: 'resolved',
    statusText: '已解决',
    handler: '王调度',
    handleTime: '2026-06-08 08:30',
    handleResult: '已协调武汉港务调整靠泊计划，预计等待时间缩短至3小时。请保持与VTS联系，听从交通管制安排。',
    createTime: '2026-06-08 08:05',
    updateTime: '2026-06-08 11:00'
  },
  {
    id: 'e004',
    voyageId: 'v002',
    shipId: 's002',
    shipName: '黄河一号',
    type: 'other',
    typeText: '其他异常',
    title: '码头装卸设备检修',
    description: '南京港通知，3号泊位门机需进行紧急检修，预计影响装货作业4小时。原计划今日12时离港可能推迟至16时。',
    location: '南京港3号泊位',
    occurrenceTime: '2026-06-08 09:00',
    photos: [],
    reporter: '刘船长',
    status: 'closed',
    statusText: '已关闭',
    handler: '张调度',
    handleTime: '2026-06-08 09:30',
    handleResult: '已知悉，请注意调整航行计划，确保安全。已通知目的港宜昌港调整卸货计划。',
    createTime: '2026-06-08 09:05',
    updateTime: '2026-06-08 14:00'
  }
];

export const getExceptionById = (id: string): Exception | undefined => {
  return mockExceptions.find(e => e.id === id);
};

export const getExceptionsByVoyage = (voyageId: string): Exception[] => {
  return mockExceptions.filter(e => e.voyageId === voyageId);
};

export const getExceptionsByStatus = (status: string): Exception[] => {
  if (status === 'all') return mockExceptions;
  return mockExceptions.filter(e => e.status === status);
};

export const getPendingExceptionsCount = (): number => {
  return mockExceptions.filter(e => e.status === 'pending' || e.status === 'processing').length;
};
