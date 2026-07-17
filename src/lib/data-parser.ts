import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { MetricData, SummaryStats, LogEvent } from '../types';

export async function parseDataFile(file: File): Promise<{ data: MetricData[], columns: string[] }> {
  return new Promise((resolve, reject) => {
    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => resolve({ data: mapToMetricData(results.data), columns: results.meta.fields || [] }),
        error: reject
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
        const columns = json.length > 0 ? Object.keys(json[0] as object) : [];
        resolve({ data: mapToMetricData(json), columns });
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    } else {
      reject(new Error("Unsupported file format"));
    }
  });
}

function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return 0;
  const parsed = parseFloat(val.replace(/,/g, '').trim());
  return isNaN(parsed) ? 0 : parsed;
}

function findKey(row: any, searchKeys: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const searchKey of searchKeys) {
    const found = keys.find(k => k.toLowerCase() === searchKey.toLowerCase());
    if (found) return found;
  }
  return undefined;
}

function mapToMetricData(data: any[]): MetricData[] {
  return data.map((row, index) => {
    const tpKey = findKey(row, ['tp']);
    const fpKey = findKey(row, ['fp']);
    const fnKey = findKey(row, ['fn']);
    const idKey = findKey(row, ['test_id', 'id']);
    const conditionKey = findKey(row, ['time_of_day', 'condition']);
    const distanceKey = findKey(row, ['range_group', 'distance']);
    const statusKey = findKey(row, ['status']);
    
    return {
      ...row,
      id: idKey ? String(row[idKey]) : `req-${index}`,
      tp: tpKey ? parseNumber(row[tpKey]) : undefined,
      fp: fpKey ? parseNumber(row[fpKey]) : undefined,
      fn: fnKey ? parseNumber(row[fnKey]) : undefined,
      condition: conditionKey ? String(row[conditionKey]) : 'Unknown',
      distance: distanceKey ? String(row[distanceKey]) : 'Unknown',
      status: statusKey ? String(row[statusKey]) : undefined,
    };
  });
}

export function calculateSummary(data: MetricData[], columns: string[]): SummaryStats {
  const hasTP = columns.some(c => c.toLowerCase() === 'tp');
  const hasFP = columns.some(c => c.toLowerCase() === 'fp');
  const hasFN = columns.some(c => c.toLowerCase() === 'fn');
  
  if (!hasTP || !hasFP || !hasFN) {
    return {
      total: data.length,
      tp: 0, fp: 0, fn: 0, tn: 0,
      precision: 0, recall: 0, f1: 0, ap: 0, fps: 0, latency: 0,
      columns,
      error: "Required columns not found: tp, fp, fn"
    };
  }

  let totalTP = 0;
  let totalFP = 0;
  let totalFN = 0;

  for (const row of data) {
    if (row.tp !== undefined) totalTP += row.tp;
    else if (row.status === 'TP') totalTP += 1;
    
    if (row.fp !== undefined) totalFP += row.fp;
    else if (row.status === 'FP') totalFP += 1;

    if (row.fn !== undefined) totalFN += row.fn;
    else if (row.status === 'FN') totalFN += 1;
  }

  const precision = totalTP + totalFP > 0 ? totalTP / (totalTP + totalFP) : 0;
  const recall = totalTP + totalFN > 0 ? totalTP / (totalTP + totalFN) : 0;
  const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

  return {
    total: data.length,
    tp: totalTP,
    fp: totalFP,
    fn: totalFN,
    tn: 0,
    precision, recall, f1,
    ap: precision * 0.95, // mockup
    fps: 32.4, // mockup
    latency: 18.2, // mockup
    columns
  };
}

export async function parseLogFile(file: File): Promise<LogEvent[]> {
  const text = await file.text();
  const lines = text.split('\n');
  return lines.filter(l => l.trim().length > 0).map((line, i) => {
    // very basic mockup log parser
    const type = line.toLowerCase().includes('error') ? 'error' : 
                 line.toLowerCase().includes('warn') ? 'warning' : 'info';
    return {
      timestamp: `10:21:${(14 + i % 60).toString().padStart(2, '0')}`,
      event: line.substring(0, 50),
      type
    };
  });
}
