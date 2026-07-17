import React from 'react';
import { SummaryStats } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertCircle } from 'lucide-react';

export function OverviewTab({ stats }: { stats: SummaryStats | null }) {
  if (!stats) return <div className="p-8 text-center text-slate-500">No data loaded. Please upload metrics first.</div>;

  const chartData = [
    { name: 'Precision', value: Number((stats.precision * 100).toFixed(1)) },
    { name: 'Recall', value: Number((stats.recall * 100).toFixed(1)) },
    { name: 'F1 Score', value: Number((stats.f1 * 100).toFixed(1)) },
  ];

  return (
    <div className="space-y-6">
      {stats.error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{stats.error}</p>
        </div>
      )}

      {stats.columns && stats.columns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recognized Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.columns.map((col, idx) => (
                <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-mono border border-slate-700">
                  {col}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Samples" value={stats.total.toLocaleString()} />
        <StatCard title="Precision" value={`${(stats.precision * 100).toFixed(1)}%`} color="text-cyan-400" />
        <StatCard title="Recall" value={`${(stats.recall * 100).toFixed(1)}%`} color="text-emerald-400" />
        <StatCard title="F1 Score" value={`${(stats.f1 * 100).toFixed(1)}%`} color="text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Core Metrics</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aggregate Confusion Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex flex-col justify-center items-center">
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-2">True Positive</div>
                <div className="text-4xl font-mono font-light text-emerald-300">{stats.tp.toLocaleString()}</div>
              </div>
              <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 flex flex-col justify-center items-center">
                <div className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">False Positive</div>
                <div className="text-4xl font-mono font-light text-rose-300">{stats.fp.toLocaleString()}</div>
              </div>
              <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex flex-col justify-center items-center">
                <div className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-2">False Negative</div>
                <div className="text-4xl font-mono font-light text-amber-300">{stats.fn.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-center items-center">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">True Negative</div>
                <div className="text-4xl font-mono font-light text-slate-300">{stats.tn.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "text-white" }: { title: string, value: string | number, color?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-2">{title}</div>
        <div className={`text-4xl font-light font-mono ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
