import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Inbox, 
  BookOpen, 
  PieChart as ChartIcon, 
  TrendingUp, 
  ShieldCheck,
  ChevronRight,
  IndianRupee,
  Activity,
  Zap,
  Target,
  Star,
  ChevronLeft,
  Plus
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { AppUser, Transaction, Project, ExpenseRequest, BudgetRequest, FinanceRequest } from '../types';
import { db, auth } from '../App';
import { collection, query, onSnapshot, orderBy, where, limit } from 'firebase/firestore';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import ExpenseApprovalDashboard from './ExpenseApprovalDashboard';
import { LedgerList } from './LedgerList';
import { BudgetGauge } from './BudgetGauge';
import AddExpenseRequestModal from './AddExpenseRequestModal';

interface FinanceCommandHomeProps {
  user: AppUser;
  projects: Project[];
  initialTab?: 'inbox' | 'ledger' | 'budgets' | 'income';
}

const FinanceCommandHome: React.FC<FinanceCommandHomeProps> = ({ user, projects, initialTab = 'inbox' }) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'ledger' | 'budgets' | 'income' | 'expenses'>('inbox');

  // Sync activeTab if initialTab changes
  useEffect(() => {
    setActiveTab(initialTab as any);
  }, [initialTab]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>([]);
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [financeRequests, setFinanceRequests] = useState<FinanceRequest[]>([]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Real-time Data Listeners
  useEffect(() => {
    const qTransactions = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubTx = onSnapshot(qTransactions, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const qRequests = query(collection(db, 'expense_requests'), orderBy('submittedAt', 'desc'));
    const unsubReq = onSnapshot(qRequests, (snapshot) => {
      setExpenseRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseRequest)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'expense_requests'));

    const qBudgets = query(collection(db, 'budget_requests'), orderBy('submittedAt', 'desc'));
    const unsubBudgets = onSnapshot(qBudgets, (snapshot) => {
      setBudgetRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetRequest)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'budget_requests'));

    const qFin = query(collection(db, 'finance_requests'), orderBy('requested_at', 'desc'), limit(10));
    const unsubFin = onSnapshot(qFin, (snapshot) => {
      setFinanceRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceRequest)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'finance_requests'));

    return () => { unsubTx(); unsubReq(); unsubBudgets(); unsubFin(); };
  }, []);

  const DONATION_DATA = [
    { month: 'Nov', amount: 80000 },
    { month: 'Dec', amount: 95000 },
    { month: 'Jan', amount: 72000 },
    { month: 'Feb', amount: 110000 },
    { month: 'Mar', amount: 88000 },
    { month: 'Apr', amount: 120000 },
  ];

  const ALLOCATION_DATA = [
    { name: 'Health', value: 400, color: '#3b82f6' },
    { name: 'Education', value: 300, color: '#10b981' },
    { name: 'Environment', value: 200, color: '#f59e0b' },
    { name: 'Community', value: 100, color: '#6366f1' },
  ];

  const totalPending = useMemo(() => {
    const expPending = expenseRequests.filter(r => r.status === 'pending').length;
    const budPending = budgetRequests.filter(r => r.status === 'pending_finance').length;
    return expPending + budPending;
  }, [expenseRequests, budgetRequests]);

  const expensePendingCount = useMemo(() => expenseRequests.filter(r => r.status === 'pending').length, [expenseRequests]);

  const tabs = [
    { id: 'inbox', label: 'Fund Requests', icon: Inbox, count: totalPending },
    { id: 'expenses', label: 'Expense Inbox', icon: IndianRupee, count: expensePendingCount },
    { id: 'ledger', label: 'Digital Ledger', icon: BookOpen },
    { id: 'budgets', label: 'Mission Budgets', icon: ChartIcon },
    { id: 'income', label: 'Income Hub', icon: TrendingUp },
  ];

  const totalInflow = useMemo(() => 
    transactions.filter(t => t.type === 'income' && t.status === 'cleared').reduce((s, t) => s + t.amount, 0)
  , [transactions]);

  const normalizedRequests: ExpenseRequest[] = useMemo(() => {
    const normalizedExpenses = expenseRequests.map(er => ({
      ...er,
      type: 'expense' as const
    }));

    const normalizedBudgets = budgetRequests.map(br => ({
      id: br.id,
      projectId: br.projectId,
      requesterId: br.proposerId,
      requesterName: br.projectName,
      requesterEmail: '', // br.proposedBy used instead?
      department: br.department,
      amount: br.totalAmount,
      description: `Budget Request for ${br.projectName}`,
      professionalMessage: `Proposed by ${br.proposedBy}. Contains ${br.itemizedList?.length || 0} items.`,
      status: br.status === 'pending_finance' ? 'pending' : (br.status === 'approved' ? 'approved' : 'rejected'),
      submittedAt: br.submittedAt,
      type: 'budget' as const
    } as any));

    return [...normalizedExpenses, ...normalizedBudgets].sort((a, b) => {
      const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : (a.timestamp?.toMillis ? a.timestamp.toMillis() : 0);
      const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : (b.timestamp?.toMillis ? b.timestamp.toMillis() : 0);
      return timeB - timeA;
    });
  }, [expenseRequests, budgetRequests]);

  return (
    <div className="min-h-screen bg-[#FAF7F2]/40 pb-20">
      {/* Branded Header */}
      <div className="bg-[#4A1412] pt-12 pb-24 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 text-white transform rotate-12">
            <ShieldCheck size={200} />
        </div>
        <div className="w-full px-4 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-lg bg-[#A63A1B] flex items-center justify-center text-white shadow-lg">
                  <Activity size={18} />
                </span>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Finance Command</h1>
              </div>
              <p className="text-[#FAF7F2]/60 text-[10px] font-bold uppercase tracking-[0.3em]">Foundation Protocol / Fiscal Oversight</p>
            </div>
            
            <div className="flex gap-4">
               <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                  <p className="text-[9px] font-black text-[#FAF7F2]/40 uppercase tracking-widest mb-1">Portfolio Value</p>
                  <p className="text-xl font-black text-[#FAF7F2]">₹{totalInflow.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="w-full px-4 md:px-8 -mt-12 mb-12">
        <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-[#4A1412]/5 flex flex-wrap gap-1 border border-slate-100">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${
                  isActive 
                  ? 'bg-[#A63A1B] text-white shadow-lg shadow-[#A63A1B]/20 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-[#FAF7F2] hover:text-[#4A1412]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${isActive ? 'bg-white text-[#A63A1B]' : 'bg-[#A63A1B]/10 text-[#A63A1B]'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Command Workspace */}
      <div className="w-full px-4 md:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {activeTab === 'inbox' && (
              <div className="overflow-hidden min-h-[600px]">
                <ExpenseApprovalDashboard user={user} requests={normalizedRequests} />
              </div>
            )}

            {activeTab === 'expenses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-black text-[#4A1412] uppercase tracking-tighter italic">Tactical Expense Queue</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Individual Reimbursements & Payments</p>
                  </div>
                  <button 
                    onClick={() => setShowAddExpenseModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 transition-transform"
                  >
                    <Plus size={14} />
                    New Request
                  </button>
                </div>
                <div className="overflow-hidden min-h-[600px]">
                  <ExpenseApprovalDashboard user={user} requests={expenseRequests.map(er => ({ ...er, type: 'expense' }))} />
                </div>
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="min-h-[600px]">
                <LedgerList 
                  transactions={transactions} 
                  projects={projects} 
                  isAdmin={true} 
                  onUpdateStatus={() => {}} 
                />
              </div>
            )}

            {activeTab === 'budgets' && (
              <div className="space-y-12 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/60 backdrop-blur-sm p-10 rounded-[3rem] border border-white shadow-xl shadow-slate-200/20 text-left">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Asset Allocation Matrix</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
                      <div className="h-72 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={ALLOCATION_DATA}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={95}
                              paddingAngle={8}
                              dataKey="value"
                            >
                              {ALLOCATION_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Ops</span>
                          <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter">100%</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {ALLOCATION_DATA.map((item) => (
                          <div key={item.name} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{item.name}</span>
                            </div>
                            <span className="text-sm font-black text-slate-900">{(item.value / 10).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm p-10 rounded-[3rem] border border-white shadow-xl shadow-slate-200/20 text-left">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8">System Diagnostics</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Operational Efficiency', value: '94.2%', icon: Zap, color: 'text-emerald-500' },
                        { label: 'Asset Utilization', value: '78.5%', icon: Target, color: 'text-blue-500' },
                        { label: 'Fund Health Index', value: 'Gold', icon: Star, color: 'text-amber-500' },
                      ].map((hub, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-xl bg-slate-50 shadow-inner", hub.color)}>
                              <hub.icon size={20} />
                            </div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{hub.label}</span>
                          </div>
                          <span className="text-lg font-black text-slate-900">{hub.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-[#4A1412] uppercase tracking-tighter italic">Mission Expenditure Velocity</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Real-time Project Linking</p>
                    </div>
                  </div>
                  <BudgetGauge projects={projects} transactions={transactions} />
                </div>
              </div>
            )}

            {activeTab === 'income' && (
              <div className="space-y-12 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="md:col-span-2 bg-white/60 backdrop-blur-sm p-10 rounded-[3rem] border border-white shadow-xl shadow-slate-200/20 text-left">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      Donation Inflow Pulse
                    </h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={DONATION_DATA}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                            tickFormatter={(val) => `₹${val/1000}k`}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              borderRadius: '16px', 
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              fontWeight: 900,
                              fontSize: '11px',
                              textTransform: 'uppercase'
                            }} 
                          />
                          <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-emerald-900/40 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-6">Total Realized Inflow</p>
                      <h3 className="text-6xl font-black tracking-tighter text-white">₹{totalInflow.toLocaleString()}</h3>
                    </div>
                    <div className="mt-8 flex items-center gap-3">
                      <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        <TrendingUp size={24} />
                      </div>
                      <span className="text-[12px] font-black uppercase tracking-widest">Steady Growth Sector</span>
                    </div>
                  </div>
                </div>

                <LedgerList 
                  transactions={transactions.filter(t => t.type === 'income')} 
                  projects={projects} 
                  isAdmin={true} 
                  onUpdateStatus={() => {}} 
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Modals */}
      {showAddExpenseModal && (
        <AddExpenseRequestModal 
          isOpen={showAddExpenseModal} 
          onClose={() => setShowAddExpenseModal(false)} 
          user={user} 
        />
      )}
    </div>
  );
};

export default FinanceCommandHome;
