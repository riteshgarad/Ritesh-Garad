import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  MessageSquare,
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  onAction?: (id: string, status: 'approved' | 'rejected' | 'cleared', reason?: string) => void;
  isAdmin?: boolean;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onAction, isAdmin }) => {
  const [rejectionId, setRejectionId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'cleared': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse';
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

  const handleSubmitRejection = () => {
    if (rejectionId && reason) {
      onAction?.(rejectionId, 'rejected', reason);
      setRejectionId(null);
      setReason('');
    }
  };

  return (
    <div className="space-y-4">
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
                      <div className="text-left">
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
                        <div className="flex items-center justify-end gap-2 transition-all">
                          <button 
                            onClick={() => onAction?.(t.id, 'approved')}
                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-100 transition-all shadow-sm"
                            title="Direct Approval"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            onClick={() => setRejectionId(t.id)}
                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-100 transition-all shadow-sm"
                            title="Rejection Protocol"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-slate-400 font-bold uppercase italic">Audited</span>
                          {t.rejectionReason && (
                            <div className="group/reason relative mt-1">
                              <AlertCircle size={12} className="text-rose-400 cursor-help" />
                              <div className="absolute right-0 bottom-full mb-2 bg-slate-900 text-white text-[9px] p-2 rounded-lg w-48 opacity-0 group-hover/reason:opacity-100 transition-opacity pointer-events-none z-50">
                                {t.rejectionReason}
                              </div>
                            </div>
                          )}
                        </div>
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
            <div key={t.id} className="p-6 space-y-4 hover:bg-slate-50 transition-colors text-left">
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
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    onClick={() => onAction?.(t.id, 'approved')}
                    className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button 
                    onClick={() => setRejectionId(t.id)}
                    className="flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}

              {t.rejectionReason && (
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={12} className="text-rose-400" />
                    <p className="text-[9px] font-black text-rose-900 uppercase">Audit Feedback</p>
                  </div>
                  <p className="text-[11px] font-medium text-rose-700 italic">"{t.rejectionReason}"</p>
                </div>
              )}
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-12 text-center text-left">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest opacity-50 text-center">Empty Ledger</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectionId && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectionId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="text-left">
                  <h3 className="text-2xl font-black text-slate-900 italic uppercase">Rejection Protocol</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Audit Log Required</p>
                </div>
                <button 
                  onClick={() => setRejectionId(null)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Context for Rejection</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20"
                    placeholder="e.g., Missing receipt, Category mismatch..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setRejectionId(null)}
                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmitRejection}
                    disabled={!reason.trim()}
                    className="flex-1 py-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-rose-600/30 hover:bg-rose-500 transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionTable;
