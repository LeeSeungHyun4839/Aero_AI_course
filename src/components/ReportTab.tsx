import React, { useState } from 'react';
import { SummaryStats } from '../types';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';
import { Sparkles, FileText, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function ReportTab({ stats }: { stats: SummaryStats | null }) {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generateReport = async () => {
    if (!stats) return;
    setLoading(true);
    setError('');

    const prompt = `
      You are an AI assistant for Computer Vision Research. 
      Generate a professional 1-page test analysis report based on the following metrics:
      
      Total Samples: ${stats.total}
      Precision: ${(stats.precision * 100).toFixed(1)}%
      Recall: ${(stats.recall * 100).toFixed(1)}%
      F1 Score: ${(stats.f1 * 100).toFixed(1)}%
      False Positives: ${stats.fp}
      False Negatives: ${stats.fn}
      True Positives: ${stats.tp}
      
      Include the following sections:
      1. Test Overview
      2. Key Results (interpret the precision/recall numbers)
      3. Failure Analysis (what the high FP or FN means conceptually)
      4. Recommendations for next steps
      
      Keep it highly professional, concise, and structured in Markdown. Do not include boilerplate greetings.
    `;

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!stats) return <div className="p-8 text-center text-slate-500">Please upload metrics to generate a report.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6 flex items-center justify-between bg-cyan-900/20 border-b border-cyan-500/20 text-white rounded-xl">
          <div>
            <h3 className="font-display text-lg font-semibold mb-1 text-cyan-400">AI Report Generator</h3>
            <p className="text-slate-400 text-sm">Generate a comprehensive summary of the current test metrics.</p>
          </div>
          <Button 
            onClick={generateReport} 
            disabled={loading}
            className="bg-cyan-600 text-white hover:bg-cyan-500"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
          {error}
        </div>
      )}

      {report && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-slate-400" />
              Generated Report
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => {
              const blob = new Blob([report], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'CV_Test_Report.md';
              a.click();
            }}>
              Download Markdown
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-slate max-w-none">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
