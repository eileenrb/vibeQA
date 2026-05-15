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
  const [loading, setLoading] = useState(false);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  React.useEffect(() => {
    if (cycles.length > 0 && !hasInitializedSelection) {
      setSelectedCycleIds(cycles.map(cycle => cycle.id));
      setHasInitializedSelection(true);
    }
  }, [cycles, hasInitializedSelection]);

  const selectedCycles = selectedCycleIds.length > 0
    ? cycles.filter(cycle => selectedCycleIds.includes(cycle.id))
    : [];

  const selectedCount = selectedCycleIds.length;
  const allSelected = selectedCount === cycles.length && cycles.length > 0;

  const handleExport = async () => {
    if (selectedCount === 0) return;

    setLoading(true);
    try {
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

  const toggleAll = () => {
    setSelectedCycleIds(allSelected ? [] : cycles.map(cycle => cycle.id));
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Select cycles to export</div>
              <div className="text-sm font-black text-slate-900 mt-1">{selectedCount} of {cycles.length} selected</div>
            </div>
            <button
              onClick={toggleAll}
              className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition"
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              {cycles.map(cycle => (
                <button
                  key={cycle.id}
                  onClick={() => toggleCycle(cycle.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-colors text-left min-h-[80px] break-words",
                    selectedCycleIds.includes(cycle.id)
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-widest truncate">{cycle.id}</div>
                    <div className="text-[10px] font-bold text-slate-500 truncate">{cycle.version}</div>
                  </div>
                  {selectedCycleIds.includes(cycle.id) && <CheckCircle2 className="w-5 h-5 text-rose-600" />}
                </button>
              ))}
            </div>
            {selectedCycleIds.length === 0 && (
              <p className="text-xs font-black uppercase tracking-widest text-rose-600">Select at least one cycle to export</p>
            )}
          </div>

          <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
            <p className="text-sm font-black text-slate-900">Export report</p>
            <p className="text-xs text-slate-500 mt-2">Generate a concise PDF for the selected cycles.</p>
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
            disabled={loading || selectedCycles.length === 0}
            className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'Generating PDF...' : 'Generate Report'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
