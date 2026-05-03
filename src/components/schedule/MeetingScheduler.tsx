import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Video, Globe, Target, Shield, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

interface MeetingSchedulerProps {
  onClose: () => void;
  onSave: (data: any) => void;
  currentUser: any;
}

export const MeetingScheduler = ({ onClose, onSave, currentUser }: MeetingSchedulerProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [type, setType] = useState<'global' | 'mission' | 'departmental'>('global');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [selectedDept, setSelectedDept] = useState(currentUser.department || 'Operations');
  const [meetingLink, setMeetingLink] = useState('');
  
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, 'projects'), where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'projects');
      }
    };
    fetchProjects();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    onSave({
      title,
      description,
      start: startDateTime,
      end: endDateTime,
      type,
      projectId: type === 'mission' ? selectedProjectId : '',
      projectName: type === 'mission' ? selectedProjectName : '',
      dept: type === 'departmental' ? selectedDept : '',
      meetingLink,
      createdBy: currentUser.uid,
      creatorName: currentUser.name,
      attendees: { [currentUser.uid]: 'going' },
      createdAt: new Date()
    });
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-terracotta/5 rounded-2xl flex items-center justify-center text-terracotta">
            <CalendarIcon size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-sm font-black text-mahogany uppercase tracking-widest">Schedule Initiative</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">New Mission Pulse</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Title</label>
          <input 
            required
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-mahogany placeholder:text-slate-300 focus:ring-2 focus:ring-terracotta/10 transition-all shadow-inner"
            placeholder="e.g., Monthly Field Strategy"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Type Selector */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission Scope</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'global', icon: Globe, label: 'Global' },
              { id: 'mission', icon: Target, label: 'Mission' },
              { id: 'departmental', icon: Shield, label: 'Dept' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as any)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all",
                  type === t.id 
                    ? "bg-terracotta border-terracotta text-white shadow-xl shadow-terracotta/20 scale-[1.02]" 
                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                )}
              >
                <t.icon size={20} />
                <span className="text-[9px] font-black uppercase tracking-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Context-specific Dropdowns */}
        <AnimatePresence mode="wait">
          {type === 'mission' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link to Active Mission</label>
              <div className="relative">
                <select 
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-mahogany appearance-none focus:ring-2 focus:ring-terracotta/10 transition-all shadow-inner px-12"
                  value={selectedProjectId}
                  onChange={e => {
                    setSelectedProjectId(e.target.value);
                    setSelectedProjectName(projects.find(p => p.id === e.target.value)?.name || '');
                  }}
                >
                  <option value="">Select Project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-terracotta/40" />
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              </div>
            </motion.div>
          )}

          {type === 'departmental' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department Scope</label>
              <div className="relative">
                <select 
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-mahogany appearance-none focus:ring-2 focus:ring-terracotta/10 transition-all shadow-inner px-12"
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                >
                  {['Finance', 'Operations', 'Marketing', 'HR', 'Legal', 'General'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-terracotta/40" />
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date & Time */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission Date</label>
            <div className="relative">
              <input 
                type="date"
                required
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-mahogany appearance-none focus:ring-2 focus:ring-terracotta/10 transition-all shadow-inner px-12"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
              <CalendarIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-terracotta/40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Pulse</label>
              <div className="relative">
                <input 
                  type="time"
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-mahogany appearance-none focus:ring-2 focus:ring-terracotta/10 transition-all shadow-inner px-12"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
                <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-terracotta/40" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Pulse</label>
              <div className="relative">
                <input 
                  type="time"
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-mahogany appearance-none focus:ring-2 focus:ring-terracotta/10 transition-all shadow-inner px-12"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
                <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-terracotta/40" />
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Link */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Link (Optional)</label>
          <div className="relative">
            <input 
              className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm font-bold text-mahogany placeholder:text-slate-300 focus:ring-2 focus:ring-terracotta/10 transition-all shadow-inner px-12"
              placeholder="e.g., https://meet.google.com/..."
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
            />
            <Video size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-terracotta/40" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Briefing Memo</label>
          <textarea 
            rows={3}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-mahogany placeholder:text-slate-300 focus:ring-2 focus:ring-terracotta/10 transition-all shadow-inner"
            placeholder="Outline the mission objectives..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </form>

      <div className="p-6 border-t border-slate-50 bg-white/80 backdrop-blur-md sticky bottom-0 z-10 pb-safe">
        <button 
          onClick={handleSubmit}
          className="w-full bg-terracotta text-white py-4 rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-terracotta/20 active:scale-95 transition-all"
        >
          Confirm Schedule
        </button>
      </div>
    </div>
  );
};
