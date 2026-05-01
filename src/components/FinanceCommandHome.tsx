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
  Activity
} from 'lucide-react';
import { AppUser, Transaction, Project, ExpenseRequest } from '../types';
import { db, auth } from '../App';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import ExpenseApprovalDashboard from './ExpenseApprovalDashboard';
import { LedgerList } from './LedgerList';
import { BudgetGauge } from './BudgetGauge';

interface FinanceCommandHomeProps {
  user: AppUser;
  projects: Project[];
}

const FinanceCommandHome: React.FC<FinanceCommandHomeProps> = ({ user, projects }) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'ledger' | 'budgets' | 'income'>('inbox');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>([]);

  // Real-time Data Listeners
  useEffect(() => {
    const qTransactions = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubTx = onSnapshot(qTransactions, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const qRequests = query(collection(db, 'expense_requests'), orderBy('timestamp', 'desc'));
    const unsubReq = onSnapshot(qRequests, (snapshot) => {
      setExpenseRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseRequest)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'expense_requests'));

    return () => { unsubTx(); unsubReq(); };
  }, []);

  const pendingCount = useMemo(() => expenseRequests.filter(r => r.status === 'pending').length, [expenseRequests]);

  const tabs = [
    { id: 'inbox', label: 'Approval Inbox', icon: Inbox, count: pendingCount },
    { id: 'ledger', label: 'Digital Ledger', icon: BookOpen },
    { id: 'budgets', label: 'Mission Budgets', icon: ChartIcon },
    { id: 'income', label: 'Income Hub', icon: TrendingUp },
  ];

  const totalInflow = useMemo(() => 
    transactions.filter(t => t.type === 'income' && t.status === 'cleared').reduce((s, t) => s + t.amount, 0)
  , [transactions]);

  return (
    <div className="min-h-screen bg-[#FAF7F2]/40 pb-20">
      {/* Branded Header */}
      <div className="bg-[#4A1412] pt-12 pb-24 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 text-white transform rotate-12">
            <ShieldCheck size={200} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
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
      <div className="max-w-7xl mx-auto px-8 -mt-12 mb-12">
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
      <div className="max-w-7xl mx-auto px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {activeTab === 'inbox' && (
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                <ExpenseApprovalDashboard user={user} requests={expenseRequests} />
              </div>
            )}

            {activeTab === 'ledger' && (
              <LedgerList 
                transactions={transactions} 
                projects={projects} 
                isAdmin={true} 
                onUpdateStatus={() => {}} 
              />
            )}

            {activeTab === 'budgets' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-black text-[#4A1412] uppercase tracking-tighter italic">Mission Expenditure Velocity</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Real-time Project Linking</p>
                </div>
                <BudgetGauge projects={projects} transactions={transactions} />
              </div>
            )}

            {activeTab === 'income' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-xl shadow-emerald-900/10">
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Total Realized Inflow</p>
                    <h3 className="text-4xl font-black tracking-tighter">₹{totalInflow.toLocaleString()}</h3>
                    <div className="mt-6 flex items-center gap-2">
                      <TrendingUp size={16} />
                      <span className="text-[10px] font-bold uppercase">Steady Growth Sector</span>
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
    </div>
  );
};

export default FinanceCommandHome;
