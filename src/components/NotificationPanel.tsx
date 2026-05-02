import React from 'react';
import { motion } from 'motion/react';
import { Bell, X, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppNotification } from '../types';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationPanel = ({ 
  notifications, 
  onClose, 
  onMarkAsRead, 
  onClearAll 
}: NotificationPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="fixed md:absolute right-0 md:right-0 inset-x-4 md:inset-x-auto top-24 md:top-0 w-auto md:w-80 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Notification Terminal</h3>
        <div className="flex gap-4">
          <button 
            onClick={onClearAll}
            className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
          >
            Clear
          </button>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-slate-600">
            <Bell size={32} className="mb-2 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No Active Signals</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={cn(
                  "p-4 transition-colors hover:bg-white/[0.02] relative cursor-pointer",
                  !n.isRead && "bg-blue-600/[0.05]"
                )}
                onClick={() => onMarkAsRead(n.id)}
              >
                {!n.isRead && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                )}
                <div className="flex gap-3">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0 border",
                    n.type === 'deadline' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                    n.type === 'milestone' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  )}>
                    {n.type === 'deadline' ? <Clock size={14} /> : n.type === 'milestone' ? <TrendingUp size={14} /> : <AlertCircle size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[10px] font-bold text-white uppercase tracking-wider leading-tight">{n.title}</h5>
                    <p className="text-xs text-slate-400 mt-1 leading-normal tracking-tight">{n.message}</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase mt-2 tracking-widest">{n.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 bg-white/[0.01] border-t border-white/5 text-center">
        <button className="text-[9px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-[0.2em]">
          Access Full Log History
        </button>
      </div>
    </motion.div>
  );
};
