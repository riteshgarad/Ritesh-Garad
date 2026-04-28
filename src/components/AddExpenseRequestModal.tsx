import React, { useState } from 'react';
import { 
  X, 
  IndianRupee, 
  FileText, 
  MessageSquare,
  ShieldCheck,
  Send,
  Building2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../App';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AppUser } from '../types';
import { toast } from 'react-hot-toast';

interface AddExpenseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
}

export default function AddExpenseRequestModal({ isOpen, onClose, user }: AddExpenseRequestModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    professionalMessage: '',
    department: user.department || 'General'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.amount || !formData.description || !formData.professionalMessage) {
      toast.error('Mission Protocol: All fields are mandatory');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'expense_requests'), {
        requesterId: user.uid,
        requesterName: user.name,
        requesterEmail: user.email,
        department: formData.department,
        amount: parseFloat(formData.amount),
        description: formData.description,
        professionalMessage: formData.professionalMessage,
        status: 'pending',
        submittedAt: serverTimestamp()
      });

      toast.success('Expense Transaction Transmitted to Finance');
      setFormData({
        amount: '',
        description: '',
        professionalMessage: '',
        department: user.department || 'General'
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Signal Error: Transmission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="text-left">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={24} />
              Expense Authorization Request
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Formal Financial Deployment Protocol</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fiscal Impact (Amount)</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                <input 
                  type="number"
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Operational Sector</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                >
                  {['Finance', 'Operations', 'Marketing', 'HR', 'Legal', 'Social Media', 'Public Relations', 'General'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mission Context (Description)</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
              <input 
                required
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                placeholder="e.g. Travel tickets for Satara Field Visit"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Strategy Communication</label>
              <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Mail Draft Format</span>
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 text-blue-400 opacity-40" size={18} />
              <textarea 
                required
                rows={6}
                className="w-full bg-slate-50 border-none rounded-[32px] pl-12 pr-8 py-6 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none leading-relaxed"
                placeholder="Draft your professional message to the Finance Head here..."
                value={formData.professionalMessage}
                onChange={e => setFormData({ ...formData, professionalMessage: e.target.value })}
              />
            </div>
            <p className="text-[9px] text-slate-400 font-bold px-4 italic">Note: This will be reviewed as a formal request by the Finance Head (Yukta).</p>
          </div>

          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
             <ShieldCheck className="text-blue-600 shrink-0" size={24} />
             <div className="text-left">
               <h6 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Authorization Note</h6>
               <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                 All requests are logged in the secure foundation stream. Fraudulent entries will trigger immediate audit protocols.
               </p>
             </div>
          </div>
        </form>

        <div className="p-8 border-t border-slate-100 bg-white sticky bottom-0">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-xs"
          >
            {isSubmitting ? 'Transmitting...' : (
              <>
                <Send size={18} />
                Transmit Request to Finance
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
