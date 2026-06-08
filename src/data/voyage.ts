import type { Voyage, TimeLineItem } from '@/types';

export const mockVoyages: Voyage[] = [
  {
    id: 'v001',
    voyageNo: 'HC20260608001',
    shipId: 's001',
    shipName: '长江之星',
    status: 'sailing',
    statusText: '航行中',
    totalWeight: 5000,
    loadingPort: '上海港',
    unloadingPort: '重庆港',
    departureTime: '2026-06-08 08:00',
    estimatedArrivalTime: '2026-06-12 18:00',
    actualDepartureTime: '2026-06-08 08:15',
    crew: ['张船长', '李大副', '王轮机长', '赵水手长'],
    currentPortIndex: 1,
    progress: 35,
    distance: 1800,
    createTime: '2026-06-01 10:00',
    cargo: [
      {
        id: 'c001',
        name: '集装箱',
        weight: 3000,
        unit: '吨',
        loadingPort: '上海港',
        unloadingPort: '重庆港'
      },
      {
        id: 'c002',
        name: '钢材',
        weight: 2000,
        unit: '吨',
        loadingPort: '上海港',
        unloadingPort: '武汉港'
      }
    ],
    ports: [
      {
        id: 'p001',
        name: '上海港',
        plannedArrivalTime: '2026-06-08 06:00',
        plannedDepartureTime: '2026-06-08 08:00',
        arrivalTime: '2026-06-08 05:45',
        departureTime: '2026-06-08 08:15',
        type: 'loading'
      },
      {
        id: 'p002',
        name: '武汉港',
        plannedArrivalTime: '2026-06-10 14:00',
        plannedDepartureTime: '2026-06-10 18:00',
        type: 'stopover'
      },
      {
        id: 'p003',
        name: '重庆港',
        plannedArrivalTime: '2026-06-12 18:00',
        plannedDepartureTime: '2026-06-13 08:00',
        type: 'unloading'
      }
    ]
  },
  {
    id: 'v002',
    voyageNo: 'HC20260608002',
    shipId: 's002',
    shipName: '黄河一号',
    status: 'loading',
    statusText: '装货中',
    totalWeight: 3500,
    loadingPort: '南京港',
    unloadingPort: '宜昌港',
    departureTime: '2026-06-09 12:00',
    estimatedArrivalTime: '2026-06-11 20:00',
    crew: ['刘船长', '陈大副', '周轮机长'],
    currentPortIndex: 0,
    progress: 10,
    distance: 950,
    createTime: '2026-06-02 14:00',
    cargo: [
      {
        id: 'c003',
        name: '煤炭',
        weight: 3500,
        unit: '吨',
        loadingPort: '南京港',
        unloadingPort: '宜昌港'
      }
    ],
    ports: [
      {
        id: 'p004',
        name: '南京港',
        plannedArrivalTime: '2026-06-08 16:00',
        plannedDepartureTime: '2026-06-09 12:00',
        arrivalTime: '2026-06-08 15:30',
        type: 'loading'
      },
      {
        id: 'p005',
        name: '宜昌港',
        plannedArrivalTime: '2026-06-11 20:00',
        plannedDepartureTime: '2026-06-12 12:00',
        type: 'unloading'
      }
    ]
  },
  {
    id: 'v003',
    voyageNo: 'HC20260607001',
    shipId: 's003',
    shipName: '珠江明珠',
    status: 'anchored',
    statusText: '锚泊',
    totalWeight: 4200,
    loadingPort: '广州港',
    unloadingPort: '南宁港',
    departureTime: '2026-06-07 10:00',
    estimatedArrivalTime: '2026-06-10 16:00',
    actualDepartureTime: '2026-06-07 10:30',
    crew: ['黄船长', '吴大副', '郑轮机长', '孙水手长', '钱水手'],
    currentPortIndex: 0,
    progress: 25,
    distance: 680,
    createTime: '2026-06-01 09:00',
    cargo: [
      {
        id: 'c004',
        name: '粮食',
        weight: 4200,
        unit: '吨',
        loadingPort: '广州港',
        unloadingPort: '南宁港'
      }
    ],
    ports: [
      {
        id: 'p006',
        name: '广州港',
        plannedArrivalTime: '2026-06-07 06:00',
        plannedDepartureTime: '2026-06-07 10:00',
        arrivalTime: '2026-06-07 05:50',
        departureTime: '2026-06-07 10:30',
        type: 'loading'
      },
      {
        id: 'p007',
        name: '肇庆港',
        plannedArrivalTime: '2026-06-08 20:00',
        plannedDepartureTime: '2026-06-09 08:00',
        type: 'stopover'
      },
      {
        id: 'p008',
        name: '南宁港',
        plannedArrivalTime: '2026-06-10 16:00',
        plannedDepartureTime: '2026-06-11 08:00',
        type: 'unloading'
      }
    ]
  },
  {
    id: 'v004',
    voyageNo: 'HC20260605001',
    shipId: 's004',
    shipName: '淮河之韵',
    status: 'completed',
    statusText: '已完成',
    totalWeight: 2800,
    loadingPort: '蚌埠港',
    unloadingPort: '扬州港',
    departureTime: '2026-06-05 08:00',
    estimatedArrivalTime: '2026-06-07 14:00',
    actualDepartureTime: '2026-06-05 08:20',
    actualArrivalTime: '2026-06-07 13:45',
    crew: ['马船长', '朱大副', '胡轮机长'],
    currentPortIndex: 2,
    progress: 100,
    distance: 420,
    createTime: '2026-05-30 11:00',
    cargo: [
      {
        id: 'c005',
        name: '化肥',
        weight: 2800,
        unit: '吨',
        loadingPort: '蚌埠港',
        unloadingPort: '扬州港'
      }
    ],
    ports: [
      {
        id: 'p009',
        name: '蚌埠港',
        plannedArrivalTime: '2026-06-05 06:00',
        plannedDepartureTime: '2026-06-05 08:00',
        arrivalTime: '2026-06-05 05:55',
        departureTime: '2026-06-05 08:20',
        type: 'loading'
      },
      {
        id: 'p010',
        name: '淮安港',
        plannedArrivalTime: '2026-06-06 12:00',
        plannedDepartureTime: '2026-06-06 16:00',
        arrivalTime: '2026-06-06 11:30',
        departureTime: '2026-06-06 15:45',
        type: 'stopover'
      },
      {
        id: 'p011',
        name: '扬州港',
        plannedArrivalTime: '2026-06-07 14:00',
        plannedDepartureTime: '2026-06-08 08:00',
        arrivalTime: '2026-06-07 13:45',
        departureTime: '2026-06-08 07:30',
        type: 'unloading'
      }
    ]
  },
  {
    id: 'v005',
    voyageNo: 'HC20260609001',
    shipId: 's005',
    shipName: '松花江畔',
    status: 'pending',
    statusText: '待执行',
    totalWeight: 3200,
    loadingPort: '哈尔滨港',
    unloadingPort: '佳木斯港',
    departureTime: '2026-06-09 10:00',
    estimatedArrivalTime: '2026-06-11 12:00',
    crew: ['郭船长', '何大副', '高轮机长'],
    currentPortIndex: 0,
    progress: 0,
    distance: 580,
    createTime: '2026-06-03 16:00',
    cargo: [
      {
        id: 'c006',
        name: '木材',
        weight: 3200,
        unit: '吨',
        loadingPort: '哈尔滨港',
        unloadingPort: '佳木斯港'
      }
    ],
    ports: [
      {
        id: 'p012',
        name: '哈尔滨港',
        plannedArrivalTime: '2026-06-09 08:00',
        plannedDepartureTime: '2026-06-09 10:00',
        type: 'loading'
      },
      {
        id: 'p013',
        name: '佳木斯港',
        plannedArrivalTime: '2026-06-11 12:00',
        plannedDepartureTime: '2026-06-12 08:00',
        type: 'unloading'
      }
    ]
  },
  {
    id: 'v006',
    voyageNo: 'HC20260606001',
    shipId: 's001',
    shipName: '长江之星',
    status: 'exception',
    statusText: '异常',
    totalWeight: 4500,
    loadingPort: '南通港',
    unloadingPort: '泸州港',
    departureTime: '2026-06-06 14:00',
    estimatedArrivalTime: '2026-06-11 20:00',
    actualDepartureTime: '2026-06-06 14:30',
    crew: ['张船长', '李大副', '王轮机长'],
    currentPortIndex: 1,
    progress: 45,
    distance: 1200,
    createTime: '2026-05-28 10:00',
    cargo: [
      {
        id: 'c007',
        name: '化工原料',
        weight: 4500,
        unit: '吨',
        loadingPort: '南通港',
        unloadingPort: '泸州港'
      }
    ],
    ports: [
      {
        id: 'p014',
        name: '南通港',
        plannedArrivalTime: '2026-06-06 10:00',
        plannedDepartureTime: '2026-06-06 14:00',
        arrivalTime: '2026-06-06 09:45',
        departureTime: '2026-06-06 14:30',
        type: 'loading'
      },
      {
        id: 'p015',
        name: '宜昌港',
        plannedArrivalTime: '2026-06-09 08:00',
        plannedDepartureTime: '2026-06-09 12:00',
        type: 'stopover'
      },
      {
        id: 'p016',
        name: '泸州港',
        plannedArrivalTime: '2026-06-11 20:00',
        plannedDepartureTime: '2026-06-12 12:00',
        type: 'unloading'
      }
    ]
  }
];

