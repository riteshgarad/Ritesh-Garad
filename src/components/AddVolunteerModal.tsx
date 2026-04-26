import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, Award, Clock, ShieldCheck, Upload, Trash2, CheckCircle2 } from 'lucide-react';

interface AddVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

const SKILLS_OPTIONS = ['Teaching', 'Medical', 'Logistics', 'Marketing', 'Fundraising', 'Social Media', 'Design', 'Public Relations', 'Photography', 'Video Editing'];
const DEPARTMENTS = ['Social Media', 'Public Relations', 'Finance', 'Operations', 'Marketing', 'HR', 'Legal', 'General'];

export const AddVolunteerModal = ({ isOpen, onClose, onSubmit, isLoading }: AddVolunteerModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Admin',
    skills: [] as string[],
    availability: 'Full-time',
    status: 'Active' as const,
    idProofUrl: 'https://placehold.co/600x400?text=ID+Proof+Verified'
  });

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Onboard Operative</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resource Management Protocol</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
              {/* Basic Info Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" 
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                      required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" 
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" 
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Assignment Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                  <select 
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  >
                    {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  >
                    <option value="Active">Active / Verified</option>
                    <option value="Pending">Pending Verification</option>
                    <option value="On Break">On Leave / Break</option>
                  </select>
                </div>
              </div>

              {/* Skills Multi-select */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        formData.skills.includes(skill)
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* ID Proof Section */}
              <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Upload size={16} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">ID Verification Proof</span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-500 rounded-lg text-[8px] font-black uppercase tracking-widest">Aadhar/Voter ID Required</span>
                </div>
                <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-slate-400 hover:text-indigo-500 hover:border-indigo-200 transition-all cursor-pointer">
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 size={24} className="text-indigo-200" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">File Verified (AADH-XXXX)</span>
                  </div>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="pt-6 border-t border-slate-50">
                <button 
                  disabled={isLoading}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95 disabled:bg-slate-200"
                >
                  {isLoading ? 'Synchronizing Data...' : 'Confirm Operative Registration'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
