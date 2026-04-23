import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  Search,
  LayoutGrid,
  ChevronDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../App';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, where, serverTimestamp } from 'firebase/firestore';
import { Transaction, Project, AppUser } from '../types';
import TransactionTable from './TransactionTable';
import AddTransactionModal from './AddTransactionModal';
import { exportTransactionsToExcel } from '../lib/exportService';

interface FinanceDashboardProps {
  user: AppUser | null;
  projects?: Project[];
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ user, projects = [] }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'income' | 'expense',
    status: 'all',
    projectID: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  const isAdmin = user?.role === 'Admin' || user?.role === 'Finance Head';

  useEffect(() => {
    if (!auth.currentUser) return;

    // Base query
    let q = query(collection(db, 'transactions'), orderBy('date', 'desc'));

    // Apply security filters in rule-side is preferred, but for UI we might fetch more if Admin
    // If not admin, rule-side list rule: resource.data.createdBy == request.auth.uid handles it.
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: any, reason?: string) => {
    if (!isAdmin) return;
    try {
      const data: any = { 
        status,
        reviewedBy: auth.currentUser?.uid,
        reviewedAt: serverTimestamp()
      };
      if (reason) data.rejectionReason = reason;

      await updateDoc(doc(db, 'transactions', id), data);
    } catch (error) {
      console.error("Error updating transaction status:", error);
    }
  };

  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income' && (t.status === 'approved' || t.status === 'cleared'))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense' && (t.status === 'approved' || t.status === 'cleared'))
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingCount = transactions.filter(t => t.status === 'pending').length;

    return {
      balance: income - expense,
      totalIncome: income,
      totalExpense: expense,
      pendingCount
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filters.type === 'all' || t.type === filters.type;
      const matchesProject = filters.projectID === 'all' || t.projectID === filters.projectID;
      const matchesStatus = filters.status === 'all' || t.status === filters.status;
      const matchesSearch = filters.search === '' || 
        t.category.toLowerCase().includes(filters.search.toLowerCase()) ||
        (t.expenditureType || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        (t.donationType || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(filters.search.toLowerCase());
      
      let matchesDate = true;
      if (filters.startDate && t.date) {
        const tDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        matchesDate = tDate >= new Date(filters.startDate);
      }
      if (filters.endDate && t.date && matchesDate) {
        const tDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = tDate <= end;
      }

      return matchesType && matchesProject && matchesStatus && matchesSearch && matchesDate;
    });
  }, [transactions, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.projectID !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-8 p-4 md:p-0 bg-[#F9FAFB]/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
            Finance <span className="bg-emerald-500 text-white text-[10px] not-italic px-2 py-1 rounded-md uppercase tracking-widest font-black">Ledger v2</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Real-time expenditure tracking and fiscal oversight.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportTransactionsToExcel(filteredTransactions)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm"
          >
            <Download size={16} /> Export Statement
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg shadow-slate-200"
          >
            <Plus size={16} /> Log Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={120} />
          </div>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Available Liquidity</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-white tracking-tight">₹{stats.balance.toLocaleString()}</h2>
            <span className="text-emerald-400 text-xs font-bold leading-none">Net Growth</span>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <div className="px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-md">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Project Allocation</p>
              <p className="text-xs font-bold text-white tracking-widest">₹4.2L <span className="opacity-40 italic">Active</span></p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden"
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Monthly Inflows</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-emerald-600 tracking-tight">₹{stats.totalIncome.toLocaleString()}</h2>
            <div className="p-1 bg-emerald-50 text-emerald-500 rounded-lg">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-8 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-[65%]" />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">65% vs Initial Target</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden"
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Monthly Outflows</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-rose-600 tracking-tight">₹{stats.totalExpense.toLocaleString()}</h2>
            <div className="p-1 bg-rose-50 text-rose-500 rounded-lg">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Clear</p>
              <p className="text-sm font-black text-slate-700">{stats.pendingCount} Entries</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Burn Rate</p>
              <p className="text-sm font-black text-slate-700">Moderate</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Primary Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Scan ledger by category or keyword..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex p-1 bg-slate-50 border border-slate-100 rounded-2xl">
            <button 
              onClick={() => setFilters({ ...filters, type: 'all' })}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filters.type === 'all' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilters({ ...filters, type: 'income' })}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filters.type === 'income' ? 'bg-white shadow-sm text-emerald-600 border border-slate-200' : 'text-slate-400'}`}
            >
              Income
            </button>
            <button 
              onClick={() => setFilters({ ...filters, type: 'expense' })}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filters.type === 'expense' ? 'bg-white shadow-sm text-rose-600 border border-slate-200' : 'text-slate-400'}`}
            >
              Expense
            </button>
          </div>
          
          <button 
            onClick={() => setIsFilterDrawerOpen(true)}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 relative group"
          >
            <Filter size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Validated Ledger Entries</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Showing {filteredTransactions.length} of {transactions.length} records</p>
        </div>
        <TransactionTable 
          transactions={filteredTransactions} 
          isAdmin={isAdmin}
          onAction={handleUpdateStatus}
        />
      </div>

      {/* Filter Side Drawer (Mobile Friendly) */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[130] shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Query Protocol</h3>
                  <p className="text-xs text-slate-500 font-medium">Filter NGO transactions</p>
                </div>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8 text-left">
                {/* Date Picker */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Temporal Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase ml-1">From</p>
                      <input 
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase ml-1">To</p>
                      <input 
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Project Filter */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sector/Project Allocation</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                    value={filters.projectID}
                    onChange={e => setFilters({ ...filters, projectID: e.target.value })}
                  >
                    <option value="all">All Mission Sectors</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Verification Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['all', 'pending', 'approved', 'cleared', 'rejected'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilters({ ...filters, status: s })}
                        className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${
                          filters.status === s 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-3">
                <button 
                  onClick={() => {
                    setFilters({ type: 'all', status: 'all', projectID: 'all', startDate: '', endDate: '', search: '' });
                    setIsFilterDrawerOpen(false);
                  }}
                  className="w-full py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all italic underline underline-offset-4"
                >
                  Reset Query Parameters
                </button>
                <button 
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
                >
                  Apply Protocol
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        projects={projects}
      />
    </div>
  );
};

export default FinanceDashboard;
