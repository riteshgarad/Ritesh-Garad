import React from 'react';
import { motion } from 'motion/react';
import { Zap, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VelocityGaugeProps {
  progress: number;
}

export const VelocityGauge = ({ progress }: VelocityGaugeProps) => {
  const radius = 80;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI; // Arc is 180 degrees
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center p-6 bg-white rounded-[2.5rem] shadow-soft border border-mahogany/5">
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-terracotta" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mission Velocity</h3>
        </div>
        <div className="px-3 py-1 bg-terracotta/5 rounded-full">
          <span className="text-[10px] font-black text-terracotta tracking-tighter">{progress}% SYNC</span>
        </div>
      </div>

      <div className="relative w-full aspect-[2/1] overflow-hidden flex items-end justify-center">
        <svg viewBox={`0 0 ${radius * 2} ${radius}`} className="w-full transform translate-y-2">
          {/* Background Arc */}
          <path
            d={`M ${strokeWidth/2},${radius} A ${normalizedRadius},${normalizedRadius} 0 0,1 ${radius * 2 - strokeWidth/2},${radius}`}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <motion.path
            d={`M ${strokeWidth/2},${radius} A ${normalizedRadius},${normalizedRadius} 0 0,1 ${radius * 2 - strokeWidth/2},${radius}`}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: "easeOut" }}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A63A1B" />
              <stop offset="100%" stopColor="#4A1412" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
           <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="flex items-baseline gap-1"
           >
             <span className="text-4xl font-black text-mahogany tracking-tighter leading-none">{progress}</span>
             <span className="text-lg font-black text-mahogany/30">%</span>
           </motion.div>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Completion Index</p>
        </div>
      </div>
      
      <div className="w-full h-px bg-slate-50 my-6" />
      
      <div className="grid grid-cols-2 w-full gap-4">
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</span>
          <span className="text-[10px] font-black text-mahogany uppercase tracking-tight">
            {progress === 100 ? 'Mission Clear' : progress > 70 ? 'Operational' : progress > 30 ? 'In Motion' : 'Initializing'}
          </span>
        </div>
        <div className="flex flex-col items-center border-l border-slate-100">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Impact</span>
          <span className="text-[10px] font-black text-terracotta uppercase tracking-tight">
            {progress > 50 ? 'High Positive' : 'Scaling'}
          </span>
        </div>
      </div>
    </div>
  );
};
