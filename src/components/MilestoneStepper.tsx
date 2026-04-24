import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Clock, Plus, ChevronRight, X } from 'lucide-react';
import { Milestone } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface MilestoneStepperProps {
  milestones: Milestone[];
  onToggle: (id: string, status: string) => void;
  onAdd: (data: any) => void;
  canEdit: boolean;
}

export const MilestoneStepper = ({ milestones, onToggle, onAdd, canEdit }: MilestoneStepperProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const sortedMilestones = [...milestones].sort((a, b) => {
    // Simple sort for now, could use a sequence number or date
    return (a.id > b.id) ? 1 : -1;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAdd({ title: newTitle.trim() });
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      <div className="relative">
        {/* Background connector line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100" />
        
        {/* Progressing connector line */}
        {sortedMilestones.length > 1 && (
            <motion.div 
                className="absolute left-[19px] top-4 w-0.5 bg-blue-600 origin-top"
                initial={{ scaleY: 0 }}
                animate={{ 
                    scaleY: sortedMilestones.filter(m => m.status === 'completed').length / (sortedMilestones.length || 1)
                }}
                transition={{ duration: 1, ease: "easeInOut" }}
                style={{ height: 'calc(100% - 32px)' }}
            />
        )}

        <div className="space-y-8">
          {sortedMilestones.map((m, idx) => (
            <div key={m.id} className="relative flex gap-6 group">
              <div className="relative z-10 flex flex-col items-center">
                <button
                  disabled={!canEdit}
                  onClick={() => onToggle(m.id, m.status)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    m.status === 'completed' 
                      ? "bg-blue-600 text-white shadow-blue-500/20 scale-110" 
                      : "bg-white border border-slate-200 text-slate-300 hover:border-blue-400 group-hover:scale-105"
                  )}
                >
                  {m.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
              </div>

              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "text-[11px] font-black uppercase tracking-widest transition-colors",
                    m.status === 'completed' ? "text-slate-900" : "text-slate-400"
                  )}>
                    {m.title}
                  </h4>
                  {m.status === 'completed' && m.completedAt && (
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          Done {format(m.completedAt.toDate ? m.completedAt.toDate() : new Date(m.completedAt), 'MMM d')}
                      </span>
                  )}
                </div>
                <p className="text-[9px] font-medium text-slate-400 mt-1 max-w-md leading-relaxed italic">
                  {m.description || "Operational objective pending stabilization."}
                </p>
              </div>
            </div>
          ))}

          {sortedMilestones.length === 0 && (
              <div className="py-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-100 italic text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  No mission protocols defined
              </div>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="pt-4 border-t border-slate-50">
          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleAdd}
                className="flex items-center gap-3"
              >
                <input 
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Define new objective..."
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button type="submit" className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 active:scale-90 transition-all">
                  <ChevronRight size={16} />
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all">
                  <X size={16} />
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setIsAdding(true)}
                className="w-full py-4 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-blue-500 hover:border-blue-200 transition-all active:scale-95"
              >
                <Plus size={14} /> Establish New Protocol
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
