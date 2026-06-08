import type { Ship, ShipDynamic, LoadingRecord, OilWaterSupply, FleetOverview } from '@/types';

export const mockShips: Ship[] = [
  {
    id: 's001',
    name: '长江之星',
    mmsi: '413345678',
    type: '集装箱船',
    tonnage: 8000,
    length: 120,
    width: 22,
    draft: 6.5,
    status: 'sailing',
    statusText: '航行中',
    currentVoyageId: 'v001',
    currentVoyageNo: 'HC20260608001',
    position: {
      latitude: 30.5234,
      longitude: 114.3256,
      heading: 285,
      speed: 12.5,
      updateTime: '2026-06-08 14:30'
    },
    fuelLevel: 75,
    waterLevel: 68,
    lastMaintenanceDate: '2026-04-15',
    nextMaintenanceDate: '2026-07-15'
  },
  {
    id: 's002',
    name: '黄河一号',
    mmsi: '413345679',
    type: '散货船',
    tonnage: 6000,
    length: 105,
    width: 18,
    draft: 5.8,
    status: 'docked',
    statusText: '停靠',
    currentVoyageId: 'v002',
    currentVoyageNo: 'HC20260608002',
    position: {
      latitude: 32.0658,
      longitude: 118.7969,
      heading: 0,
      speed: 0,
      updateTime: '2026-06-08 14:00'
    },
    fuelLevel: 82,
    waterLevel: 75,
    lastMaintenanceDate: '2026-05-10',
    nextMaintenanceDate: '2026-08-10'
  },
  {
    id: 's003',
    name: '珠江明珠',
    mmsi: '413345680',
    type: '散货船',
    tonnage: 7000,
    length: 110,
    width: 20,
    draft: 6.0,
    status: 'anchored',
    statusText: '锚泊',
    currentVoyageId: 'v003',
    currentVoyageNo: 'HC20260607001',
    position: {
      latitude: 23.1291,
      longitude: 112.4567,
      heading: 180,
      speed: 0,
      updateTime: '2026-06-08 13:45'
    },
    fuelLevel: 60,
    waterLevel: 55,
    lastMaintenanceDate: '2026-03-20',
    nextMaintenanceDate: '2026-06-20'
  },
  {
    id: 's004',
    name: '淮河之韵',
    mmsi: '413345681',
    type: '杂货船',
    tonnage: 5000,
    length: 98,
    width: 16,
    draft: 5.2,
    status: 'sailing',
    statusText: '航行中',
    currentVoyageId: 'v004',
    currentVoyageNo: 'HC20260605001',
    position: {
      latitude: 32.3942,
      longitude: 119.4129,
      heading: 95,
      speed: 10.8,
      updateTime: '2026-06-08 14:20'
    },
    fuelLevel: 45,
    waterLevel: 62,
    lastMaintenanceDate: '2026-05-01',
    nextMaintenanceDate: '2026-08-01'
  },
  {
    id: 's005',
    name: '松花江畔',
    mmsi: '413345682',
    type: '木材船',
    tonnage: 5500,
    length: 102,
    width: 17,
    draft: 5.5,
    status: 'maintenance',
    statusText: '维护中',
    position: {
      latitude: 45.7752,
      longitude: 126.6429,
      heading: 0,
      speed: 0,
      updateTime: '2026-06-08 08:00'
    },
    fuelLevel: 30,
    waterLevel: 40,
    lastMaintenanceDate: '2026-06-08',
    nextMaintenanceDate: '2026-09-08'
  }
];

