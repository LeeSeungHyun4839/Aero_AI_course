import React from 'react';
import { LogEvent } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

export function TimelineTab({ logs }: { logs: LogEvent[] }) {
  if (!logs || logs.length === 0) return <div className="p-8 text-center text-slate-500">No logs loaded. Please upload a log file.</div>;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Event Timeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-5 relative">
          {logs.map((log, index) => {
            const isError = log.type === 'error';
            const isWarning = log.type === 'warning';
            const dotColor = isError ? 'bg-rose-500' : (isWarning ? 'bg-amber-400' : 'bg-cyan-400');
            const timeColor = isError ? 'text-rose-400' : (isWarning ? 'text-amber-400' : 'text-slate-300');

            return (
              <div key={index} className="flex gap-4 items-start relative">
                <div className={`w-2 h-2 rounded-full ${dotColor} mt-1 flex-shrink-0 relative`}>
                   {index < logs.length - 1 && (
                     <div className="absolute top-full left-1/2 w-px h-[calc(100%+1.25rem)] bg-slate-800 -translate-x-1/2"></div>
                   )}
                </div>
                <div className="-mt-1">
                  <p className={`text-[11px] font-bold font-mono ${timeColor}`}>{log.timestamp}</p>
                  <p className="text-xs text-slate-400 capitalize">{log.event}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
