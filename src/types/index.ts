export type UserRole = 'crew' | 'dispatcher';

export type VoyageStatus = 'pending' | 'sailing' | 'anchored' | 'loading' | 'unloading' | 'completed' | 'exception';

export type ShipStatus = 'sailing' | 'anchored' | 'docked' | 'maintenance';

export type ExceptionType = 'congestion' | 'weather' | 'equipment' | 'other';

export type ExceptionStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export type MessageType = 'dispatch' | 'safety' | 'system' | 'notification';

export interface Cargo {
  id: string;
  name: string;
  weight: number;
  unit: string;
  loadingPort: string;
  unloadingPort: string;
}

export interface Port {
  id: string;
  name: string;
  arrivalTime?: string;
  departureTime?: string;
  plannedArrivalTime: string;
  plannedDepartureTime: string;
  type: 'loading' | 'unloading' | 'stopover';
}

export interface Voyage {
  id: string;
  voyageNo: string;
  shipId: string;
  shipName: string;
  status: VoyageStatus;
  statusText: string;
  cargo: Cargo[];
  totalWeight: number;
  ports: Port[];
  loadingPort: string;
  unloadingPort: string;
  departureTime: string;
  estimatedArrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  crew: string[];
  currentPortIndex: number;
  progress: number;
  distance?: number;
  createTime: string;
}

export interface Ship {
  id: string;
  name: string;
  mmsi: string;
  type: string;
  tonnage: number;
  length: number;
  width: number;
  draft: number;
  status: ShipStatus;
  statusText: string;
  currentVoyageId?: string;
  currentVoyageNo?: string;
  position: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    updateTime: string;
  };
  fuelLevel: number;
  waterLevel: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

export interface ShipDynamic {
  id: string;
  shipId: string;
  voyageId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  positionText: string;
  weather: string;
  windSpeed: number;
  windDirection: string;
  waveHeight: number;
  updateTime: string;
  remark?: string;
}

export interface LoadingRecord {
  id: string;
  voyageId: string;
  type: 'loading' | 'unloading';
  cargoName: string;
  plannedWeight: number;
  actualWeight: number;
  unit: string;
  port: string;
  operator: string;
  confirmTime?: string;
  photos: string[];
  remark?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  statusText: string;
}

export interface OilWaterSupply {
  id: string;
  voyageId: string;
  type: 'fuel' | 'water' | 'lubricant';
  quantity: number;
  unit: string;
  port: string;
  supplier: string;
  amount: number;
  receiptPhotos: string[];
  recordTime: string;
  operator: string;
}

export interface Exception {
  id: string;
  voyageId: string;
  shipId: string;
  shipName: string;
  type: ExceptionType;
  typeText: string;
  title: string;
  description: string;
  location: string;
  occurrenceTime: string;
  photos: string[];
  reporter: string;
  status: ExceptionStatus;
  statusText: string;
  handler?: string;
  handleTime?: string;
  handleResult?: string;
  createTime: string;
  updateTime: string;
}

export interface Message {
  id: string;
  type: MessageType;
  typeText: string;
  title: string;
  content: string;
  sender: string;
  receiver: string;
  voyageId?: string;
  isRead: boolean;
  readTime?: string;
  priority: 'normal' | 'urgent' | 'important';
  createTime: string;
  extra?: Record<string, any>;
}

export interface FleetOverview {
  totalShips: number;
  sailingShips: number;
  anchoredShips: number;
  dockedShips: number;
  activeVoyages: number;
  pendingExceptions: number;
  todayCompletedVoyages: number;
}

export interface TimeLineItem {
  time: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
}

export interface ArrivalConfirmation {
  id: string;
  voyageId: string;
  shipId: string;
  shipName: string;
  port: string;
  portType: 'loading' | 'unloading';
  arrivalTime: string;
  draft: number;
  waterDepth: number;
  pilotOnBoard: boolean;
  tugUsed: boolean;
  remark?: string;
  operator: string;
  confirmTime: string;
  photos: string[];
}

export interface MessageReceipt {
  id: string;
  messageId: string;
  receiverId: string;
  receiverName: string;
  voyageId?: string;
  confirmTime: string;
  remark?: string;
}

export interface ExportTemplate {
  id: string;
  name: string;
  format: 'excel' | 'pdf' | 'csv';
  formatText: string;
  contents: string[];
  voyageStatusFilter: string[];
  isDefault: boolean;
  createTime: string;
  updateTime: string;
  operator: string;
  useCount: number;
}

export interface ExportRecord {
  id: string;
  fileName: string;
  format: 'excel' | 'pdf' | 'csv';
  formatText: string;
  voyageCount: number;
  totalWeight: number;
  contents: string[];
  voyageIds: string[];
  templateId?: string;
  templateName?: string;
  status: 'pending' | 'completed' | 'failed';
  statusText: string;
  fileUrl?: string;
  createTime: string;
  operator: string;
}

export type VoyageTaskType = 'dynamic' | 'loading' | 'supply' | 'exception' | 'arrival';

export interface VoyageTask {
  id: string;
  voyageId: string;
  type: VoyageTaskType;
  typeText: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  statusText: string;
  submitTime?: string;
  submitter?: string;
  relatedRecordId?: string;
  required: boolean;
}

export interface VoyageBoardSummary {
  loadingCount: number;
  loadingConfirmedCount: number;
  supplyCount: number;
  exceptionCount: number;
  exceptionPendingCount: number;
  messageCount: number;
  messageReadCount: number;
}
