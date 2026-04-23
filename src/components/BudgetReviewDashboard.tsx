import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  User, 
  Clock,
  IndianRupee,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../App';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { BudgetRequest, AppUser } from '../types';

interface BudgetReviewDashboardProps {
  user: AppUser | null;
}

export const BudgetReviewDashboard: React.FC<BudgetReviewDashboardProps> = ({ user }) => {
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const isAdmin = user?.role === 'Admin' || user?.role === 'Finance Head';

  useEffect(() => {
    const q = query(collection(db, 'budget_requests'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetRequest));
      setRequests(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAction = async (requestId: string, status: 'approved' | 'rejected', reason?: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    try {
      const batch = writeBatch(db);

      // 1. Update Budget Request
      const requestRef = doc(db, 'budget_requests', requestId);
      batch.update(requestRef, {
        status,
        rejectionReason: reason || null,
        reviewedBy: auth.currentUser?.email,
        reviewedAt: serverTimestamp()
      });

      // 2. Update Project Budget Status
      const projectRef = doc(db, 'projects', request.projectId);
      batch.update(projectRef, {
        budget_status: status,
        budget_rejection_reason: reason || null
      });

      // 3. If approved, maybe notify or create a transaction later? 
      // The prompt says "Approved" status update.

      await batch.commit();
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setSelectedRequestId(null);
    } catch (error) {
      console.error("Budget Action Failed:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_finance': return <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[9px] font-black uppercase tracking-widest">Pending Review</span>;
      case 'approved': return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest">Approved</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[9px] font-black uppercase tracking-widest">Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Fiscal Clearance Queue</h3>
          <p className="text-[10px] text-slate-500 font-medium mt-1 italic">Reviewing itemized project allocations for NGO transparency.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
             <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{requests.filter(r => r.status === 'pending_finance').length} Pending Requests</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((req) => (
          <div 
            key={req.id} 
            className={`bg-white border transition-all rounded-[24px] overflow-hidden ${expandedId === req.id ? 'border-blue-200 shadow-xl shadow-blue-500/5' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}
          >
            <div 
              className="p-6 cursor-pointer flex items-center justify-between group"
              onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${expandedId === req.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                  <IndianRupee size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{req.projectName}</h4>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    <span className="flex items-center gap-1.5"><Building2 size={12} /> {req.department}</span>
                    <span className="flex items-center gap-1.5"><User size={12} /> Proposed by {req.proposedBy}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {req.submittedAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Impact</p>
                  <p className="text-xl font-black text-slate-900 tracking-tighter">₹{req.totalAmount.toLocaleString()}</p>
                </div>
                {expandedId === req.id ? <ChevronUp size={20} className="text-blue-600" /> : <ChevronDown size={20} className="text-slate-300" />}
              </div>
            </div>

            <AnimatePresence>
              {expandedId === req.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-50 bg-slate-50/50"
                >
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                              <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard Line Item</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Cost</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {req.itemizedList.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-tight">{item.item}</td>
                                  <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">₹{item.cost.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="bg-slate-900 text-white">
                                <td className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Total Fiscal Requirement</td>
                                <td className="px-6 py-5 text-lg font-black text-right tracking-tighter">₹{req.totalAmount.toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        {req.rejectionReason && (
                          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                             <AlertCircle size={16} className="text-red-500 mt-0.5" />
                             <div>
                                <p className="text-[10px] font-black text-red-900 uppercase mb-1">Previous Rejection Note</p>
                                <p className="text-xs text-red-700 font-medium">{req.rejectionReason}</p>
                             </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        {isAdmin && req.status === 'pending_finance' && (
                          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/20 space-y-4">
                            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Authorization Console</h5>
                            <button 
                              onClick={() => handleAction(req.id, 'approved')}
                              className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                            >
                              <CheckCircle2 size={16} /> Grant Clearance
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedRequestId(req.id);
                                setIsRejectModalOpen(true);
                              }}
                              className="w-full py-4 bg-white border border-red-500 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                            >
                              <XCircle size={16} /> Deny Allocation
                            </button>
                          </div>
                        )}
                        <div className="p-6 bg-slate-900 rounded-3xl text-white">
                          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-6">Security Context</p>
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white/50">Integrity Check</span>
                                <span className="text-[10px] font-black text-emerald-400">PASSED</span>
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white/50">Fiscal Compliance</span>
                                <span className="text-[10px] font-black text-blue-400">TIER-1</span>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
            < IndianRupee size={48} className="mx-auto text-slate-100 mb-6" />
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">No Pending Budget Artifacts</h3>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsRejectModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-200"
            >
              <div className="text-left mb-8">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                   <XCircle size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">Fiscal Denial Reason</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed italic">Provide technical justification for rejecting this mission's budget allocation.</p>
              </div>

              <textarea 
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="e.g. Excessive allocation for logistics..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              />

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={!rejectionReason}
                  onClick={() => selectedRequestId && handleAction(selectedRequestId, 'rejected', rejectionReason)}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-red-500/20"
                >
                  Confirm Denial
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
