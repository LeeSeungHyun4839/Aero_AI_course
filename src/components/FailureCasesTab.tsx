import React, { useState } from 'react';
import { MetricData } from '../types';
import { Card, CardContent } from './ui';
import { AlertCircle, Eye, EyeOff, Search } from 'lucide-react';

export function FailureCasesTab({ data }: { data: MetricData[] }) {
  const [filter, setFilter] = useState<'ALL' | 'FP' | 'FN'>('ALL');
  const [search, setSearch] = useState('');

  const failures = data.filter(d => d.status === 'FP' || d.status === 'FN' || (d.fp && d.fp > 0) || (d.fn && d.fn > 0));
  
  const filtered = failures.filter(f => {
    if (filter === 'FP' && f.status !== 'FP' && !(f.fp && f.fp > 0)) return false;
    if (filter === 'FN' && f.status !== 'FN' && !(f.fn && f.fn > 0)) return false;
    
    if (search) {
      const searchStr = search.toLowerCase();
      const matchLabel = f.label?.toLowerCase().includes(searchStr);
      const matchPred = f.prediction?.toLowerCase().includes(searchStr);
      const matchId = f.id?.toLowerCase().includes(searchStr);
      if (!matchLabel && !matchPred && !matchId) return false;
    }
    return true;
  });

  if (failures.length === 0) {
    return <div className="p-8 text-center text-slate-500">No failure cases found or no data loaded.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          <FilterButton active={filter === 'ALL'} onClick={() => setFilter('ALL')}>All Failures</FilterButton>
          <FilterButton active={filter === 'FP'} onClick={() => setFilter('FP')} className="text-rose-400">False Positives</FilterButton>
          <FilterButton active={filter === 'FN'} onClick={() => setFilter('FN')} className="text-amber-400">False Negatives</FilterButton>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search ID..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-700 bg-slate-900 rounded-lg text-sm focus:outline-none focus:border-cyan-500 text-slate-200 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.slice(0, 50).map((item, idx) => (
          <FailureCard key={item.id || idx} item={item} />
        ))}
      </div>
      {filtered.length > 50 && (
        <div className="text-center text-sm text-slate-500 pt-4">Showing first 50 results of {filtered.length}</div>
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

function FailureCard({ item }: { item: MetricData }) {
  const isFP = item.status === 'FP' || (item.fp && item.fp > 0);
  const isFN = item.status === 'FN' || (item.fn && item.fn > 0);
  const statusLabel = isFP && isFN ? 'FP & FN' : (isFP ? 'FP' : (isFN ? 'FN' : 'FAIL'));

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="h-40 bg-slate-950 relative flex items-center justify-center border-b border-slate-800">
        <AlertCircle className="w-8 h-8 text-slate-800" />
        <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${isFP ? 'bg-rose-500 text-rose-950' : 'bg-amber-500 text-amber-950'}`}>
          {statusLabel}
        </div>
        {(item.fp !== undefined || item.fn !== undefined) && (
          <div className="absolute bottom-2 right-2 flex gap-2">
             {item.fp !== undefined && <span className="text-[10px] text-rose-400 font-mono">FP: {item.fp}</span>}
             {item.fn !== undefined && <span className="text-[10px] text-amber-400 font-mono">FN: {item.fn}</span>}
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Condition</div>
            <div className="font-medium text-slate-300 text-sm">{item.condition || 'Unknown'}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Distance</div>
            <div className="font-medium text-slate-300 text-sm">{item.distance || 'Unknown'}</div>
          </div>
        </div>
        <div className="text-xs text-slate-500 pt-3 border-t border-slate-800 truncate">
          ID: {item.id}
        </div>
      </CardContent>
    </Card>
  );
}
