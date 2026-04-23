import React from 'react';
import { format } from 'date-fns';
import { ChevronRight, FileText, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  onAction?: (id: string, status: 'approved' | 'rejected' | 'cleared') => void;
  isAdmin?: boolean;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onAction, isAdmin }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'cleared': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={12} />;
      case 'rejected': return <XCircle size={12} />;
      case 'cleared': return <CheckCircle2 size={12} />;
      default: return <Clock size={12} />;
    }
  };

  return (
    <div className="overflow-hidden bg-white/50 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              {isAdmin && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">
                      {t.date?.toDate ? format(t.date.toDate(), 'MMM dd, yyyy') : 'Recent'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {t.date?.toDate ? format(t.date.toDate(), 'HH:mm') : '-'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${t.type === 'income' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 capitalize">{t.expenditureType || t.donationType || t.category}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                        ID: {t.id.slice(0, 8)} | Project: {t.projectID ? 'Mission Active' : 'General'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                    {t.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-slate-500">{t.paymentMethod}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(t.status)}`}>
                      {getStatusIcon(t.status)}
                      {t.status}
                    </span>
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right">
                    {t.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onAction?.(t.id, 'approved')}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-100 transition-all"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button 
                          onClick={() => onAction?.(t.id, 'rejected')}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase italic">Cleared</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">No filtered ledger entries detected</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card-Based View */}
      <div className="md:hidden divide-y divide-slate-100">
        {transactions.map((t) => (
          <div key={t.id} className="p-6 space-y-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {t.date?.toDate ? format(t.date.toDate(), 'MMM dd, HH:mm') : 'Recent'}
              </span>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(t.status)}`}>
                {getStatusIcon(t.status)}
                {t.status}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl border ${t.type === 'income' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{t.expenditureType || t.donationType || t.category}</p>
                <p className="text-xs text-slate-500 font-medium">via {t.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className={`text-base font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.category}</p>
              </div>
            </div>

            {isAdmin && t.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => onAction?.(t.id, 'approved')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button 
                  onClick={() => onAction?.(t.id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest opacity-50">Empty Ledger</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionTable;
