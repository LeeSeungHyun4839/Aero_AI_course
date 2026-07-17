import React, { useState } from 'react';
import { Upload, BarChart2, AlertCircle, FileText, Activity, LayoutDashboard, Download } from 'lucide-react';
import { MetricData, SummaryStats, LogEvent } from './types';
import { parseDataFile, parseLogFile, calculateSummary } from './lib/data-parser';
import { OverviewTab } from './components/OverviewTab';
import { FailureCasesTab } from './components/FailureCasesTab';
import { TimelineTab } from './components/TimelineTab';
import { ReportTab } from './components/ReportTab';
import { Button } from './components/ui';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'failures' | 'logs' | 'report'>('overview');
  const [data, setData] = useState<MetricData[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await processFiles(Array.from(files));
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      try {
        if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
          const { data: parsedData, columns } = await parseDataFile(file);
          setData(parsedData);
          setStats(calculateSummary(parsedData, columns));
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.log')) {
          const parsedLogs = await parseLogFile(file);
          setLogs(parsedLogs);
        }
      } catch (err) {
        console.error("Error processing file:", file.name, err);
        alert(`Error parsing ${file.name}`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Dropzone Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 p-12 rounded-2xl shadow-xl flex flex-col items-center border-2 border-dashed border-cyan-500/50">
            <Upload className="w-12 h-12 text-cyan-400 mb-4" />
            <h3 className="text-xl font-display font-semibold text-slate-100">Drop files here</h3>
            <p className="text-slate-400 mt-2 text-sm">Support CSV, Excel, and Log files</p>
          </div>
        </div>
      )}

      <div className="flex flex-1 h-full overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-slate-950" />
              </div>
              <span className="font-bold text-lg tracking-tight">CV-Assistant</span>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Analysis v1.0</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavButton 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
            >
              Dashboard
            </NavButton>
            <NavButton 
              active={activeTab === 'failures'} 
              onClick={() => setActiveTab('failures')}
            >
              Failure Cases
            </NavButton>
            <NavButton 
              active={activeTab === 'logs'} 
              onClick={() => setActiveTab('logs')}
            >
              Log Analysis
            </NavButton>
            <NavButton 
              active={activeTab === 'report'} 
              onClick={() => setActiveTab('report')}
            >
              Report Gen
            </NavButton>
          </nav>
          
          <div className="p-6 border-t border-slate-800">
            <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0"></div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">Dr. AI Researcher</p>
                <p className="text-xs text-slate-500">Active Session</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header Bar */}
          <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-sm font-medium text-slate-300 uppercase tracking-widest">
                Active View: <span className="text-white">{activeTab}</span>
              </h1>
              {(stats || logs.length > 0) && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">DATA LOADED</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input type="file" multiple accept=".csv,.xlsx,.txt,.log" className="hidden" onChange={handleFileUpload} />
                <div className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Data
                </div>
              </label>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            {!stats && data.length === 0 && logs.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="animate-in fade-in duration-500 h-full">
                {activeTab === 'overview' && <OverviewTab stats={stats} />}
                {activeTab === 'failures' && <FailureCasesTab data={data} />}
                {activeTab === 'logs' && <TimelineTab logs={logs} />}
                {activeTab === 'report' && <ReportTab stats={stats} />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-cyan-500/10 text-cyan-400' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
      }`}
    >
      {active && <div className="w-2 h-2 bg-cyan-400 rounded-full shrink-0"></div>}
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center">
      <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-800">
        <Upload className="w-10 h-10 text-cyan-500" />
      </div>
      <h2 className="text-xl font-display font-semibold text-slate-200 mb-3">Upload Test Results</h2>
      <p className="text-slate-400 text-sm mb-8 leading-relaxed">
        Upload your computer vision test metrics (CSV/Excel) or log files to generate statistics, identify failure cases, and create reports.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="font-semibold text-sm text-slate-300 mb-1">Metrics Data</div>
          <div className="text-xs text-slate-500 leading-relaxed">CSV or Excel with columns: tp, fp, fn...</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="font-semibold text-sm text-slate-300 mb-1">Execution Logs</div>
          <div className="text-xs text-slate-500 leading-relaxed">Text files containing system warnings and error events.</div>
        </div>
      </div>
    </div>
  );
}

