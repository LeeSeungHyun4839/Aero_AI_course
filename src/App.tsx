import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, BarChart2, AlertCircle, FileText, Activity, LayoutDashboard, Download, CheckCircle2 } from 'lucide-react';
import { MetricData, SummaryStats, LogEvent, UploadSummary } from './types';
import { parseDataFile, parseLogFile, calculateSummary } from './lib/data-parser';
import { OverviewTab } from './components/OverviewTab';
import { FailureCasesTab } from './components/FailureCasesTab';
import { TimelineTab } from './components/TimelineTab';
import { ReportTab } from './components/ReportTab';
import { Button } from './components/ui';
import JSZip from 'jszip';

type UploadedImage = {
  file: File | Blob;
  normalizedName: string;
  objectUrl: string;
  originalName: string;
  relativePath?: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'failures' | 'logs' | 'report'>('overview');
  const [rawData, setRawData] = useState<MetricData[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Image handling
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map());
  const [duplicateFiles, setDuplicateFiles] = useState<string[]>([]);

  // Cleanup object URLs on unmount
  const prevImages = useRef<UploadedImage[]>([]);
  useEffect(() => {
    prevImages.current = uploadedImages;
  }, [uploadedImages]);

  useEffect(() => {
    return () => {
      prevImages.current.forEach(image => {
        URL.revokeObjectURL(image.objectUrl);
      });
    };
  }, []);

  const getBaseName = (path: string): string => {
    return String(path ?? "").replace(/\\/g, "/").split("/").pop()?.trim() ?? "";
  };

  const normalizeFileName = (path: string): string => {
    return getBaseName(path).toLowerCase();
  };

  // 15. Recompute matched failure cases whenever either changes
  const { data, stats, uploadSummary } = useMemo(() => {
    const missingFilesMap = new Map<string, any>();
    let imagesMatched = 0;

    const finalData = rawData.map(row => {
      const caseItem = { ...row };
      if (caseItem.image_file) {
        const expectedName = normalizeFileName(caseItem.image_file);
        const imageUrl = imageMap.get(expectedName);
        
        caseItem.imageUrl = imageUrl;
        caseItem.imageMatched = Boolean(imageUrl);
        caseItem.expectedImageName = getBaseName(caseItem.image_file);
        
        if (imageUrl) {
          imagesMatched++;
        } else {
          if (!missingFilesMap.has(expectedName)) {
            missingFilesMap.set(expectedName, {
              case_id: caseItem.case_id,
              test_id: caseItem.test_id,
              image_file: caseItem.image_file,
              expectedName: caseItem.expectedImageName
            });
          }
        }
      }
      return caseItem;
    });

    const calculatedStats = finalData.length > 0 ? calculateSummary(finalData, Object.keys(finalData[0])) : null;
    
    let summary: UploadSummary | null = null;
    if (finalData.length > 0 || uploadedImages.length > 0 || duplicateFiles.length > 0) {
      summary = {
        csvCases: finalData.length,
        imagesUploaded: uploadedImages.length,
        imagesMatched,
        imagesMissing: missingFilesMap.size,
        duplicates: duplicateFiles.length,
        missingFiles: Array.from(missingFilesMap.values()),
        duplicateFiles
      };
    }

    return { data: finalData, stats: calculatedStats, uploadSummary: summary };
  }, [rawData, imageMap, uploadedImages, duplicateFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await processFiles(Array.from(files));
  };

  const generateImageUrl = async (file: File | Blob): Promise<string> => {
    try {
      return URL.createObjectURL(file);
    } catch (err) {
      console.warn("Failed to create object URL, trying fallback", err);
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  };

  const processFiles = async (files: File[]) => {
    let newRawData = [...rawData];
    let newLogs = [...logs];
    const newUploadedImages: UploadedImage[] = [];
    const newImageMap = new Map<string, string>(imageMap);
    const newDuplicateFiles = new Set<string>(duplicateFiles);

    for (const file of files) {
      try {
        if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
          const { data: parsedData } = await parseDataFile(file);
          newRawData = [...newRawData, ...parsedData];
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.log')) {
          const parsedLogs = await parseLogFile(file);
          newLogs = [...newLogs, ...parsedLogs];
        } else if (file.name.match(/\.(png|jpe?g)$/i)) {
          const normalized = normalizeFileName(file.name);
          if (newImageMap.has(normalized)) {
            newDuplicateFiles.add(getBaseName(file.name));
          } else {
            const objectUrl = await generateImageUrl(file);
            newImageMap.set(normalized, objectUrl);
            newUploadedImages.push({
              file,
              normalizedName: normalized,
              objectUrl,
              originalName: file.name,
              relativePath: file.webkitRelativePath
            });
          }
        } else if (file.name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir && relativePath.match(/\.(png|jpe?g)$/i)) {
              const normalized = normalizeFileName(relativePath);
              if (newImageMap.has(normalized)) {
                newDuplicateFiles.add(getBaseName(relativePath));
              } else {
                const blob = await zipEntry.async("blob");
                const objectUrl = await generateImageUrl(blob);
                newImageMap.set(normalized, objectUrl);
                newUploadedImages.push({
                  file: blob,
                  normalizedName: normalized,
                  objectUrl,
                  originalName: relativePath
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Error processing file:", file.name, err);
        alert(`Error parsing ${file.name}`);
      }
    }
    
    // Developer diagnostics
    if (newUploadedImages.length > 0) {
      console.table(
        newUploadedImages.map((img) => ({
          name: img.originalName,
          relativePath: img.relativePath,
          normalized: img.normalizedName,
          type: img.file.type,
          size: img.file.size
        }))
      );
    }
    
    // Check first 10 rows for matches (as requested)
    if (newRawData.length > 0) {
      console.table(
        newRawData.slice(0, 10).map((item) => {
          const expectedName = item.image_file ? normalizeFileName(item.image_file) : "";
          return {
            caseId: item.case_id,
            csvPath: item.image_file,
            expectedName,
            matchedUrl: newImageMap.get(expectedName),
            matched: newImageMap.has(expectedName)
          };
        })
      );
    }

    setRawData(newRawData);
    setUploadedImages(prev => [...prev, ...newUploadedImages]);
    setImageMap(newImageMap);
    setDuplicateFiles(Array.from(newDuplicateFiles));
    
    if (newLogs.length > 0) {
      setLogs(newLogs);
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
            <p className="text-slate-400 mt-2 text-sm">Support CSV, Excel, Log, and Image (PNG/JPG/ZIP) files</p>
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
                <input type="file" multiple accept=".csv,.xlsx,.txt,.log,.png,.jpg,.jpeg,.zip" className="hidden" onChange={handleFileUpload} />
                <div className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Data
                </div>
              </label>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            {uploadSummary && (
              <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Upload Summary</h3>
                </div>
                <div className="grid grid-cols-5 gap-4 text-xs">
                  <div><span className="text-slate-400">CSV Cases:</span> <span className="font-mono text-slate-200 ml-1">{uploadSummary.csvCases}</span></div>
                  <div><span className="text-slate-400">Images Uploaded:</span> <span className="font-mono text-slate-200 ml-1">{uploadSummary.imagesUploaded}</span></div>
                  <div><span className="text-slate-400">Images Matched:</span> <span className="font-mono text-emerald-400 ml-1">{uploadSummary.imagesMatched}</span></div>
                  <div><span className="text-slate-400">Images Missing:</span> <span className={`font-mono ml-1 ${uploadSummary.imagesMissing > 0 ? 'text-rose-400' : 'text-slate-200'}`}>{uploadSummary.imagesMissing}</span></div>
                  <div><span className="text-slate-400">Duplicates:</span> <span className={`font-mono ml-1 ${uploadSummary.duplicates > 0 ? 'text-amber-400' : 'text-slate-200'}`}>{uploadSummary.duplicates}</span></div>
                </div>
                {(uploadSummary.missingFiles.length > 0 || uploadSummary.duplicateFiles.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex gap-6">
                    {uploadSummary.missingFiles.length > 0 && (
                      <div className="flex-1 max-w-[60%]">
                        <div className="flex items-center gap-1 mb-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          <h4 className="text-[11px] font-semibold text-rose-400 uppercase tracking-widest">Validation Warnings: Missing Images</h4>
                        </div>
                        <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-950 text-slate-500 sticky top-0 shadow">
                              <tr>
                                <th className="px-2 py-1 font-semibold border-b border-slate-800 uppercase tracking-widest text-[10px]">Case ID</th>
                                <th className="px-2 py-1 font-semibold border-b border-slate-800 uppercase tracking-widest text-[10px]">Test ID</th>
                                <th className="px-2 py-1 font-semibold border-b border-slate-800 uppercase tracking-widest text-[10px]">CSV Path</th>
                                <th className="px-2 py-1 font-semibold border-b border-slate-800 uppercase tracking-widest text-[10px]">Expected</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                              {uploadSummary.missingFiles.map((file, i) => (
                                <tr key={i} className="hover:bg-slate-800/30">
                                  <td className="px-2 py-1 font-mono text-slate-300">{file.case_id || '-'}</td>
                                  <td className="px-2 py-1 font-mono text-slate-300">{file.test_id || '-'}</td>
                                  <td className="px-2 py-1 font-mono text-slate-500 max-w-[120px] truncate" title={file.image_file}>{file.image_file || '-'}</td>
                                  <td className="px-2 py-1 font-mono text-rose-400 max-w-[120px] truncate" title={file.expectedName}>{file.expectedName}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {uploadSummary.duplicateFiles.length > 0 && (
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <h4 className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">Validation Warnings: Duplicate Images</h4>
                        </div>
                        <div className="max-h-24 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                          {uploadSummary.duplicateFiles.map((file, i) => (
                            <div key={i} className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">{file}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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

