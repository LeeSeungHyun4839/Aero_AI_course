export interface MetricData {
  id: string;
  image?: string;
  image_file?: string;
  imageUrl?: string;
  imageMatched?: boolean;
  expectedImageName?: string;
  
  // Base CSV columns
  confidence?: number;
  iou?: number;
  label?: string; // fallback
  prediction?: string; // fallback
  condition?: string;
  distance?: string;
  status?: string;
  tp?: number;
  fp?: number;
  fn?: number;
  
  // Failure cases specific columns
  case_id?: string;
  detection_id?: string;
  test_id?: string;
  error_type?: string;
  severity?: string;
  gt_class?: string;
  pred_class?: string;
  condition_summary?: string;
  observation?: string;
  suspected_cause?: string;
  review_status?: string;
  user_memo?: string;

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

export interface MissingImageRecord {
  case_id?: string;
  test_id?: string;
  image_file?: string;
  expectedName: string;
}

export interface UploadSummary {
  csvCases: number;
  imagesUploaded: number;
  imagesMatched: number;
  imagesMissing: number;
  duplicates: number;
  missingFiles: MissingImageRecord[];
  duplicateFiles: string[];
}

export interface LogEvent {
  timestamp: string;
  event: string;
  type: 'info' | 'warning' | 'error' | 'critical';
}

