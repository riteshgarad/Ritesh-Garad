import React from 'react';
import { motion } from 'motion/react';
import { Zap, FileText, Settings, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ActionGridProps {
  onAnalyze: () => void;
  onProtocolLog: () => void;
  onEdit: () => void;
  onTerminate: () => void;
  isAdmin?: boolean;
}

export const ActionGrid = ({ onAnalyze, onProtocolLog, onEdit, onTerminate, isAdmin }: ActionGridProps) => {
  return (
    <div className="space-y-4">
      {/* Primary Action */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onAnalyze}
        className="w-full py-5 bg-terracotta text-white rounded-[2rem] shadow-xl shadow-terracotta/20 flex items-center justify-center gap-3 active:bg-mahogany transition-colors"
      >
        <Zap size={20} className="fill-white" />
        <span className="text-sm font-black uppercase tracking-widest">Analyze Impact</span>
      </motion.button>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onProtocolLog}
          className="flex flex-col items-center justify-center p-6 bg-white border border-mahogany/10 rounded-[2rem] gap-2 active:bg-slate-50 transition-colors"
        >
          <FileText size={24} className="text-mahogany" />
          <span className="text-[10px] font-black text-mahogany uppercase tracking-widest">Protocol Log</span>
        </button>
        <button
          onClick={onEdit}
          className="flex flex-col items-center justify-center p-6 bg-white border border-mahogany/10 rounded-[2rem] gap-2 active:bg-slate-50 transition-colors"
        >
          <Settings size={24} className="text-mahogany" />
          <span className="text-[10px] font-black text-mahogany uppercase tracking-widest">Edit Mission</span>
        </button>
      </div>

      {/* Danger Zone */}
      {isAdmin && (
        <button
          onClick={onTerminate}
          className="w-full mt-4 py-4 border border-red-200 rounded-[1.5rem] flex items-center justify-center gap-2 group active:bg-red-50 transition-colors"
        >
          <Trash2 size={16} className="text-red-400 group-hover:text-red-600" />
          <span className="text-[10px] font-bold text-red-400 group-hover:text-red-600 uppercase tracking-widest">Terminate Mission</span>
        </button>
      )}
    </div>
  );
};
