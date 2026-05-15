import { useState, FormEvent } from 'react';
import { X, Save, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import type { RegressionCycle, CycleStatus, User } from '../types';

interface CycleModalProps {
  onClose: () => void;
  onSave: (cycle: any, method: 'POST' | 'PUT') => void;
  users: User[];
  initialData?: RegressionCycle | null;
  currentUser: User | null;
}

export default function CycleModal({ onClose, onSave, users, initialData, currentUser }: CycleModalProps) {
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    version: initialData?.version || '',
    status: initialData?.status || 'Planned' as CycleStatus,
    ownerId: initialData?.ownerId || currentUser?.id || '',
    startDate: initialData?.startDate ? format(new Date(initialData.startDate), 'yyyy-MM-dd') : '',
    endDate: initialData?.endDate ? format(new Date(initialData.endDate), 'yyyy-MM-dd') : '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.id) {
      alert('Cycle ID cannot be empty.');
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
      >
        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">{initialData ? 'Edit Cycle' : 'Plan New Cycle'}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Release Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cycle ID</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. REG-001"
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none ${
                  initialData 
                    ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500'
                }`}
                value={formData.id}
                readOnly={!!initialData}
                onChange={e => !initialData && setFormData({ ...formData, id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Release Version</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. v1.0.0"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.version} 
                onChange={e => setFormData({ ...formData, version: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cycle Name</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. Q4 Master Regression"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Owner</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
                value={formData.ownerId}
                onChange={e => setFormData({ ...formData, ownerId: e.target.value })}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as CycleStatus })}
              >
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.startDate} 
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.endDate} 
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/20"
          >
            <Save className="w-4 h-4" /> Save Cycle
          </button>
        </div>
      </motion.div>
    </div>
  );
}
