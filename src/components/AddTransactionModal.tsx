import React, { useState } from 'react';
import { X, Upload, DollarSign, Tag, Calendar, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../App';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: any[];
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, projects = [] }) => {
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: '',
    projectID: '',
    donationType: 'One-time' as any,
    expenditureType: 'Procurement' as any,
    paymentMethod: 'Bank Transfer' as any,
    description: '',
    receiptURL: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        projectID: formData.projectID || null,
        donationType: formData.type === 'income' ? formData.donationType : 'N/A',
        expenditureType: formData.type === 'expense' ? formData.expenditureType : 'N/A',
        paymentMethod: formData.paymentMethod,
        status: 'pending',
        receiptURL: formData.receiptURL,
        date: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });
      onClose();
      setFormData({
        type: 'income',
        amount: '',
        category: '',
        projectID: '',
        donationType: 'One-time',
        expenditureType: 'Procurement',
        paymentMethod: 'Bank Transfer',
        description: '',
        receiptURL: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="relative bg-white w-full max-w-xl rounded-t-[32px] md:rounded-[24px] shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Log Transaction</h3>
            <p className="text-xs text-slate-500 font-medium tracking-tight">NGO Financial Registry Protocol</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income' })}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                formData.type === 'income' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Income / Credit
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense' })}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                formData.type === 'expense' 
                ? 'bg-white text-rose-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Expense / Debit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <DollarSign size={10} /> Amount (INR)
              </label>
              <input 
                required
                type="number"
                step="0.01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Tag size={10} /> Category
              </label>
              <input 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="e.g. Donation, Rent"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <CreditCard size={10} /> Payment Method
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Online Gateway">Online Gateway</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Calendar size={10} /> Related Project
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.projectID}
                onChange={e => setFormData({ ...formData, projectID: e.target.value })}
              >
                <option value="">None / General</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.type === 'income' ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Donation Type</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.donationType}
                onChange={e => setFormData({ ...formData, donationType: e.target.value as any })}
              >
                <option value="One-time">One-time</option>
                <option value="Monthly">Monthly</option>
                <option value="Corporate">Corporate</option>
                <option value="In-kind">In-kind</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Expenditure Type</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={formData.expenditureType}
                onChange={e => setFormData({ ...formData, expenditureType: e.target.value as any })}
              >
                <option value="Procurement">Procurement</option>
                <option value="Travel">Travel</option>
                <option value="Event Setup">Event Setup</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
              <Upload size={10} /> Receipt Evidence (URL)
            </label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none"
              placeholder="https://firebasestorage.googleapis.com/..."
              value={formData.receiptURL}
              onChange={e => setFormData({ ...formData, receiptURL: e.target.value })}
            />
          </div>

          <button
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-4 rounded-xl text-sm font-black uppercase tracking-[0.1em] hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? 'Logging Transaction...' : 'Commit to Ledger'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddTransactionModal;
