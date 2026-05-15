import { useState, FormEvent } from 'react';
import { X, Save, Bug as BugIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type { Bug, Priority, Severity, BugStatus, User, TestCase, RegressionCycle } from '../types';

interface BugModalProps {
  onClose: () => void;
  onSave: (bug: any, method: 'POST' | 'PUT') => void;
  users: User[];
  testCases: TestCase[];
  cycles: RegressionCycle[];
  currentUser: User | null;
  selectedCycleId?: string;
  initialData?: Bug | null;
}

export default function BugModal({ onClose, onSave, users, testCases, cycles, currentUser, selectedCycleId, initialData }: BugModalProps) {
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'Todo' as BugStatus,
    priority: initialData?.priority || 'Medium' as Priority,
    severity: initialData?.severity || 'Major' as Severity,
    environment: initialData?.environment || 'Staging',
    testCaseId: initialData?.testCaseId || '',
    cycleId: initialData?.cycleId || selectedCycleId || '',
    assigneeId: initialData?.assigneeId || '',
    qaId: initialData?.qaId || currentUser?.id || '',
    reopenCount: initialData?.reopenCount ?? 0,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.id) {
      alert('Bug ID cannot be empty.');
      return;
    }
    onSave(formData, initialData ? 'PUT' : 'POST');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <BugIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">Report New Defect</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Incident Tracking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bug ID</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. BUG-001"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none ${
                    initialData 
                      ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed' 
                      : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500'
                  }`}
                  value={formData.id}
                  readOnly={!!initialData}
                  onChange={e => !initialData && setFormData({ ...formData, id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bug Title</label>
                <input 
                  required 
                  type="text" 
                  placeholder="What is the issue?"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as BugStatus })}
                >
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Ready for Build">Ready for Build</option>
                  <option value="Reopen">Reopen</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Environment</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
                  value={formData.environment}
                  onChange={e => setFormData({ ...formData, environment: e.target.value })}
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="UAT">UAT</option>
                  <option value="Dev">Dev</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Related Cycle</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
                  value={formData.cycleId}
                  onChange={e => setFormData({ ...formData, cycleId: e.target.value })}
                >
                  <option value="">None</option>
                  {cycles.map(cycle => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.id}: {cycle.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Priority</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Severity</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
                  value={formData.severity}
                  onChange={e => setFormData({ ...formData, severity: e.target.value as Severity })}
                >
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                  <option value="Trivial">Trivial</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Reopen Count</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                  value={formData.reopenCount}
                  onChange={e => setFormData({ ...formData, reopenCount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assignee</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
                  value={formData.assigneeId}
                  onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Related Test Case</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
                  value={formData.testCaseId}
                  onChange={e => setFormData({ ...formData, testCaseId: e.target.value })}
                >
                  <option value="">None</option>
                  {testCases.map(tc => (
                    <option key={tc.id} value={tc.id}>{tc.id}: {tc.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bug Description & Steps to Reproduce</label>
             <textarea 
               required rows={4}
               placeholder="1. Go to...&#10;2. Expected: ...&#10;3. Actual: ..."
               className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
               value={formData.description} 
               onChange={e => setFormData({ ...formData, description: e.target.value })}
             />
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20"
          >
            <Save className="w-4 h-4" /> Save Bug
          </button>
        </div>
      </motion.div>
    </div>
  );
}
