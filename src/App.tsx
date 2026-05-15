import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Play, 
  CheckCircle2, 
  XCircle, 
  PauseCircle, 
  AlertCircle,
  RefreshCcw, 
  Circle,
  Filter,
  Download,
  Database,
  BarChart3,
  LayoutDashboard,
  Bug as BugIcon,
  Users as UsersIcon,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  MoreVertical,
  Activity,
  History,
  Kanban,
  Loader2,
  Waves,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { cn } from './lib/utils';
import { 
  exportCycleReport, 
  exportExecutionReport, 
  exportBugReport 
} from './utils/pdfExport';
import type { 
  TestCase, RegressionCycle, ExecutionResult, ExecutionStatus, 
  Bug, User, Statistics, BugStatus, CycleStatus 
} from './types';

// Components
import TestCaseModal from './components/TestCaseModal';
import ExecutionModal from './components/ExecutionModal';
import BugModal from './components/BugModal';
import CycleModal from './components/CycleModal';
import UserModal from './components/UserModal';
import ImportModal from './components/ImportModal';
import GlobalAnalytics from './components/GlobalAnalytics';
import ExportReportModal from './components/ExportReportModal';
import LoginPage from './components/LoginPage';
import { useAuth } from './contexts/AuthContext';

type ActiveView = 'dashboard' | 'repository' | 'regressions' | 'bugs' | 'users';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [cycles, setCycles] = useState<RegressionCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [allResults, setAllResults] = useState<ExecutionResult[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    module: '',
    status: '',
    priority: '',
    severity: ''
  });

  const [modals, setModals] = useState({
    test: false,
    execution: false,
    bug: false,
    cycle: false,
    user: false,
    import: false,
    export: false
  });
  
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [dataLoading, setDataLoading] = useState(false);

  const NoResults = ({ onReset }: { onReset: () => void }) => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
        <Search className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">No matching results</h3>
      <p className="text-sm text-slate-500 font-medium max-w-xs text-center mb-8 leading-relaxed">
        We couldn't find anything matching your current search or filters. Try adjusting your criteria or reset to start over.
      </p>
      <button 
        onClick={onReset}
        className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
      >
        <RefreshCcw className="w-4 h-4" /> Reset All Filters
      </button>
    </div>
  );

  const [editingItem, setEditingItem] = useState<{
    type: 'test' | 'execution' | 'bug' | 'cycle' | 'user',
    data: any
  } | null>(null);

  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(null);

  // Initial Loading
  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async () => {
    setDataLoading(true);
    try {
      const [tcRes, cycleRes, bugRes, userRes] = await Promise.all([
        fetch('/api/test-cases'),
        fetch('/api/cycles'),
        fetch('/api/bugs'),
        fetch('/api/users')
      ]);
      setTestCases(await tcRes.json());
      const cyclesData = await cycleRes.json();
      setCycles(cyclesData);
      setBugs(await bugRes.json());
      setUsers(await userRes.json());
      await fetchAllResults();
      
      if (cyclesData.length > 0 && !selectedCycleId) {
        setSelectedCycleId(cyclesData[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCycleId) fetchResults(selectedCycleId);
  }, [selectedCycleId]);

  const fetchResults = async (id: string) => {
    const res = await fetch(`/api/results/${id}`);
    setResults(await res.json());
  };

  const fetchAllResults = async () => {
    const res = await fetch('/api/results');
    setAllResults(await res.json());
  };

  // Statistics
  const stats: Statistics = useMemo(() => {
    const activeTestCases = testCases.length;
    const cycleResults = results.filter(r => r.cycleId === selectedCycleId);
    
    const passed = cycleResults.filter(r => r.status === 'Pass').length;
    const failed = cycleResults.filter(r => r.status === 'Fail').length;
    const blocked = cycleResults.filter(r => r.status === 'Blocked').length;
    const notRun = activeTestCases - cycleResults.length;
    
    const cycleBugs = bugs.filter(b => b.cycleId === selectedCycleId);
    
    const executed = passed + failed + blocked;
    
    return {
      total: activeTestCases,
      passed,
      failed,
      blocked,
      notRun,
      passRate: executed > 0 ? Math.round((passed / executed) * 100) : 0,
      totalBugs: cycleBugs.length,
      activeBugs: cycleBugs.filter(b => b.status === 'Todo' || b.status === 'In Progress' || b.status === 'Reopen' || b.status === 'Ready for Build').length,
      reopenedBugs: cycleBugs.filter(b => b.reopenCount > 0).length,
      executionCoverage: activeTestCases > 0 ? Math.round((executed / activeTestCases) * 100) : 0
    };
  }, [testCases, results, selectedCycleId, bugs]);

  // View Components
  const DashboardView = () => {
    const [trendDays, setTrendDays] = useState(7);
    const chartData = [
      { name: 'Passed', value: stats.passed, color: '#059669' },
      { name: 'Failed', value: stats.failed, color: '#dc2626' },
      { name: 'Blocked', value: stats.blocked, color: '#d97706' },
      { name: 'Not Run', value: stats.notRun, color: '#94a3b8' },
    ];

    const bugTrend = useMemo(() => {
      const days = Array.from({ length: trendDays }, (_, i) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - (trendDays - 1 - i));
        return d;
      });

      const counts = days.map(dayDate => {
        const count = bugs.filter(b => {
          if (!b.createdAt) return false;
          const bugDate = new Date(b.createdAt);
          return isSameDay(bugDate, dayDate);
        }).length;
        return { date: format(dayDate, 'MMM d'), bugs: count };
      });

      return counts;
    }, [bugs, trendDays]);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Execution Coverage" value={`${stats.executionCoverage}%`} icon={<BarChart3 className="w-5 h-5" />} color="bg-indigo-600" />
          <StatCard label="Defects Found" value={stats.totalBugs} icon={<BugIcon className="w-5 h-5" />} color="bg-rose-600" />
          <StatCard label="Pass Rate (Execution)" value={`${stats.passRate}%`} icon={<CheckCircle2 className="w-5 h-5" />} color="bg-emerald-600" />
          <StatCard label="Total Repository" value={stats.total} icon={<Database className="w-5 h-5" />} color="bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">Test Execution Health</h3>
            <div className="flex-1 flex flex-col justify-center min-h-[300px]">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
                {chartData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
                    <span className="text-xs font-black text-slate-900 ml-1">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Bug Discovery Trend</h3>
              <select 
                value={trendDays}
                onChange={(e) => setTrendDays(parseInt(e.target.value))}
                className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={7}>Last 7 Days</option>
                <option value={14}>Last 14 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
            <div className="flex-1 h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={bugTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#64748b', fontWeight: 'bold' }}
                    dy={10}
                  />
                  <YAxis 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="bugs" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RepositoryView = () => {
    const filtered = useMemo(() => {
      const s = search.toLowerCase();
      return testCases.filter(tc => { // Filter test cases first
        // Find the latest result for this test case within the selected cycle
        // This is crucial if there are duplicate execution results due to missing unique constraint
        const result = results.find(r => r.testCaseId === tc.id);
        const status = result?.status || 'Not Run';
        const tester = users.find(u => u.id === result?.testerId)?.name || '';

        const matchesSearch = (
          tc.id.toLowerCase().includes(s) ||
          tc.module.toLowerCase().includes(s) ||
          tc.title.toLowerCase().includes(s) ||
          (tc.feature || '').toLowerCase().includes(s) ||
          status.toLowerCase().includes(s) ||
          tester.toLowerCase().includes(s)
        );

        const matchesModule = !columnFilters.module || tc.module === columnFilters.module;
        const matchesStatus = !columnFilters.status || status === columnFilters.status;

        return matchesSearch && matchesModule && matchesStatus;
      });
    }, [testCases, results, search, users, columnFilters]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" placeholder="Search Repository..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-64 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
              />
            </div>

            <div className="relative">
              <select 
                value={columnFilters.module || ''}
                onChange={(e) => setColumnFilters({ ...columnFilters, module: e.target.value })}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 appearance-none pr-10 transition-all cursor-pointer"
              >
                <option value="">All Modules</option>
                {Array.from(new Set(testCases.map(tc => tc.module))).filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                value={columnFilters.status || ''}
                onChange={(e) => setColumnFilters({ ...columnFilters, status: e.target.value })}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 appearance-none pr-10 transition-all cursor-pointer"
              >
                <option value="">All Status</option>
                {['Pass', 'Fail', 'Blocked', 'Retest', 'Not Run'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <AnimatePresence>
              {(search || columnFilters.module || columnFilters.status) && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => { setSearch(''); setColumnFilters(prev => ({ ...prev, module: '', status: '' })); }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 flex items-center gap-2"
                >
                  <XCircle className="w-3.5 h-3.5" /> Clear All
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => { setEditingItem(null); setModals(m => ({...m, test: true})); }}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-black transition-all"
          >
            <Plus className="w-4 h-4" /> Create Test Case
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-48">ID</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4 text-left">Title</th>
                <th className="px-6 py-4">Tester</th>
                <th className="px-6 py-4">Execution Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-sm text-slate-500 mt-2">Loading data...</p>
                  </td>
                </tr>
              ) : filtered.length > 0 ? filtered.map(tc => {
                // Ensure we get the latest result if multiple exist for the same TC in the same cycle
                const latestResult = results.filter(r => r.testCaseId === tc.id && r.cycleId === selectedCycleId)
                                            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
                return (
                  <tr key={tc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-indigo-700 font-bold text-xs">{tc.id}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{tc.module}</td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-bold text-slate-900">{tc.title}</div>
                      <div className="text-[10px] text-slate-600 line-clamp-1">{tc.feature || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-500">
                      {latestResult?.testerId ? (users.find(u => u.id === latestResult.testerId)?.name || 'Unknown') : '-'}
                    </td>
                    <td className="px-6 py-4">
                       <button 
                         onClick={() => { setCurrentTestCase(tc); setModals(m => ({ ...m, execution: true })) }}
                         className={cn(
                           "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm",
                           latestResult?.status === 'Pass' ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                           latestResult?.status === 'Fail' ? "bg-rose-50 border-rose-200 text-rose-600 shadow-rose-100" :
                           latestResult?.status === 'Blocked' ? "bg-amber-50 border-amber-200 text-amber-600" :
                           "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300"
                         )}
                       >
                         {latestResult ? latestResult.status : 'Not Run'}
                       </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setEditingItem({ type: 'test', data: tc }); setModals(m => ({...m, test: true})); }}
                          className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {user?.role === 'Admin' && (
                          <button 
                            onClick={() => setConfirmModal({
                              show: true,
                              title: 'Delete Test Case',
                              message: `Are you sure you want to remove ${tc.id}?`,
                              onConfirm: () => handleDeleteTestCase(tc.id)
                            })}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                            title="Delete test case"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6}><NoResults onReset={() => { setSearch(''); setColumnFilters(prev => ({ ...prev, module: '', status: '' })); }} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const BugView = () => {
    const [bugSearch, setBugSearch] = useState('');

    const filteredBugs = useMemo(() => {
      const s = bugSearch.toLowerCase();
      return bugs.filter(b => {
        if (selectedCycleId && b.cycleId !== selectedCycleId) return false;

        const assignee = users.find(u => u.id === b.assigneeId)?.name || 'Unassigned';
        const matchesSearch = (
          b.id.toLowerCase().includes(s) ||
          b.title.toLowerCase().includes(s) ||
          b.status.toLowerCase().includes(s) ||
          b.priority.toLowerCase().includes(s) ||
          (b.testCaseId || '').toLowerCase().includes(s) ||
          assignee.toLowerCase().includes(s)
        );

        const matchesStatus = !columnFilters.bugStatus || b.status === columnFilters.bugStatus;
        const matchesPriority = !columnFilters.bugPriority || b.priority === columnFilters.bugPriority;
        const matchesSeverity = !columnFilters.bugSeverity || b.severity === columnFilters.bugSeverity;

        return matchesSearch && matchesStatus && matchesPriority && matchesSeverity;
      });
    }, [bugs, bugSearch, users, columnFilters, selectedCycleId]);

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Issues..."
                value={bugSearch}
                onChange={(e) => setBugSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-full md:w-64 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
              />
            </div>

            <div className="relative">
              <select 
                value={columnFilters.bugStatus || ''}
                onChange={(e) => setColumnFilters({ ...columnFilters, bugStatus: e.target.value })}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 appearance-none pr-10 transition-all cursor-pointer"
              >
                <option value="">All Status</option>
                {['Todo', 'In Progress', 'Ready for Build', 'Reopen', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                value={columnFilters.bugPriority || ''}
                onChange={(e) => setColumnFilters({ ...columnFilters, bugPriority: e.target.value })}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 appearance-none pr-10 transition-all cursor-pointer"
              >
                <option value="">All Priority</option>
                {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                value={columnFilters.bugSeverity || ''}
                onChange={(e) => setColumnFilters({ ...columnFilters, bugSeverity: e.target.value })}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 appearance-none pr-10 transition-all cursor-pointer"
              >
                <option value="">All Severity</option>
                {['Critical', 'Major', 'Minor', 'Trivial'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <AnimatePresence>
              {(bugSearch || columnFilters.bugStatus || columnFilters.bugPriority || columnFilters.bugSeverity) && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => { setBugSearch(''); setColumnFilters(prev => ({ ...prev, bugStatus: '', bugPriority: '', bugSeverity: '' })); }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 flex items-center gap-2"
                >
                  <XCircle className="w-3.5 h-3.5" /> Clear All
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { setEditingItem(null); setModals(m => ({ ...m, bug: true })); }}
              className="bg-rose-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
            >
              <Plus className="w-4 h-4" /> Report Issue
            </button>
          </div>
        </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4">ID</th>
                   <th className="px-6 py-4">Title</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Priority</th>
                   <th className="px-6 py-4">Related TC</th>
                   <th className="px-6 py-4">Assignee</th>
                   <th className="px-6 py-4"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {dataLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                        <p className="text-sm text-slate-500 mt-2">Loading data...</p>
                      </td>
                    </tr>
                  ) : filteredBugs.length > 0 ? filteredBugs.map(bug => (
                    <tr key={bug.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-rose-600 font-bold text-xs">{bug.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-[13px] font-bold text-slate-900">{bug.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge type="bugStatus" value={bug.status} />
                      </td>
                      <td className="px-6 py-4">
                         <StatusBadge type="priority" value={bug.priority} />
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-xs font-bold text-indigo-600 font-mono">{bug.testCaseId || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-600">
                         {users.find(u => u.id === bug.assigneeId)?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { setEditingItem({ type: 'bug', data: bug }); setModals(m => ({...m, bug: true})); }}
                            className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {user?.role === 'Admin' && (
                            <button 
                              onClick={() => setConfirmModal({
                                show: true,
                                title: 'Delete Bug',
                                message: `Remove ${bug.id}? This action cannot be undone.`,
                                onConfirm: () => handleDeleteBug(bug.id)
                              })}
                              className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                              title="Delete bug"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7}><NoResults onReset={() => { setBugSearch(''); setColumnFilters(prev => ({ ...prev, bugStatus: '', bugPriority: '' })); }} /></td>
                    </tr>
                  )}
               </tbody>
             </table>
          </div>
      </div>
    );
  };

  const RegressionView = () => {
    const [cycleSearch, setCycleSearch] = useState('');

    const filteredCycles = useMemo(() => {
      const s = cycleSearch.toLowerCase();
      return cycles.filter(c => {
        const matchesSearch = (
        c.id.toLowerCase().includes(s) ||
        c.name.toLowerCase().includes(s) ||
        c.version.toLowerCase().includes(s) ||
        c.status.toLowerCase().includes(s) ||
        (users.find(u => u.id === c.ownerId)?.name || '').toLowerCase().includes(s)
        );
        const matchesStatus = !columnFilters.cycleStatus || c.status === columnFilters.cycleStatus;
        return matchesSearch && matchesStatus;
      });
    }, [cycles, cycleSearch, users, columnFilters]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Cycles..."
                value={cycleSearch}
                onChange={(e) => setCycleSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-64 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
              />
            </div>

            <AnimatePresence>
              {(cycleSearch || columnFilters.cycleStatus) && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => { setCycleSearch(''); setColumnFilters(prev => ({ ...prev, cycleStatus: '' })); }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 flex items-center gap-2"
                >
                  <XCircle className="w-3.5 h-3.5" /> Clear All
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setModals(m => ({ ...m, cycle: true }))}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-black transition-all"
          >
            <Plus className="w-4 h-4" /> Create Cycle
          </button>
        </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                <tr>
                   <th className="px-6 py-4">Cycle ID</th>
                   <th className="px-6 py-4">Name</th>
                   <th className="px-6 py-4">Version</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Owner</th>
                   <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                      <p className="text-sm text-slate-500 mt-2">Loading data...</p>
                    </td>
                  </tr>
                ) : filteredCycles.length > 0 ? filteredCycles.map(cycle => (
                  <tr key={cycle.id} className="hover:bg-slate-50 transition-colors group text-sm font-bold">
                    <td className="px-6 py-4 text-xs font-mono text-indigo-600">{cycle.id}</td>
                    <td className="px-6 py-4 text-slate-900">{cycle.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{cycle.version}</td>
                    <td className="px-6 py-4"><StatusBadge type="execStatus" value={cycle.status} /></td>
                    <td className="px-6 py-4 text-xs">{users.find(u => u.id === cycle.ownerId)?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={() => { setEditingItem({ type: 'cycle', data: cycle }); setModals(m => ({...m, cycle: true})); }}
                           className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
                         >
                           <MoreVertical className="w-4 h-4" />
                         </button>
                         {user?.role === 'Admin' && (
                           <button 
                             onClick={() => setConfirmModal({
                               show: true,
                               title: 'Delete Cycle',
                               message: `Delete ${cycle.id}? All linked bugs and results will be removed.`,
                               onConfirm: () => handleDeleteCycle(cycle.id)
                             })}
                             className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                             title="Delete cycle"
                           >
                             <XCircle className="w-4 h-4" />
                           </button>
                         )}
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6}><NoResults onReset={() => { setCycleSearch(''); setColumnFilters(prev => ({ ...prev, cycleStatus: '' })); }} /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    );
  };

  const UserView = () => {
    const isAdmin = user?.role === 'Admin';

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight">Team Management</h3>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active System Operators</p>
           </div>
           {isAdmin && (
             <button 
               onClick={() => { setEditingItem(null); setModals(m => ({...m, user: true})); }}
               className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-black transition-all"
             >
               <Plus className="w-4 h-4" /> Add Member
             </button>
           )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-6">Member</th>
                <th className="px-8 py-6">Role</th>
                <th className="px-8 py-6 text-left">Email</th>
                {isAdmin && <th className="px-8 py-6 text-right"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">{u.name[0]}</div>
                       <span className="text-sm font-black text-slate-900">{u.name}</span>
                     </div>
                  </td>
                  <td className="px-8 py-5">
                     <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">{u.role}</span>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-700">{u.email}</td>
                  {isAdmin && (
                    <td className="px-8 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={() => { setEditingItem({ type: 'user', data: u }); setModals(m => ({...m, user: true})); }}
                           className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                         >
                           <Pencil className="w-4 h-4" />
                         </button>
                          {user?.id !== u.id && (
                            <button 
                              type="button"
                              onClick={() => setConfirmModal({
                                show: true,
                                title: 'Remove Member',
                                message: `Are you sure you want to remove ${u.name}? They will lose all access to VibeQA.`,
                                onConfirm: () => handleDeleteUser(u.id)
                              })}
                              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer active:scale-95"
                              title="Delete member"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                       </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Handlers
  const handleSaveResult = async (data: any) => {
    try {
      await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, cycleId: selectedCycleId })
      });
      setModals(m => ({ ...m, execution: false }));
      await Promise.all([fetchResults(selectedCycleId), fetchAllResults()]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTestCase = async (tc: any) => {
    try {
      const method = editingItem?.type === 'test' ? 'PUT' : 'POST';
      if (method === 'POST' && testCases.some(existingTc => existingTc.id === tc.id)) {
        setSystemMessage({ text: `Test Case ID '${tc.id}' already exists. Please use a unique ID.`, type: 'error' });
        return;
      }

      const url = editingItem?.type === 'test' ? `/api/test-cases/${editingItem.data.id}` : '/api/test-cases';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tc)
      });
      setModals(m => ({ ...m, test: false }));
      setEditingItem(null);
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBug = async (bug: any, method: 'POST' | 'PUT' = 'POST') => {
    try {
      const url = method === 'PUT' ? `/api/bugs/${bug.id}` : '/api/bugs';
      if (method === 'POST' && bugs.some(existingBug => existingBug.id === bug.id)) {
        setSystemMessage({ text: `Bug ID '${bug.id}' already exists. Please use a unique ID.`, type: 'error' });
        return;
      }

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bug)
      });
      setModals(m => ({ ...m, bug: false }));
      setEditingItem(null);
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCycle = async (cycle: any, method: 'POST' | 'PUT' = 'POST') => {
    try {
      const url = method === 'PUT' ? `/api/cycles/${cycle.id}` : '/api/cycles';
      if (method === 'POST' && cycles.some(existingCycle => existingCycle.id === cycle.id)) {
        setSystemMessage({ text: `Cycle ID '${cycle.id}' already exists. Please use a unique ID.`, type: 'error' });
        return;
      }

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cycle)
      });
      setModals(m => ({ ...m, cycle: false }));
      setEditingItem(null);
      fetchInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveUser = async (data: any) => {
    try {
      const method = editingItem?.type === 'user' ? 'PUT' : 'POST';
      const url = editingItem?.type === 'user' ? `/api/users/${editingItem.data.id}` : '/api/users';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setModals(m => ({ ...m, user: false }));
        setEditingItem(null);
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTestCase = async (tcId: string) => {
    try {
      const res = await fetch(`/api/test-cases/${tcId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchInitialData(); // Await data re-fetch
        setSystemMessage({ text: `Test Case ${tcId} deleted successfully`, type: 'success' });
      } else {
        const errorData = await res.json();
        setSystemMessage({ text: errorData.error || `Failed to delete Test Case ${tcId}`, type: 'error' });
      }
    } catch (err) {
      console.error('Delete Test Case error:', err);
      setSystemMessage({ text: 'Connection error during Test Case deletion', type: 'error' });
    }
  };

  const handleDeleteBug = async (bugId: string) => {
    try {
      const res = await fetch(`/api/bugs/${bugId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchInitialData(); // Await data re-fetch
        setSystemMessage({ text: `Bug ${bugId} deleted successfully`, type: 'success' });
      } else {
        const errorData = await res.json();
        setSystemMessage({ text: errorData.error || `Failed to delete Bug ${bugId}`, type: 'error' });
      }
    } catch (err) {
      console.error('Delete Bug error:', err);
      setSystemMessage({ text: 'Connection error during Bug deletion', type: 'error' });
    }
  };

  const handleDeleteCycle = async (cycleId: string) => {
    try {
      const res = await fetch(`/api/cycles/${cycleId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchInitialData(); // Await data re-fetch
        setSystemMessage({ text: `Cycle ${cycleId} deleted successfully`, type: 'success' });
        // If the deleted cycle was the selected one, reset selectedCycleId
        if (selectedCycleId === cycleId) {
          setSelectedCycleId(cycles.length > 1 ? cycles.filter(c => c.id !== cycleId)[0]?.id || '' : '');
        }
      } else {
        const errorData = await res.json();
        setSystemMessage({ text: errorData.error || `Failed to delete Cycle ${cycleId}`, type: 'error' });
      }
    } catch (err) {
      console.error('Delete Cycle error:', err);
      setSystemMessage({ text: 'Connection error during Cycle deletion', type: 'error' });
    }
  };

  const [systemMessage, setSystemMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (systemMessage) {
      const timer = setTimeout(() => setSystemMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [systemMessage]);

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSystemMessage({ text: 'Team member removed successfully', type: 'success' });
        fetchInitialData();
      } else {
        const errorData = await res.json();
        setSystemMessage({ text: errorData.error || 'Failed to delete member', type: 'error' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setSystemMessage({ text: 'Connection error during deletion', type: 'error' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white text-slate-500 flex flex-col border-r border-slate-200">
        <div className="p-6 h-20 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Waves className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 text-lg tracking-tight">Vibe<span className="text-indigo-600">QA</span></span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Quality Pulse</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 py-4">
          <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard & Analytics" />
          <NavButton active={activeView === 'repository'} onClick={() => setActiveView('repository')} icon={<Database className="w-4 h-4" />} label="Test Repository" />
          <NavButton active={activeView === 'regressions'} onClick={() => setActiveView('regressions')} icon={<Play className="w-4 h-4" />} label="Regression Cycles" />
          <NavButton active={activeView === 'bugs'} onClick={() => setActiveView('bugs')} icon={<BugIcon className="w-4 h-4" />} label="Issues & Defects" />
          <div className="pt-8 pb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Administration</div>
          <NavButton active={activeView === 'users'} onClick={() => setActiveView('users')} icon={<UsersIcon className="w-4 h-4" />} label="Team Members" />
        </nav>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 ring-2 ring-indigo-500/20">
               {user.name.split(' ').map(n => n[0]).join('')}
             </div>
             <div className="flex flex-col">
               <span className="text-xs font-bold text-slate-900">{user.name}</span>
               <span className="text-[10px] text-slate-500 font-medium">{user.role}</span>
             </div>
          </div>
          <button 
            onClick={logout}
            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white border border-slate-200 rounded-lg shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <AnimatePresence>
            {systemMessage && (
              <motion.div 
                key={systemMessage.text + systemMessage.type} // Unique key for AnimatePresence
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 border backdrop-blur-md",
                  systemMessage.type === 'error' ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                )}
              >
                {systemMessage.type === 'error' ? <BugIcon className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span className="text-xs font-black uppercase tracking-widest">{systemMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tight capitalize">
              {activeView === 'dashboard' ? 'Integrated Dashboard' : activeView}
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              VibeQA <ChevronRight className="w-3 h-3" /> {
                activeView === 'dashboard' ? 'Dashboard & Analytics' : 
                activeView === 'repository' ? 'Test Repository' : 
                activeView === 'regressions' ? 'Regression Cycles' : 
                activeView === 'bugs' ? 'Issues & Defects' : 
                activeView === 'users' ? 'Team Members' : activeView
              }
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative">
               <select 
                 value={selectedCycleId}
                 onChange={(e) => setSelectedCycleId(e.target.value)}
                 className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-50 appearance-none pr-10 transition-all cursor-pointer min-w-[200px]"
               >
                 {cycles.length === 0 && <option value="">No Cycles Found</option>}
                 {cycles.map(c => (
                   <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
                 ))}
               </select>
               <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>

             <div className="h-6 w-px bg-slate-200 mx-2" />

             <button 
               onClick={() => setModals(m => ({ ...m, export: true }))}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
             >
               <Download className="w-4 h-4" /> Export 
             </button>

             <button 
               onClick={() => setModals(m => ({ ...m, import: true }))}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
             >
               <Database className="w-4 h-4" /> Import
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeView === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <DashboardView />
               
               <div className="pt-12 border-t border-slate-200">
                 <div className="flex items-center gap-3 mb-8">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                     <TrendingUp className="w-5 h-5" />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-slate-900 tracking-tight">Intelligence & Analytics</h2>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cross-Cycle Historical Insights</p>
                   </div>
                 </div>
                 
                 <GlobalAnalytics 
                    cycles={cycles} 
                    testCases={testCases} 
                    bugs={bugs} 
                    results={allResults} 
                    users={users} 
                  />
               </div>
            </div>
          )}
          {activeView === 'repository' && <RepositoryView />}
          {activeView === 'bugs' && <BugView />}
          {activeView === 'regressions' && <RegressionView />}
          {activeView === 'users' && <UserView />}
        </main>
      </div>

      <AnimatePresence>
        {modals.test && (
          <TestCaseModal 
             onClose={() => setModals(m => ({...m, test: false}))} 
             onSave={handleSaveTestCase} 
             initialData={editingItem?.type === 'test' ? editingItem.data : null} 
          />
        )}
        {modals.bug && (
          <BugModal 
            onClose={() => { setModals(m => ({...m, bug: false})); setEditingItem(null); }} 
            onSave={handleSaveBug} 
            users={users} 
            testCases={testCases} 
            cycles={cycles} 
            currentUser={user}
            selectedCycleId={selectedCycleId}
            initialData={editingItem?.type === 'bug' ? editingItem.data : null}
          />
        )}
        {modals.cycle && (
          <CycleModal 
            onClose={() => { setModals(m => ({ ...m, cycle: false })); setEditingItem(null); }} 
            onSave={handleSaveCycle} 
            users={users} 
            initialData={editingItem?.type === 'cycle' ? editingItem.data : null} 
            currentUser={user}
          />
        )}
        {modals.user && (
          <UserModal 
            onClose={() => { setModals(m => ({ ...m, user: false })); setEditingItem(null); }}
            onSave={handleSaveUser}
            initialData={editingItem?.type === 'user' ? editingItem.data : null}
          />
        )}
        {modals.execution && currentTestCase && (
           <ExecutionModal 
             testCase={currentTestCase} 
             initialResult={results
               .filter(r => r.testCaseId === currentTestCase.id && r.cycleId === selectedCycleId)
               .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] || null}
             users={users} 
             onClose={() => setModals(m => ({ ...m, execution: false }))} 
             onSave={handleSaveResult} 
           />
        )}
        {modals.import && (
          <ImportModal 
            onClose={() => setModals(m => ({ ...m, import: false }))}
            onSuccess={() => {
              setModals(m => ({ ...m, import: false }));
              fetchInitialData();
            }}
            users={users}
            testCases={testCases}
          />
        )}
        {modals.export && (
          <ExportReportModal 
            onClose={() => setModals(m => ({ ...m, export: false }))}
            cycles={cycles}
            users={users}
            bugs={bugs}
            testCases={testCases}
            results={allResults}
          />
        )}

        {confirmModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[32px] shadow-2xl max-w-sm w-full border border-slate-200"
            >
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal({ ...confirmModal, show: false });
                  }}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExportItem({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-all"
    >
      {label}
    </button>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
        active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cn(active ? "text-white" : "text-slate-400 group-hover:text-indigo-600")}>{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", color)}>
          {icon}
        </div>
        <TrendingUp className="w-4 h-4 text-emerald-500" />
      </div>
      <div className="text-2xl font-black text-slate-950">{value}</div>
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ type, value }: { type: 'priority' | 'severity' | 'bugStatus' | 'execStatus', value: string }) {
  const getColors = () => {
    switch (value) {
      // Industrial Strength Colors: Red (Danger), Amber (Warning), Green (Success), Blue/Indigo (Info/Process), Slate (Neutral)
      case 'High': case 'Critical': case 'Reopen': case 'Fail': 
        return "bg-red-50 text-red-600 border-red-100";
      case 'Medium': case 'Major': case 'In Progress': case 'Blocked': 
        return "bg-amber-50 text-amber-700 border-amber-100";
      case 'Low': case 'Done': case 'Pass': 
        return "bg-green-50 text-green-600 border-green-100";
      case 'Ready for Build': case 'Planned':
        return "bg-blue-50 text-blue-600 border-blue-100";
      case 'Todo': case 'Retest':
        return "bg-slate-50 text-slate-500 border-slate-200";
      default: 
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border",
      getColors()
    )}>
      {value}
    </span>
  );
}