export const getVoyageById = (id: string): Voyage | undefined => {
  return mockVoyages.find(v => v.id === id);
};

export const getCurrentVoyage = (): Voyage | undefined => {
  return mockVoyages.find(v => v.status === 'sailing' || v.status === 'loading' || v.status === 'anchored');
};

export const getVoyageTimeline = (voyage: Voyage): TimeLineItem[] => {
  const items: TimeLineItem[] = [];
  
  voyage.ports.forEach((port, index) => {
    if (index <= voyage.currentPortIndex) {
      if (port.arrivalTime) {
        items.push({
          time: port.arrivalTime,
          title: `抵达${port.name}`,
          description: port.type === 'loading' ? '开始装货作业' : port.type === 'unloading' ? '开始卸货作业' : '中途停靠',
          status: index < voyage.currentPortIndex ? 'completed' : 'current'
        });
      }
      if (port.departureTime && index < voyage.currentPortIndex) {
        items.push({
          time: port.departureTime,
          title: `离开${port.name}`,
          description: port.type === 'loading' ? '装货完成，离港出发' : port.type === 'unloading' ? '卸货完成，离港出发' : '停靠结束，继续航行',
          status: 'completed'
        });
      }
    } else {
      items.push({
        time: port.plannedArrivalTime,
        title: `预计抵达${port.name}`,
        description: port.type === 'loading' ? '计划装货作业' : port.type === 'unloading' ? '计划卸货作业' : '计划中途停靠',
        status: 'pending'
      });
    }
  });
  
  return items;
};
