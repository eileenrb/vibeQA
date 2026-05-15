import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { X, UserPlus, Shield } from 'lucide-react';
import type { User } from '../types';

interface UserModalProps {
  onClose: () => void;
  onSave: (user: Partial<User>) => Promise<void>;
  initialData?: User | null;
}

export default function UserModal({ onClose, onSave, initialData }: UserModalProps) {
  const [formData, setFormData] = useState({
    id: initialData?.id || `U${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: initialData?.password || '123456',
    role: initialData?.role || 'Tester'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {initialData ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configure access and roles</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Member ID</label>
              <input 
                required
                disabled={!!initialData}
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all disabled:opacity-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Role</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_20_20%22%3E%3Cpath_stroke=%22%236b7280%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%221.5%22_d=%22m6_8_4_4_4-4%22/%3E%3C/svg%3E')] bg-[position:right_16px_center] bg-no-repeat pr-10"
              >
                <option value="Admin">Admin</option>
                <option value="Tester">Tester</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label>
            <input 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Email Address</label>
            <input 
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            />
          </div>

          {!initialData && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Initial Password</label>
              <input 
                required
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
              />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              disabled={loading}
              type="submit"
              className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {loading ? 'Processing...' : (initialData ? 'Update Profile' : 'Grant Access')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
