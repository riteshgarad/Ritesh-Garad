import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, AlertCircle, Zap, ShieldCheck, 
  MessageSquare, User, Database, ArrowRight
} from 'lucide-react';
import { ActivityLog } from '../types';
import { format } from 'date-fns';

interface GlobalActivityFeedProps {
  logs: ActivityLog[];
}

export const GlobalActivityFeed = ({ logs }: GlobalActivityFeedProps) => {
  const getTypeConfig = (type: ActivityLog['type']) => {
    switch (type) {
      case 'task_completed': return { icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-500' };
      case 'project_updated': return { icon: Zap, bg: 'bg-blue-50', color: 'text-blue-500' };
      case 'finance_unlocked': return { icon: Database, bg: 'bg-amber-50', color: 'text-amber-500' };
      case 'document_verified': return { icon: ShieldCheck, bg: 'bg-purple-50', color: 'text-purple-500' };
      default: return { icon: MessageSquare, bg: 'bg-slate-50', color: 'text-slate-500' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden text-left">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Live Activity Hub</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time mission orchestration feed</p>
        </div>
        <div className="px-4 py-2 bg-slate-900 rounded-full flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
           <span className="text-[8px] font-black text-white uppercase tracking-widest">System Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400 p-10 text-center">
              <Zap size={48} strokeWidth={1} className="mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">Standing by for telemetry...</p>
            </div>
          ) : (
            logs.map((log) => {
              const { icon: Icon, bg, color } = getTypeConfig(log.type);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-start gap-4 p-5 rounded-[2rem] border border-slate-50 hover:border-slate-200 hover:shadow-lg transition-all"
                >
                  <div className={`p-4 rounded-2xl ${bg} ${color} shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {log.projectName ? `${log.projectName} Node` : 'System Architecture'}
                      </p>
                      <span className="text-[8px] font-bold text-slate-300 uppercase">
                        {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'HH:mm:ss') : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-tight">
                      {log.message}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center border border-white shadow-sm overflow-hidden">
                        <User size={10} className="text-slate-400" />
                      </div>
                      <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">
                        {log.userName || 'Automated Protocol'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
