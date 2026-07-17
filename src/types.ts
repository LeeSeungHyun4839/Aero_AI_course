export interface MetricData {
  id: string;
  image?: string;
  confidence?: number;
  iou?: number;
  label?: string;
  prediction?: string;
  condition?: string; // e.g. Day, Night
  distance?: string; // e.g. Near, Far
  status?: string;
  tp?: number;
  fp?: number;
  fn?: number;
  [key: string]: any;
}

export interface SummaryStats {
  total: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  f1: number;
  ap: number;
  fps: number;
  latency: number;
  columns?: string[];
  error?: string;
}

export interface LogEvent {
  timestamp: string;
  event: string;
  type: 'info' | 'warning' | 'error' | 'critical';
}
