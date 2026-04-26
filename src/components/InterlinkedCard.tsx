import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, Lock, Clock, User, 
  Database, Zap, Shield, Folder, 
  Camera, ArrowRight, MessageSquare,
  Megaphone
} from 'lucide-react';
import { Task, TaskStatus, TaskCategory } from '../types';

interface InterlinkedCardProps {
  task: Task;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onUploadProof: (id: string) => void;
  isClickable?: boolean;
}

export const InterlinkedCard = ({ task, onStatusChange, onUploadProof, isClickable = true }: InterlinkedCardProps) => {
  if (!task) return null;

  const statusConfig: Record<TaskStatus, { icon: any; color: string; bg: string; label: string }> = {
    locked: { icon: Lock, color: 'text-slate-400', bg: 'bg-slate-100', label: 'Locked' },
    todo: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'To Do' },
    in_progress: { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Processing' },
    done: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Completed' },
  };

  const deptConfig: Record<TaskCategory, { icon: any; color: string }> = {
    Finance: { icon: Database, color: 'text-emerald-600' },
    Operations: { icon: Zap, color: 'text-blue-600' },
    Marketing: { icon: MessageSquare, color: 'text-purple-600' },
    'Social Media': { icon: Camera, color: 'text-pink-500' },
    'Public Relations': { icon: Megaphone, color: 'text-purple-600' },
    HR: { icon: User, color: 'text-orange-600' },
    Legal: { icon: Shield, color: 'text-red-600' },
    General: { icon: Folder, color: 'text-slate-600' },
  };

  const config = statusConfig[task.status] || statusConfig.todo;
  const StatusIcon = config.icon;
  const DeptIcon = (deptConfig[task.assignedDept] || deptConfig.General).icon;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'locked') return;
    
    if (task.status === 'todo') onStatusChange(task.id, 'in_progress');
    else if (task.status === 'in_progress') {
      if (task.proofRequired && !task.relatedDocId) {
        onUploadProof(task.id);
      } else {
        onStatusChange(task.id, 'done');
      }
    }
  };

  return (
    <motion.div
      layout
      className={`group bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 ${
        task.status === 'locked' ? 'opacity-60 grayscale' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-slate-50 rounded-full flex items-center gap-2 border border-slate-100">
             <DeptIcon size={12} className={(deptConfig[task.assignedDept] || deptConfig.General).color} />
             <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">{task.assignedDept || 'General'}</span>
          </div>
          {task.projectName && (
            <div className="px-3 py-1.5 bg-slate-900 rounded-full flex items-center gap-2 shadow-lg shadow-slate-200">
               <Folder size={10} className="text-slate-300" />
               <span className="text-[8px] font-black text-white uppercase tracking-widest truncate max-w-[80px]">{task.projectName}</span>
            </div>
          )}
        </div>
        
        <div className={`p-2 rounded-xl ${config.bg}`}>
          <StatusIcon size={16} className={config.color} />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
          {task.title}
        </h4>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic line-clamp-2">
          {task.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
            {task.assignedVolunteerId ? (
              <span className="text-[9px] font-black text-slate-900 uppercase">{task.assignedVolunteerName?.charAt(0) || 'V'}</span>
            ) : (
              <User size={14} className="text-slate-400" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">
              {task.assignedVolunteerName?.split(' ')[0] || 'Unassigned'}
            </span>
            <div className="flex items-center gap-1">
              <Zap size={8} className="text-amber-500 fill-amber-500" />
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Impact: +{task.impactValue}</span>
            </div>
          </div>
        </div>

        <button
          disabled={task.status === 'locked' || task.status === 'done'}
          onClick={handleAction}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
            task.status === 'done' 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
              : task.status === 'locked'
              ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed'
              : 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:scale-105 active:scale-95'
          }`}
        >
          {task.status === 'done' ? (
            <>Verified <CheckCircle2 size={12} /></>
          ) : task.status === 'todo' ? (
            <>Deploy <ArrowRight size={12} /></>
          ) : task.proofRequired && !task.relatedDocId ? (
            <>Upload Proof <Camera size={12} /></>
          ) : (
            <>Complete <Zap size={12} /></>
          )}
        </button>
      </div>
      
      {task.budget && (
        <div className="mt-4 p-3 bg-blue-50/50 rounded-2xl flex items-center justify-between border border-blue-50">
          <div className="flex items-center gap-2">
            <Database size={10} className="text-blue-600" />
            <span className="text-[8px] font-black text-blue-900 uppercase tracking-widest">Budget Locked</span>
          </div>
          <span className="text-[9px] font-black text-blue-900">${task.budget.toLocaleString()}</span>
        </div>
      )}
    </motion.div>
  );
};
