import React, { useState, useMemo } from 'react';
import { Transaction, Project } from '../types';
import { Download, Search, Filter, Calendar as CalendarIcon, ChevronDown, IndianRupee } from 'lucide-react';
import TransactionTable from './TransactionTable';
import { exportTransactionsToExcel } from '../lib/exportService';
import { motion } from 'motion/react';

interface LedgerListProps {
  transactions: Transaction[];
  projects: Project[];
  isAdmin: boolean;
  onUpdateStatus: (id: string, status: any) => void;
}

export const LedgerList: React.FC<LedgerListProps> = ({ 
  transactions, 
  projects, 
  isAdmin, 
  onUpdateStatus 
}) => {
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'income' | 'expense',
    projectID: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filters.type === 'all' || t.type === filters.type;
      const matchesProject = filters.projectID === 'all' || t.projectID === filters.projectID;
      const matchesSearch = filters.search === '' || 
        t.category.toLowerCase().includes(filters.search.toLowerCase()) ||
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

      return matchesType && matchesProject && matchesSearch && matchesDate;
    });
  }, [transactions, filters]);

  return (
    <div className="space-y-6">
      {/* Search & Global Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#A63A1B] transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Audit ledger entries by keyword..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-[#A63A1B]/5 focus:border-[#A63A1B] outline-none transition-all shadow-sm"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <button 
          onClick={() => exportTransactionsToExcel(filteredTransactions)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#4A1412] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#2D0D0B] transition-all shadow-lg shadow-black/5"
        >
          <Download size={16} /> Export Statement
        </button>
      </div>

      {/* Advanced Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#FAF7F2] rounded-[2rem] border border-[#A63A1B]/5">
        <div className="space-y-1.5">
          <p className="text-[9px] font-black text-[#A63A1B] uppercase tracking-widest ml-1">Flow Direction</p>
          <select 
            value={filters.type}
            onChange={e => setFilters({...filters, type: e.target.value as any})}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-wider outline-none"
          >
            <option value="all">Consolidated (All)</option>
            <option value="income">Inflows (Donations)</option>
            <option value="expense">Outflows (Spending)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <p className="text-[9px] font-black text-[#A63A1B] uppercase tracking-widest ml-1">Mission Sector</p>
          <select 
            value={filters.projectID}
            onChange={e => setFilters({...filters, projectID: e.target.value})}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-wider outline-none"
          >
            <option value="all">Foundation Global</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <p className="text-[9px] font-black text-[#A63A1B] uppercase tracking-widest ml-1">Date Parameter Range</p>
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase outline-none"
            />
            <input 
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <TransactionTable 
          transactions={filteredTransactions}
          isAdmin={isAdmin}
          onAction={onUpdateStatus}
        />
      </div>
    </div>
  );
};
