import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Target, 
  Plus, 
  FileText, 
  User, 
  Bell,
  Menu,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileShellProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: any) => void;
  title: string;
  hasNotifications?: boolean;
  onNotifClick?: () => void;
  user?: any;
}

export const MobileShell = ({ 
  children, 
  activePath, 
  onNavigate, 
  title, 
  hasNotifications,
  onNotifClick,
  user
}: MobileShellProps) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'projects', icon: Target, label: 'Missions' },
    { id: 'create', icon: Plus, label: 'Create', isSpecial: true },
    { id: 'docs', icon: FileText, label: 'Docs' },
    { id: 'volunteers', icon: User, label: 'Profile' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top App Bar */}
      <header className="glass-header h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Target size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">{title}</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Sector 7-G / Internal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onNotifClick}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 relative hover:bg-slate-200 transition-colors"
          >
            <Bell size={18} />
            {hasNotifications && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </button>
          {user && (
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 overflow-hidden shadow-sm">
               <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-blue-600">
                {user.name?.charAt(0) || 'U'}
               </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 px-4 pt-4 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePath}
            initial={{ opacity: 0, y: 10, scale: 1.01 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav h-20 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = activePath === item.id;
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative -top-6"
              >
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-slate-900/40 ring-4 ring-slate-50 transition-transform active:scale-90">
                  <Plus size={24} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1.5 px-4 py-2 relative group"
            >
              {isActive && (
                <motion.div
                  layoutId="active-bg"
                  className="absolute inset-0 bg-blue-50 rounded-2xl -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon 
                size={20} 
                className={cn(
                  "transition-all duration-300",
                  isActive ? "text-blue-600" : "text-slate-400 group-active:scale-90"
                )} 
              />
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest leading-none transition-colors",
                isActive ? "text-blue-600" : "text-slate-400"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
