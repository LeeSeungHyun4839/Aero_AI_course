import React, { useState } from 'react';
import { MetricData } from '../types';
import { Card, CardContent } from './ui';
import { AlertCircle, Search, X, Image as ImageIcon, Download, Maximize2, FileWarning } from 'lucide-react';

const ERROR_TYPE_MAPPING: Record<string, string> = {
  'FP': 'False Positive',
  'False Positive': 'False Positive',
  'FN': 'False Negative',
  'False Negative': 'False Negative',
  'Misclassification': 'Misclassification',
  'LocalizationError': 'Localization Error',
  'Localization Error': 'Localization Error'
};

export function FailureCasesTab({ data }: { data: MetricData[] }) {
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState<MetricData | null>(null);

  // Consider it a failure case if error_type is present, or if legacy status/fp/fn implies it
  const failures = data.filter(d => 
    d.error_type || 
    d.status === 'FP' || 
    d.status === 'FN' || 
    (d.fp && d.fp > 0) || 
    (d.fn && d.fn > 0)
  );
  
  const filtered = failures.filter(f => {
    const normErrorType = f.error_type ? ERROR_TYPE_MAPPING[f.error_type] || f.error_type : 
                          (f.status === 'FP' ? 'False Positive' : (f.status === 'FN' ? 'False Negative' : ''));
                          
    if (filter !== 'ALL' && normErrorType !== filter) return false;
    
    if (search) {
      const searchStr = search.toLowerCase();
      const matchId = f.case_id?.toLowerCase().includes(searchStr) || f.test_id?.toLowerCase().includes(searchStr) || f.id?.toLowerCase().includes(searchStr);
      if (!matchId) return false;
    }
    return true;
  });

  if (failures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 border border-slate-800 rounded-xl bg-slate-900/50">
        <FileWarning className="w-12 h-12 mb-4 text-slate-700" />
        <h3 className="text-lg font-medium text-slate-300">No Failure Cases Found</h3>
        <p className="text-sm mt-1">Upload a Failure_Cases.csv file to view analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === 'ALL'} onClick={() => setFilter('ALL')}>All Failures</FilterButton>
          <FilterButton active={filter === 'False Positive'} onClick={() => setFilter('False Positive')} className="text-rose-400">False Positive</FilterButton>
          <FilterButton active={filter === 'False Negative'} onClick={() => setFilter('False Negative')} className="text-amber-400">False Negative</FilterButton>
          <FilterButton active={filter === 'Misclassification'} onClick={() => setFilter('Misclassification')} className="text-purple-400">Misclassification</FilterButton>
          <FilterButton active={filter === 'Localization Error'} onClick={() => setFilter('Localization Error')} className="text-blue-400">Localization Error</FilterButton>
        </div>
        <div className="relative w-full xl:w-auto shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search Case ID or Test ID..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-700 bg-slate-900 rounded-lg text-sm focus:outline-none focus:border-cyan-500 text-slate-200 w-full xl:w-72"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {filtered.slice(0, 50).map((item, idx) => (
          <FailureCard key={item.case_id || item.id || idx} item={item} onClick={() => setSelectedCase(item)} />
        ))}
      </div>
      {filtered.length > 50 && (
        <div className="text-center text-sm text-slate-500 pt-4">Showing first 50 results of {filtered.length}</div>
      )}

      {selectedCase && (
        <FailureModal 
          item={selectedCase} 
          onClose={() => setSelectedCase(null)} 
          onUpdate={(updatedItem) => {
            // Update logic goes here if state is lifted, but for now we'll just handle it internally in modal or skip actual persist
          }}
        />
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children, className = '' }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors uppercase tracking-wider ${
        active ? 'bg-cyan-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
      } ${active ? '' : className}`}
    >
      {children}
    </button>
  );
}

function FailureCard({ item, onClick }: { item: MetricData, onClick: () => void }) {
  const normErrorType = item.error_type ? (ERROR_TYPE_MAPPING[item.error_type] || item.error_type) : 
                       (item.status === 'FP' ? 'False Positive' : (item.status === 'FN' ? 'False Negative' : 'FAIL'));

  let typeColor = 'bg-slate-700 text-slate-200';
  if (normErrorType === 'False Positive') typeColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
  if (normErrorType === 'False Negative') typeColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  if (normErrorType === 'Misclassification') typeColor = 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
  if (normErrorType === 'Localization Error') typeColor = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';

  return (
    <div onClick={onClick} className="cursor-pointer group">
      <Card className="overflow-hidden flex flex-col h-full hover:border-cyan-500/50 transition-colors">
        <div className="w-full h-[220px] bg-black relative flex items-center justify-center border-b border-slate-800 overflow-hidden">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.expectedImageName || item.case_id || 'Failure case'} 
              className="w-full h-full object-contain aspect-video group-hover:scale-105 transition-transform duration-500"
              onLoad={() => console.log("Image loaded", item.expectedImageName)}
              onError={(e) => {
                console.error("Image load failed", item.expectedImageName, item.imageUrl);
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-600 space-y-2 p-4 text-center">
              <ImageIcon className="w-10 h-10 opacity-50" />
              <div className="text-sm font-medium">Image not matched</div>
              {item.expectedImageName && (
                <div className="text-[10px] font-mono opacity-70 break-all">{item.expectedImageName}</div>
              )}
            </div>
          )}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide backdrop-blur-md ${typeColor}`}>
            {normErrorType}
          </div>
        </div>
        
        <CardContent className="p-5 flex-1 bg-slate-900">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
            <MetaField label="Case ID" value={item.case_id || item.id} />
            <MetaField label="Test ID" value={item.test_id || '-'} />
            <MetaField label="Ground Truth" value={item.gt_class || item.label || '-'} className="text-emerald-400" />
            <MetaField label="Prediction" value={item.pred_class || item.prediction || '-'} className={item.gt_class !== item.pred_class ? "text-rose-400" : "text-emerald-400"} />
            <MetaField label="Confidence" value={item.confidence !== undefined ? item.confidence.toFixed(3) : '-'} />
            <MetaField label="IoU" value={item.iou !== undefined ? item.iou.toFixed(3) : '-'} />
            <MetaField label="Condition" value={item.condition_summary || item.condition || '-'} />
            <MetaField label="Review Status" value={item.review_status || 'Pending'} />
          </div>

          {item.test_id && item.expectedImageName && !item.expectedImageName.includes(item.test_id) && (
            <div className="mt-2 text-[10px] text-rose-400 font-mono bg-rose-500/10 px-2 py-1 rounded">
              [DATA MISMATCH] test_id does not match image filename
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetaField({ label, value, className = 'text-slate-300' }: { label: string, value: React.ReactNode, className?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</span>
      <span className={`text-sm font-medium truncate ${className}`} title={typeof value === 'string' ? value : undefined}>{value}</span>
    </div>
  );
}

function FailureModal({ item, onClose, onUpdate }: { item: MetricData, onClose: () => void, onUpdate: (item: MetricData) => void }) {
  const [reviewStatus, setReviewStatus] = useState(item.review_status || 'Pending');
  const [userMemo, setUserMemo] = useState(item.user_memo || '');

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.imageUrl) {
      const a = document.createElement('a');
      a.href = item.imageUrl;
      a.download = item.expectedImageName || item.image_file || 'failure_case.png';
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-100">Failure Case Details</h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">{item.case_id || item.id}</span>
          </div>
          <div className="flex items-center gap-2">
            {item.imageUrl && (
              <button onClick={handleDownload} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Download Image">
                <Download className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className="lg:w-2/3 bg-black flex items-center justify-center p-4 min-h-[400px] relative group">
            {item.imageUrl ? (
              <>
                <img 
                  src={item.imageUrl} 
                  alt={item.expectedImageName || "Full size"} 
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => console.log("Modal image loaded", item.expectedImageName)}
                  onError={(e) => {
                    console.error("Modal image load failed", item.expectedImageName, item.imageUrl);
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 pointer-events-none border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Image not matched</p>
                <p className="text-sm font-mono mt-2 break-all">{item.expectedImageName}</p>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="lg:w-1/3 flex flex-col bg-slate-900 border-l border-slate-800">
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              
              {/* Classification Info */}
              <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Ground Truth</span>
                  <span className="font-medium text-emerald-400">{item.gt_class || item.label || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Prediction</span>
                  <span className="font-medium text-rose-400">{item.pred_class || item.prediction || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Error Type</span>
                  <span className="font-medium text-slate-200">{item.error_type || '-'}</span>
                </div>
              </div>

              {/* Analysis */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-cyan-500" />
                    Observation
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    {item.observation || 'No observation provided.'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xs text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-rose-500" />
                    [추정 원인]
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    {item.suspected_cause || 'No suspected cause provided.'}
                  </p>
                </div>
              </div>

              {/* Interactive Section */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Review Status</label>
                  <select 
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Ignored">Ignored</option>
                    <option value="Fixed">Fixed</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">User Memo</label>
                  <textarea 
                    value={userMemo}
                    onChange={(e) => setUserMemo(e.target.value)}
                    placeholder="Add your notes here..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[100px] resize-none"
                  />
                </div>
              </div>

            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button 
                onClick={() => {
                  onUpdate({ ...item, review_status: reviewStatus, user_memo: userMemo });
                  onClose();
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
