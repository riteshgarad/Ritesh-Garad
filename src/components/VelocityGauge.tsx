import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Zap, AlertTriangle, TrendingUp } from 'lucide-react';

interface VelocityGaugeProps {
  progress: number; // 0 to 100
  timeElapsed: number; // 0 to 100 (percentage of project period passed)
  status?: string;
  className?: string;
}

export const VelocityGauge = ({ progress, timeElapsed, status, className }: VelocityGaugeProps) => {
  const isDelayed = timeElapsed > progress + 15; // Margin of 15%
  const isOptimal = Math.abs(progress - timeElapsed) <= 15;
  const isAhead = progress > timeElapsed + 15;

  const color = isDelayed ? 'text-red-500' : isAhead ? 'text-emerald-500' : 'text-blue-600';
  const bgColor = isDelayed ? 'text-red-50' : isAhead ? 'text-emerald-50' : 'text-blue-50';
  const strokeColor = isDelayed ? '#ef4444' : isAhead ? '#10b981' : '#2563eb';

  // For the gauge, we use a semi-circle path
  // SVG Path for arc: M 10 90 A 80 80 0 0 1 170 90
  const radius = 60;
  const circumference = Math.PI * radius; // Semi-circle
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div className="relative w-48 h-32 flex items-end justify-center overflow-hidden">
        <svg viewBox="0 0 140 80" className="w-full h-full">
          {/* Base Track */}
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress Track */}
          <motion.path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "circOut" }}
            style={{ strokeDasharray: circumference }}
          />
          
          {/* Time Marker (Optional marker showing where time is) */}
          <motion.circle
            cx={70 - 60 * Math.cos((timeElapsed / 100) * Math.PI)}
            cy={70 - 60 * Math.sin((timeElapsed / 100) * Math.PI)}
            r="4"
            fill="#94a3b8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          />
        </svg>

        <div className="absolute bottom-2 flex flex-col items-center">
          <span className={cn("text-3xl font-black tracking-tighter leading-none", color)}>
            {progress}%
          </span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Execution Velocity
          </span>
        </div>
      </div>

      <div className="mt-6 w-full space-y-3">
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-white group">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", bgColor)}>
              {isDelayed ? <AlertTriangle size={14} className={color} /> : isAhead ? <TrendingUp size={14} className={color} /> : <Zap size={14} className={color} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Mission Sync</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                {isDelayed ? 'Stabilization Required' : isAhead ? 'Optimal Output' : 'Pacing Target'}
              </p>
            </div>
          </div>
          <div className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border", 
            isDelayed ? "bg-white text-red-500 border-red-100" : isAhead ? "bg-white text-emerald-500 border-emerald-100" : "bg-white text-blue-500 border-blue-100")}>
            {isDelayed ? 'Critical' : isAhead ? 'Optimal' : 'Stable'}
          </div>
        </div>

        <div className="flex gap-2">
            <div className="flex-1 p-3 bg-slate-50 rounded-2xl flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Passed</span>
                <span className="text-xs font-black text-slate-900">{timeElapsed}%</span>
            </div>
            <div className="flex-1 p-3 bg-slate-50 rounded-2xl flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Milestones</span>
                <span className="text-xs font-black text-slate-900">{progress}%</span>
            </div>
        </div>
      </div>
    </div>
  );
};
