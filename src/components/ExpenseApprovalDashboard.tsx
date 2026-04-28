import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Mail, 
  IndianRupee, 
  Calendar, 
  User, 
  Building2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ExpenseRequest, AppUser } from '../types';
import { db } from '../App';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface ExpenseApprovalDashboardProps {
  user: AppUser;
  requests: ExpenseRequest[];
}

export default function ExpenseApprovalDashboard({ user, requests }: ExpenseApprovalDashboardProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  const handleApprove = async (request: ExpenseRequest) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const requestRef = doc(db, 'expense_requests', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedBy: user.name,
        reviewedAt: serverTimestamp()
      });

      // Create ledger entry
      await addDoc(collection(db, 'transactions'), {
        type: 'expense',
        amount: request.amount,
        category: 'Approved Expense',
        description: `Expense approved for ${request.requesterName}: ${request.description}`,
        status: 'cleared',
        date: serverTimestamp(),
        createdBy: user.uid,
        paymentMethod: 'Bank Transfer',
        expenditureType: 'General',
        requesterId: request.requesterId
      });

      // Notify requester
      await addDoc(collection(db, `users/${request.requesterId}/notifications`), {
        type: 'approval',
        title: 'Expense Request Approved',
        message: `Your request for ₹${request.amount} has been approved by Finance.`,
        timestamp: serverTimestamp(),
        isRead: false,
        relatedId: request.id
      });

      toast.success('Expense Strategy Approved and Logged');
      setSelectedRequestId(null);
    } catch (error: any) {
      console.error(error);
      toast.error('Approval Protocol Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || isProcessing || !rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      const requestRef = doc(db, 'expense_requests', selectedRequest.id);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectionReason: rejectionReason,
        reviewedBy: user.name,
        reviewedAt: serverTimestamp()
      });

      // Notify requester
      await addDoc(collection(db, `users/${selectedRequest.requesterId}/notifications`), {
        type: 'approval',
        title: 'Expense Request Declined',
        message: `Your request for ₹${selectedRequest.amount} was rejected. Reason: ${rejectionReason}`,
        timestamp: serverTimestamp(),
        isRead: false,
        relatedId: selectedRequest.id
      });

      toast.success('Rejection Finalized');
      setIsRejectionModalOpen(false);
      setRejectionReason('');
      setSelectedRequestId(null);
    } catch (error: any) {
      console.error(error);
      toast.error('Rejection Protocol Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50 overflow-hidden">
      {/* Left Sidebar: Inbox List */}
      <div className={cn(
        "w-full lg:w-[400px] border-r border-slate-200 bg-white flex flex-col h-full",
        selectedRequestId && "hidden lg:flex"
      )}>
        <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={20} />
              Approval Center
            </h2>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              {pendingRequests.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium italic">Mission-critical fiscal authorizations</p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-slate-200" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest">Awaiting New Signals</p>
            </div>
          ) : (
            pendingRequests.map(request => (
              <motion.div
                key={request.id}
                layoutId={request.id}
                onClick={() => setSelectedRequestId(request.id)}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                  selectedRequestId === request.id 
                    ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-600/20" 
                    : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg"
                )}
              >
                {selectedRequestId === request.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
                  />
                )}
                
                <div className="flex justify-between items-start mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm",
                    selectedRequestId === request.id ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                  )}>
                    {request.requesterName.charAt(0)}
                  </div>
                  <div className={cn(
                    "text-lg font-black flex items-center",
                    selectedRequestId === request.id ? "text-white" : "text-slate-900"
                  )}>
                    <IndianRupee size={16} />
                    {request.amount.toLocaleString()}
                  </div>
                </div>

                <div>
                  <h4 className={cn(
                    "text-sm font-bold truncate",
                    selectedRequestId === request.id ? "text-white" : "text-slate-800"
                  )}>
                    {request.description}
                  </h4>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mt-1",
                    selectedRequestId === request.id ? "text-blue-100" : "text-slate-400"
                  )}>
                    From: {request.requesterName} • {request.department}
                  </p>
                </div>
                
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                   <div className={cn(
                    "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em]",
                    selectedRequestId === request.id ? "text-white/70" : "text-slate-400"
                  )}>
                    <Calendar size={10} />
                    {request.submittedAt?.seconds ? format(new Date(request.submittedAt.seconds * 1000), 'MMM dd, HH:mm') : 'Recent'}
                  </div>
                  <ChevronRight size={14} className={cn(
                    "transition-transform group-hover:translate-x-1",
                    selectedRequestId === request.id ? "text-white" : "text-slate-300"
                  )} />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right Content: Detail View */}
      <div className={cn(
        "flex-1 bg-white flex flex-col h-full",
        !selectedRequestId && "hidden lg:flex items-center justify-center bg-slate-50/50"
      )}>
        <AnimatePresence mode="wait">
          {selectedRequest ? (
            <motion.div
              key={selectedRequest.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="p-4 lg:p-10 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                <button 
                  onClick={() => setSelectedRequestId(null)}
                  className="lg:hidden p-3 rounded-xl bg-slate-50 text-slate-600 active:scale-95"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1 lg:flex-none text-center lg:text-left">
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                    Mission Request Review
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-2">
                    ID: {selectedRequest.id.slice(0, 8).toUpperCase()} • SECURE PROTOCOL
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-3">
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <IndianRupee size={14} />
                    {selectedRequest.amount} AVAILABLE
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 lg:p-12">
                <div className="max-w-3xl mx-auto space-y-10">
                  {/* Requester Profile */}
                  <div className="flex flex-col md:flex-row gap-8 items-start pb-10 border-b border-dashed border-slate-200">
                    <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-600/20">
                      {selectedRequest.requesterName.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{selectedRequest.requesterName}</h4>
                        <p className="text-blue-600 font-bold tracking-tight">{selectedRequest.requesterEmail}</p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
                          <Building2 size={12} className="text-blue-500" />
                          Department: {selectedRequest.department}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
                          <Target size={12} className="text-emerald-500" />
                          Role: Volunteer
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="bg-[#fcfdfe] border border-blue-50 rounded-[32px] p-8 lg:p-12 relative overflow-hidden ring-1 ring-blue-600/5">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20" />
                    <Mail className="absolute top-8 right-8 text-blue-100" size={48} />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Secure Mail Stream</span>
                      </div>
                      
                      <h5 className="text-xl font-bold text-slate-800 mb-6 leading-relax">
                        "Re: Request for Project Expense Authorization - {selectedRequest.description}"
                      </h5>

                      <div className="prose prose-slate max-w-none text-slate-600 leading-8 whitespace-pre-wrap font-medium">
                        {selectedRequest.professionalMessage || "No detailed strategy provided."}
                      </div>

                      <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Fiscal Impact</p>
                          <div className="text-3xl font-black text-slate-900 flex items-center">
                            <IndianRupee size={24} />
                            {selectedRequest.amount.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Verification Hash</p>
                          <p className="text-[10px] font-mono text-blue-500 font-bold lowercase tracking-tight">
                            vset_{Math.random().toString(36).substring(2, 10)}_auth
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warning Section */}
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                    <AlertCircle className="text-amber-500 shrink-0" size={24} />
                    <div>
                      <h6 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Authorization Guard</h6>
                      <p className="text-xs text-amber-700 font-medium leading-relaxed">
                        By click "Approve", you are releasing real donor funds to this operative. Ensure the description aligns with active campaign goals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Hub */}
              <div className="p-8 lg:p-10 border-t border-slate-100 bg-white bg-opacity-80 backdrop-blur-md relative z-10">
                <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4">
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={isProcessing}
                    className="flex-1 py-5 rounded-[20px] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? 'Processing...' : (
                      <>
                        <CheckCircle2 size={20} />
                        Approve Expense
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsRejectionModalOpen(true)}
                    disabled={isProcessing}
                    className="flex-1 py-5 rounded-[20px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 border border-rose-100"
                  >
                    <XCircle size={20} />
                    Reject Request
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-slate-300">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6">
                <MessageSquare size={40} className="text-slate-200" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-[0.3em] text-slate-400">Communication Silent</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] mt-2">Select a transmission from the relay to review</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {isRejectionModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRejectionModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">Rejection Log</h3>
              <p className="text-xs text-slate-500 font-medium mb-8 italic">Provide the mission reason for field team feedback.</p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for declining funds (Required)..."
                className="w-full h-40 p-6 bg-slate-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-rose-500 transition-all resize-none outline-none"
              />

              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || isProcessing}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setIsRejectionModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Target = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
