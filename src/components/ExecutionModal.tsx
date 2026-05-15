import { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, RefreshCcw, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { TestCase, ExecutionResult, ExecutionStatus, User } from '../types';

interface Props {
  testCase: TestCase;
  initialResult: ExecutionResult | null;
  users: User[];
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function ExecutionModal({ testCase, initialResult, users, onClose, onSave }: Props) {
  const [status, setStatus] = useState<ExecutionStatus>(initialResult?.status || 'Not Run');
  const [testerId, setTesterId] = useState(initialResult?.testerId || 'U001');
  const [remarks, setRemarks] = useState(initialResult?.remarks || '');
  const [environment, setEnvironment] = useState(initialResult?.environment || 'Staging');
  const [buildVersion, setBuildVersion] = useState(initialResult?.buildVersion || 'v1.0.0');

  const statuses: { value: ExecutionStatus, label: string, color: string, icon: any }[] = [
    { value: 'Pass', label: 'Pass', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
    { value: 'Fail', label: 'Fail', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle },
    { value: 'Blocked', label: 'Blocked', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: AlertCircle },
    { value: 'Retest', label: 'Retest', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: RefreshCcw },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 underline underline-offset-4 decoration-indigo-500">Manual Execution</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{testCase.id}: {testCase.module}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="text-[14px] font-black text-slate-800 mb-2 leading-tight">{testCase.title}</h3>
            <div className="text-[11px] text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">{testCase.steps}</div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Outcome</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statuses.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-[11px] font-black transition-all",
                    status === s.value ? s.color + " ring-4 ring-offset-0 border-transparent shadow-lg" : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                  )}
                >
                  <s.icon className={cn("w-5 h-5", status === s.value ? "" : "text-slate-300")} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Tester</label>
              <select 
                value={testerId}
                onChange={e => setTesterId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Environment</label>
              <select 
                value={environment}
                onChange={e => setEnvironment(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="UAT">UAT</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Build / Version</label>
            <input 
              value={buildVersion}
              onChange={e => setBuildVersion(e.target.value)}
              placeholder="e.g. v2.5.0-rc1"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Evidence / Remarks</label>
            <textarea 
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={3}
              placeholder="Observation, logs, link to evidence..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave({ testCaseId: testCase.id, status, testerId, remarks, environment, buildVersion })}
            className="px-10 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Result
          </button>
        </div>
      </motion.div>
    </div>
  );
}
