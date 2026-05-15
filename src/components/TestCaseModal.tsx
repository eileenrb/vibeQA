import { useState, useEffect, FormEvent } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { TestCase, Priority, Severity, AutomationStatus } from '../types';

interface TestCaseModalProps {
  initialData: TestCase | null;
  onClose: () => void;
  onSave: (tc: any) => void;
}

export default function TestCaseModal({ initialData, onClose, onSave }: TestCaseModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    module: '',
    feature: '',
    title: '',
    preconditions: '',
    steps: '',
    expectedResult: '',
    priority: 'Medium' as Priority,
    severity: 'Major' as Severity,
    automationStatus: 'Manual' as AutomationStatus,
    tags: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        module: initialData.module,
        feature: initialData.feature || '',
        title: initialData.title,
        preconditions: initialData.preconditions || '',
        steps: initialData.steps,
        expectedResult: initialData.expectedResult,
        priority: initialData.priority,
        severity: initialData.severity,
        automationStatus: initialData.automationStatus,
        tags: initialData.tags || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">{initialData ? 'Edit Test Case' : 'Create New Test Case'}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Repository Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Test Case ID</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. TC-001"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.id} 
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Module Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Authentication"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.module} 
                    onChange={e => setFormData({ ...formData, module: e.target.value })}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Feature Component</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Login Screen"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.feature} 
                    onChange={e => setFormData({ ...formData, feature: e.target.value })}
                  />
               </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Priority</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.severity}
                    onChange={e => setFormData({ ...formData, severity: e.target.value as Severity })}
                  >
                    <option value="Critical">Critical</option>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                    <option value="Trivial">Trivial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Automation Status</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.automationStatus}
                  onChange={e => setFormData({ ...formData, automationStatus: e.target.value as AutomationStatus })}
                >
                  <option value="Automated">Automated</option>
                  <option value="Manual">Manual</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tags (Comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. regression, smoke, v2.5"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.tags} 
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Test Case Summary</label>
              <input 
                required 
                type="text" 
                placeholder="Briefly describe the test objective"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Preconditions</label>
              <textarea 
                rows={2}
                placeholder="What is required before starting this test?"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.preconditions} 
                onChange={e => setFormData({ ...formData, preconditions: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Test Steps</label>
              <textarea 
                required 
                rows={4}
                placeholder="Step 1: ...&#10;Step 2: ..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.steps} 
                onChange={e => setFormData({ ...formData, steps: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Expected Result</label>
              <textarea 
                required 
                rows={2}
                placeholder="What is the successful outcome?"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.expectedResult} 
                onChange={e => setFormData({ ...formData, expectedResult: e.target.value })}
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
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            <Save className="w-4 h-4" /> Save Test Case
          </button>
        </div>
      </motion.div>
    </div>
  );
}
