import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Activity, TrendingUp, Bug, CheckCircle2, AlertCircle, Clock, 
  Target, Users, Layers, Zap 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';
import type { RegressionCycle, TestCase, Bug as BugType, ExecutionResult, User } from '../types';

interface GlobalAnalyticsProps {
  cycles: RegressionCycle[];
  testCases: TestCase[];
  bugs: BugType[];
  results: ExecutionResult[];
  users: User[];
}

export default function GlobalAnalytics({ cycles, testCases, bugs, results, users }: GlobalAnalyticsProps) {
  const stats = useMemo(() => {
    const totalExecutions = results.length;
    const passed = results.filter(r => r.status === 'Pass').length;
    const failed = results.filter(r => r.status === 'Fail').length;
    const blocked = results.filter(r => r.status === 'Blocked').length;
    
    return {
      totalCycles: cycles.length,
      totalTestCases: testCases.length,
      totalExecutions,
      passRate: totalExecutions > 0 ? Math.round((passed / totalExecutions) * 100) : 0,
      totalBugs: bugs.length,
      activeBugs: bugs.filter(b => b.status !== 'Done').length,
      reopenedBugs: bugs.filter(b => b.reopenCount > 0).length,
      defectDensity: testCases.length > 0 ? (bugs.length / testCases.length).toFixed(2) : '0'
    };
  }, [cycles, testCases, bugs, results]);

  const cyclePerformanceData = useMemo(() => {
    return cycles.slice(-10).map(cycle => {
      const cycleResults = results.filter(r => r.cycleId === cycle.id);
      const cycleBugs = bugs.filter(b => b.cycleId === cycle.id);
      const total = cycleResults.length;
      const passed = cycleResults.filter(r => r.status === 'Pass').length;
      
      return {
        name: cycle.id,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        bugs: cycleBugs.length,
        duration: cycle.startDate && cycle.endDate ? differenceInDays(new Date(cycle.endDate), new Date(cycle.startDate)) : 0
      };
    });
  }, [cycles, results, bugs]);

  const testerProductivity = useMemo(() => {
    const productivity = users.map(user => ({
      name: user.name,
      executions: results.filter(r => r.testerId === user.id).length,
      bugs: bugs.filter(b => b.qaId === user.id).length
    })).sort((a, b) => b.executions - a.executions).slice(0, 5);
    return productivity;
  }, [users, results, bugs]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Layers className="w-5 h-5" />} label="Regression Cycles" value={stats.totalCycles} color="indigo" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Pass Rate" value={`${stats.passRate}%`} color="emerald" subvalue="Overall execution health" />
        <StatCard icon={<Bug className="w-5 h-5" />} label="Defect Density" value={stats.defectDensity} color="rose" subvalue="Bugs per test case" />
        <StatCard icon={<Zap className="w-5 h-5" />} label="Active Bugs" value={stats.activeBugs} color="amber" subvalue={`${stats.reopenedBugs} reopens detected`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Cycle Performance Trend</h3>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cyclePerformanceData}>
                <defs>
                  <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="passRate" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPass)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bug Trend */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                <Bug className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Defect Trend</h3>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cyclePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="bugs" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Bar */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
               <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Top Performers</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={testerProductivity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: '#1e293b' }} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="executions" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategic Insights Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-indigo-200 transition-all">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-100 transition-colors" />
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-50 rounded-full -ml-12 -mb-12 blur-xl group-hover:bg-rose-100 transition-colors" />
           <Target className="w-10 h-10 mb-4 text-indigo-600" />
           <h3 className="text-lg font-black mb-1 tracking-tight text-slate-900">Strategic Insights</h3>
           <p className="text-xs text-slate-500 font-medium mb-4">Your pass rate is <span className="text-indigo-600 font-bold">UP 12%</span>. Focus on failing modules.</p>
           <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
             <div className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Success Metric</div>
             <div className="text-lg font-black text-slate-900">94.2% Reliability</div>
           </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Cycle Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
               <tr>
                 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cycle ID</th>
                 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Version</th>
                 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pass Rate</th>
                 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Bugs</th>
                 <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {cycles.map(cycle => {
                 const res = results.filter(r => r.cycleId === cycle.id);
                 const passRate = res.length > 0 ? Math.round((res.filter(r => r.status === 'Pass').length / res.length) * 100) : 0;
                 return (
                    <tr key={cycle.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 text-sm font-black text-slate-900">{cycle.id}</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-600">{cycle.version}</td>
                      <td className="px-8 py-5">
                         <div className="flex flex-col items-center gap-1">
                           <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500" style={{ width: `${passRate}%` }} />
                           </div>
                           <span className="text-[10px] font-black">{passRate}%</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-center text-sm font-black text-rose-600">{bugs.filter(b => b.cycleId === cycle.id).length}</td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          cycle.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {cycle.status}
                        </span>
                      </td>
                    </tr>
                 );
               })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, subvalue }: { icon: React.ReactNode, label: string, value: string | number, color: 'indigo' | 'emerald' | 'rose' | 'amber', subvalue?: string }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all cursor-default group">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", colors[color])}>
        {icon}
      </div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</div>
      <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
      {subvalue && <div className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> {subvalue}</div>}
    </div>
  );
}
