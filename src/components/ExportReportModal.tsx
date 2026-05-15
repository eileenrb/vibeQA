import React, { useState } from 'react';
import { X, FileDown, CheckCircle2, Layout, Calendar, Layers, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import type { RegressionCycle, User, Bug as BugType, TestCase, ExecutionResult } from '../types';
import { exportOverallSummary } from '../utils/pdfExport';

interface ExportReportModalProps {
  onClose: () => void;
  cycles: RegressionCycle[];
  users: User[];
  bugs: BugType[];
  testCases: TestCase[];
  results: ExecutionResult[];
}

export default function ExportReportModal({ onClose, cycles, users, bugs, testCases, results }: ExportReportModalProps) {
  const [selectedCycleIds, setSelectedCycleIds] = useState<string[]>([]);
  const [reportType, setReportType] = useState<'selected' | 'overall'>('overall');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const selectedCycles = reportType === 'overall' ? cycles : cycles.filter(c => selectedCycleIds.includes(c.id));
      await exportOverallSummary(selectedCycles, users, bugs, testCases, results);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCycle = (id: string) => {
    setSelectedCycleIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-100">
               <FileDown className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Export Analytics</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Professional PDF Reporting</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            <button 
              onClick={() => setReportType('overall')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                reportType === 'overall' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
              )}
            >
              <Activity className="w-4 h-4" /> Overall Summary
            </button>
            <button 
              onClick={() => setReportType('selected')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                reportType === 'selected' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"
              )}
            >
              <Layers className="w-4 h-4" /> Selected Cycles
            </button>
          </div>

          {reportType === 'selected' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Select Cycles to Include</h4>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cycles.map(cycle => (
                  <button
                    key={cycle.id}
                    onClick={() => toggleCycle(cycle.id)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                      selectedCycleIds.includes(cycle.id) 
                        ? "bg-rose-50 border-rose-200 text-rose-900 ring-4 ring-rose-50" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-rose-200"
                    )}
                  >
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest">{cycle.id}</div>
                      <div className="text-[10px] font-bold text-slate-500">{cycle.version}</div>
                    </div>
                    {selectedCycleIds.includes(cycle.id) && <CheckCircle2 className="w-5 h-5 text-rose-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                 <Layout className="w-5 h-5" />
               </div>
               <div>
                  <h5 className="text-sm font-black text-slate-900 mb-1">Report Contents</h5>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    This report includes executive summaries, multi-cycle performance trends, bug density analysis, and tester productivity metrics.
                  </p>
               </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleExport}
            disabled={loading || (reportType === 'selected' && selectedCycleIds.length === 0)}
            className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'Generating PDF...' : `Generate ${reportType === 'overall' ? 'Overall' : 'Selected'} Report`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
