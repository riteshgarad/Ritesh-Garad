import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface ExpenseStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
  className?: string;
}

export const ExpenseStatusBadge = ({ status, className }: ExpenseStatusBadgeProps) => {
  const configs = {
    pending: {
      label: 'Processing',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      dot: 'bg-amber-500'
    },
    approved: {
      label: 'Authorized',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      dot: 'bg-emerald-500'
    },
    rejected: {
      label: 'Declined',
      icon: XCircle,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      dot: 'bg-rose-500'
    }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
      config.color,
      className
    )}>
      <div className="relative flex h-2 w-2">
        {status === 'pending' && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.dot)}></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", config.dot)}></span>
      </div>
      <span>{config.label}</span>
    </div>
  );
};
