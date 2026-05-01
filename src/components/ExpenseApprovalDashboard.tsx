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
import { doc, updateDoc, serverTimestamp, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { sendEmail } from '../services/emailService';
import { sendPushNotification } from '../lib/push';

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

  const handleApprove = async (request: any) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      // PHASE 1: DATABASE INTEGRITY (Critical)
      const collectionName = request.type === 'budget' ? 'budget_requests' : 'expense_requests';
      const requestRef = doc(db, collectionName, request.id);
      
      const updateData: any = {
        reviewedBy: user.name,
        reviewedAt: serverTimestamp(),
        approvedBy: user.uid,
        approvedAt: serverTimestamp(),
        status: 'approved'
      };

      await updateDoc(requestRef, updateData);

      // If budget request, update project status
      if (request.type === 'budget' && request.projectId) {
        try {
          await updateDoc(doc(db, 'projects', request.projectId), {
            budget_status: 'approved'
          });
        } catch (e) {
          console.warn('Project budget status update failed', e);
        }
      }

      // Create ledger entry in transactions (Existing system)
      await addDoc(collection(db, 'transactions'), {
        type: 'expense',
        amount: request.amount,
        category: request.category || (request.type === 'budget' ? 'Project Budget' : 'Approved Expense'),
        description: `Approved ${request.type} request: ${request.description}`,
        status: 'approved',
        date: serverTimestamp(),
        createdBy: user.uid,
        paymentMethod: 'Bank Transfer',
        expenditureType: 'Mission Operations',
        projectID: request.projectId || '', // Link to mission
        requesterId: request.requesterId || request.requesterUid
      });

      // Update Mission Milestone (Requested Automation)
      if (request.projectId) {
         try {
           const milestonesRef = collection(db, 'milestones');
           const q = query(milestonesRef, where('projectId', '==', request.projectId), where('label', '==', 'Funds Procurement'));
           const milestoneSnap = await getDocs(q);
           if (!milestoneSnap.empty) {
             const mDoc = milestoneSnap.docs[0];
             await updateDoc(doc(db, 'milestones', mDoc.id), {
               isCompleted: true,
               completedAt: serverTimestamp(),
               completedBy: user.name
             });
           }
         } catch (e) {
           console.warn('Milestone update automation failed', e);
         }
      }

      // Create ledger entry in finance (As suggested by user)
      await addDoc(collection(db, 'finance'), {
        type: 'expense',
        amount: request.amount,
        category: request.category || 'General',
        description: `Approved request from ${request.requesterName}`,
        date: serverTimestamp(),
        requesterEmail: request.requesterEmail,
        status: 'approved'
      });

      // Notify requester via in-app notification
      try {
        await addDoc(collection(db, `users/${request.requesterId || request.requesterUid}/notifications`), {
          type: 'approval',
          title: 'Expense Request Approved',
          message: `Your request for ₹${request.amount} has been approved by Finance.`,
          timestamp: serverTimestamp(),
          isRead: false,
          relatedId: request.id
        });
      } catch (e) {
        console.warn('In-app notification failed, but DB update succeeded');
      }

      // Database updates are successful
      toast.success(
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="font-bold">Budget Approved & Entry Recorded</span>
          </div>
        </div>
      );

      // Trigger Push Notification
      const targetUid = request.requesterId || request.requesterUid;
      if (targetUid) {
        sendPushNotification({
          title: 'Finance Authorized 💰',
          message: `Your request for ₹${request.amount} has been approved. Funds are transitioning.`,
          externalIds: [targetUid]
        });
      }

      // PHASE 2: INDEPENDENT EMAIL AUTOMATION
      try {
        await sendEmail({
          requesterEmail: request.requesterEmail,
          amount: request.amount.toString(),
          requesterName: request.requesterName,
          status: 'Approved',
          message: request.professionalMessage || request.description
        });
      } catch (mailError) {
        console.error("[Email Failure] Mobile Diagnostic:", mailError);
        toast("Request saved, but notification email could not be sent.", {
          icon: '⚠️',
          duration: 6000
        });
      }

      setSelectedRequestId(null);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `expense_requests/${request.id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || isProcessing || !rejectionReason.trim()) return;
    const request = selectedRequest as any;
    setIsProcessing(true);
    try {
      // PHASE 1: DATABASE INTEGRITY
      const collectionName = request.type === 'budget' ? 'budget_requests' : 'expense_requests';
      const requestRef = doc(db, collectionName, request.id);
      
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectionReason: rejectionReason,
        reviewedBy: user.name,
        reviewedAt: serverTimestamp()
      });

      // If budget request, update project status
      if (request.type === 'budget' && request.projectId) {
        try {
          await updateDoc(doc(db, 'projects', request.projectId), {
            budget_status: 'rejected',
            budget_rejection_reason: rejectionReason
          });
        } catch (e) {
          console.warn('Project budget status update failed', e);
        }
      }

      // Notify requester via in-app
      try {
        const targetUid = selectedRequest.requesterId || selectedRequest.requesterUid;
        if (targetUid) {
          await addDoc(collection(db, `users/${targetUid}/notifications`), {
            type: 'approval',
            title: 'Expense Request Declined',
            message: `Your request for ₹${selectedRequest.amount} was rejected. Reason: ${rejectionReason}`,
            timestamp: serverTimestamp(),
            isRead: false,
            relatedId: selectedRequest.id
          });
        }
      } catch (e) {
        console.warn('In-app notification failed');
      }

      toast.success(
        <div className="flex items-center gap-2">
          <XCircle size={16} className="text-rose-600" />
          <span className="font-bold">Rejection Logged & Finalized</span>
        </div>
      );

      // Trigger Push Notification
      const targetUid = selectedRequest.requesterId || selectedRequest.requesterUid;
      if (targetUid) {
        sendPushNotification({
          title: 'Finance Warning ⚠️',
          message: `Your budget request for ₹${selectedRequest.amount} was declined. See feedback.`,
          externalIds: [targetUid]
        });
      }

      // PHASE 2: INDEPENDENT EMAIL AUTOMATION
      try {
        await sendEmail({
          requesterEmail: selectedRequest.requesterEmail,
          amount: selectedRequest.amount.toString(),
          requesterName: selectedRequest.requesterName,
          status: 'Rejected',
          reason: rejectionReason,
          message: selectedRequest.professionalMessage || selectedRequest.description
        });
      } catch (mailError) {
        console.error("[Email Failure] Mobile Diagnostic:", mailError);
        toast("Request saved, but notification email could not be sent.", {
          icon: '⚠️',
          duration: 6000
        });
      }

      setIsRejectionModalOpen(false);
      setRejectionReason('');
      setSelectedRequestId(null);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `expense_requests/${selectedRequest.id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative pb-24">
      {/* Inbox View */}
      <div className={cn(
        "flex-1 flex flex-col h-full",
        selectedRequestId && "hidden"
      )}>
        <div className="py-8 sticky top-0 bg-transparent z-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">Authorization Desk</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Security Clearance Level 4 Required</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-12">
          {pendingRequests.length === 0 ? (
            <div className="py-32 text-center flex flex-col items-center gap-4 bg-white/40 rounded-[3rem] border border-slate-200/50 backdrop-blur-sm">
              <ShieldCheck className="text-blue-200" size={80} />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No pending authorizations</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {pendingRequests.map(request => (
                <motion.div
                  key={request.id}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRequestId(request.id)}
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden group cursor-pointer transition-all hover:border-blue-500/30"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/30 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="flex flex-col gap-2">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-extrabold shadow-sm">
                        <Mail size={24} />
                      </div>
                      {(request as any).type === 'budget' && (
                        <div className="px-3 py-1 bg-[#A63A1B] text-white text-[8px] font-black uppercase rounded-lg w-fit shadow-lg shadow-[#A63A1B]/20">
                          Project Budget
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 font-mono">VERIFICATION REQ</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{request.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className="text-lg font-black text-slate-900 leading-tight mb-2 tracking-tight group-hover:text-blue-600 transition-colors">{request.description}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                       Operative: {request.requesterName}
                    </p>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest font-mono">Awaiting Signature</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail "Bottom Sheet" Style View */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedRequestId(null)}
                className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500"
              >
                <ArrowLeft size={20} />
              </motion.button>
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">Strategy Clearance</h3>
              <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white text-2xl font-black shadow-lg">
                  {selectedRequest.requesterName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedRequest.requesterName}</h2>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{selectedRequest.department} Sector</p>
                </div>
              </div>

              {/* Message */}
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-blue-50 relative">
                <Mail className="absolute top-4 right-4 text-blue-100/50" size={32} />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Transmission Content</h4>
                <div className="prose prose-sm text-slate-600 font-medium leading-relaxed italic">
                  "{selectedRequest.professionalMessage || "Strategy details encrypted or omitted."}"
                </div>
              </div>

              {/* Amount Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Request</p>
                  <p className="text-xl font-black text-slate-900">₹{selectedRequest.amount.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Request Type</p>
                  <p className="text-xs font-black text-slate-900 uppercase">{selectedRequest.category || 'General'}</p>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-amber-50 rounded-2xl flex gap-3 border border-amber-100">
                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                <p className="text-[10px] font-bold text-amber-800 leading-normal uppercase tracking-tight">
                  Authorization will result in immediate fund dispersal. Verify mission alignment before execution.
                </p>
              </div>
            </div>

            {/* Fixed Action Hub */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex gap-4 pb-10">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleApprove(selectedRequest)}
                className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20"
              >
                Approve Funds
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsRejectionModalOpen(true)}
                className="flex-1 bg-rose-50 text-rose-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs border border-rose-100"
              >
                Reject Request
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
