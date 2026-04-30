import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { db } from '../App';
import { ExpenseRequest } from '../types';
import { 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  ChevronRight, 
  Calendar,
  MessageSquare,
  FileText,
  Download,
  X
} from 'lucide-react';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';
import AddExpenseRequestModal from './AddExpenseRequestModal';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface VolunteerFinanceDashboardProps {
  user: any;
}

export const VolunteerFinanceDashboard = ({ user }: VolunteerFinanceDashboardProps) => {
  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequest | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Real-time listener for this specific volunteer's requests
    const q = query(
      collection(db, 'expense_requests'),
      where('requesterUid', '==', user.uid),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExpenseRequest[];
      setRequests(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'expense_requests');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const stats = {
    pending: requests.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0),
    approved: requests.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.amount, 0),
    rejected: requests.filter(r => r.status === 'rejected').reduce((acc, r) => acc + r.amount, 0)
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          label="Pending Clearance" 
          value={stats.pending} 
          icon={ClockIcon} 
          color="amber"
          delay={0.1}
        />
        <SummaryCard 
          label="Total Approved" 
          value={stats.approved} 
          icon={Wallet} 
          color="emerald"
          delay={0.2}
        />
        <SummaryCard 
          label="Declined Funds" 
          value={stats.rejected} 
          icon={AlertCircle} 
          color="rose"
          delay={0.3}
        />
      </div>

      {/* History Feed */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Request History</h2>
          <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            {requests.length} Logs
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="p-20 text-center text-slate-400 font-medium italic">Scanning mission logs...</div>
            ) : requests.length === 0 ? (
              <div className="p-20 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <FileText className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium italic">No financial requests found in your ledger.</p>
              </div>
            ) : (
              requests.map((request, index) => (
                <HistoryItem 
                  key={request.id} 
                  request={request} 
                  index={index}
                  onClick={() => setSelectedRequest(request)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center z-40 group"
      >
        <Plus className="group-hover:rotate-90 transition-transform duration-300" size={28} />
      </motion.button>

      {/* Request Modal */}
      <AddExpenseRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user}
      />

      {/* Detail Sheet */}
      <DetailSheet 
        request={selectedRequest} 
        onClose={() => setSelectedRequest(null)} 
      />
    </div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, color, delay }: any) => {
  const colors = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5"
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", colors[color as keyof typeof colors])}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none mt-1">₹{value.toLocaleString()}</p>
      </div>
    </motion.div>
  );
};

const ClockIcon = (props: any) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const HistoryItem = ({ request, index, onClick }: { request: ExpenseRequest; index: number; onClick: () => void; key?: any }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="p-6 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
    >
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 font-black shadow-sm group-hover:scale-110 transition-transform">
          {request.description.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{request.description}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={10} />
              {request.submittedAt?.toDate ? format(request.submittedAt.toDate(), 'dd MMM yyyy') : 'Recently'}
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{request.department}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="text-lg font-black text-slate-900">₹{request.amount.toLocaleString()}</p>
          <ExpenseStatusBadge status={request.status} className="mt-1 ml-auto" />
        </div>
        <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-400 transition-colors group-hover:translate-x-1" />
      </div>
    </motion.div>
  );
};

const DetailSheet = ({ request, onClose }: { request: ExpenseRequest | null; onClose: () => void }) => {
  if (!request) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ y: 500, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 500, opacity: 0 }}
          className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className="h-1.5 w-12 bg-slate-100 rounded-full mx-auto mt-4 sm:hidden" />
          
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <FileText className="text-indigo-600" size={24} />
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <ExpenseStatusBadge status={request.status} />
                <h3 className="text-3xl font-black text-slate-900 mt-4 leading-tight">{request.description}</h3>
                <p className="text-4xl font-black text-indigo-600 mt-2">₹{request.amount.toLocaleString()}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Transmitted</span>
                </div>
                <p className="text-sm font-medium text-slate-600 italic leading-relaxed">
                  "{request.professionalMessage || request.message}"
                </p>
              </div>

              {request.status === 'rejected' && request.rejectionReason && (
                <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100 ring-4 ring-rose-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={14} className="text-rose-600" />
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Feedback from Finance Head</span>
                  </div>
                  <p className="text-sm font-bold text-rose-900">
                    {request.rejectionReason}
                  </p>
                </div>
              )}

              {request.status === 'approved' && (
                <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                  <Download size={18} />
                  Download Authorization PDF
                </button>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sector</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">{request.department}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Submitted</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {request.submittedAt?.toDate ? format(request.submittedAt.toDate(), 'do MMM HH:mm') : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