export const mockShipDynamics: ShipDynamic[] = [
  {
    id: 'd001',
    shipId: 's001',
    voyageId: 'v001',
    latitude: 30.5234,
    longitude: 114.3256,
    heading: 285,
    speed: 12.5,
    positionText: '长江武汉段',
    weather: '晴',
    windSpeed: 3,
    windDirection: '东南风',
    waveHeight: 0.5,
    updateTime: '2026-06-08 14:30',
    remark: '航行正常'
  },
  {
    id: 'd002',
    shipId: 's001',
    voyageId: 'v001',
    latitude: 30.4567,
    longitude: 114.2890,
    heading: 282,
    speed: 11.8,
    positionText: '长江赤壁段',
    weather: '多云',
    windSpeed: 4,
    windDirection: '东南风',
    waveHeight: 0.6,
    updateTime: '2026-06-08 12:30',
    remark: '保持航向'
  },
  {
    id: 'd003',
    shipId: 's001',
    voyageId: 'v001',
    latitude: 30.3456,
    longitude: 114.1567,
    heading: 280,
    speed: 13.2,
    positionText: '长江洪湖段',
    weather: '晴',
    windSpeed: 2,
    windDirection: '东风',
    waveHeight: 0.3,
    updateTime: '2026-06-08 10:30',
    remark: '加速航行'
  }
];

export const mockLoadingRecords: LoadingRecord[] = [
  {
    id: 'lr001',
    voyageId: 'v001',
    type: 'loading',
    cargoName: '集装箱',
    plannedWeight: 3000,
    actualWeight: 3000,
    unit: '吨',
    port: '上海港',
    operator: '张船长',
    confirmTime: '2026-06-08 07:30',
    photos: [
      'https://picsum.photos/id/1/600/400',
      'https://picsum.photos/id/2/600/400'
    ],
    remark: '装货完成，数量准确',
    status: 'confirmed'
  },
  {
    id: 'lr002',
    voyageId: 'v001',
    type: 'loading',
    cargoName: '钢材',
    plannedWeight: 2000,
    actualWeight: 1980,
    unit: '吨',
    port: '上海港',
    operator: '张船长',
    confirmTime: '2026-06-08 08:00',
    photos: [
      'https://picsum.photos/id/3/600/400'
    ],
    remark: '实际装载量比计划少20吨，已与码头确认',
    status: 'confirmed'
  },
  {
    id: 'lr003',
    voyageId: 'v001',
    type: 'unloading',
    cargoName: '钢材',
    plannedWeight: 1980,
    actualWeight: 0,
    unit: '吨',
    port: '武汉港',
    operator: '',
    photos: [],
    status: 'pending'
  },
  {
    id: 'lr004',
    voyageId: 'v002',
    type: 'loading',
    cargoName: '煤炭',
    plannedWeight: 3500,
    actualWeight: 0,
    unit: '吨',
    port: '南京港',
    operator: '',
    photos: [],
    status: 'pending'
  }
];

export const mockOilWaterSupplies: OilWaterSupply[] = [
  {
    id: 'ow001',
    voyageId: 'v001',
    type: 'fuel',
    quantity: 200,
    unit: '吨',
    port: '上海港',
    supplier: '中石化燃料油销售有限公司',
    amount: 980000,
    receiptPhotos: [
      'https://picsum.photos/id/6/600/400'
    ],
    recordTime: '2026-06-08 06:00',
    operator: '王轮机长'
  },
  {
    id: 'ow002',
    voyageId: 'v001',
    type: 'water',
    quantity: 50,
    unit: '吨',
    port: '上海港',
    supplier: '上海港务集团',
    amount: 2500,
    receiptPhotos: [
      'https://picsum.photos/id/8/600/400'
    ],
    recordTime: '2026-06-08 06:30',
    operator: '王轮机长'
  }
];

export const mockFleetOverview: FleetOverview = {
  totalShips: 5,
  sailingShips: 2,
  anchoredShips: 1,
  dockedShips: 1,
  activeVoyages: 4,
  pendingExceptions: 2,
  todayCompletedVoyages: 1
};

export const getShipById = (id: string): Ship | undefined => {
  return mockShips.find(s => s.id === id);
};

export const getShipDynamicsByVoyage = (voyageId: string): ShipDynamic[] => {
  return mockShipDynamics.filter(d => d.voyageId === voyageId);
};

export const getLoadingRecordsByVoyage = (voyageId: string): LoadingRecord[] => {
  return mockLoadingRecords.filter(r => r.voyageId === voyageId);
};

export const getOilWaterSuppliesByVoyage = (voyageId: string): OilWaterSupply[] => {
  return mockOilWaterSupplies.filter(s => s.voyageId === voyageId);
};
