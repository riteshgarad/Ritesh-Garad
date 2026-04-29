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
  Settings,
  IndianRupee,
  Bot,
  Share2,
  Clock
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
    { id: 'dashboard', icon: Home, label: 'Dashboard', desc: 'Command Hub' },
    { id: 'projects', icon: Target, label: 'Missions', desc: 'Project lifecycle' },
    { id: 'tasks', icon: Clock, label: 'Task flow', desc: 'Operational nodes' },
    { id: 'volunteers', icon: User, label: 'Unit records', desc: 'Personnel data' },
    { id: 'finance', icon: IndianRupee, label: 'Resource Cell', desc: 'Financial oversight' },
    { id: 'docs', icon: FileText, label: 'Signal Vault', desc: 'Document protocol' },
    { id: 'social-media', icon: Share2, label: 'Comm Link', icon_alt: 'Social' },
    { id: 'chatbot', icon: Bot, label: 'AI Oracle', desc: 'Mission intelligence' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col shadow-xl shadow-slate-200/20 z-50">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Target size={24} />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none mb-1">GF OS</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Internal Sector</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-6 space-y-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Operational Nodes</h3>
          {navItems.map((item) => {
            const isActive = activePath === item.id;
            const Icon = item.icon;
            
            if (item.id === 'create') return null;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group border",
                  isActive 
                    ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                    : "bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-100"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all",
                  isActive ? "bg-white/10 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm"
                )}>
                  <Icon size={18} />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-black uppercase tracking-tight leading-none">{item.label}</p>
                  <p className={cn(
                    "text-[8px] font-bold uppercase tracking-widest mt-1",
                    isActive ? "text-white/40" : "text-slate-400"
                  )}>{item.desc}</p>
                </div>
              </button>
            );
          })}

          <div className="pt-8 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Quick Action</h3>
            <button 
              onClick={() => onNavigate('create')}
              className="w-full flex items-center justify-center gap-3 p-5 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.2em]"
            >
              <Plus size={18} />
              <span>Deploy Asset</span>
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-100">
           <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-900 uppercase truncate">{user?.name || 'Operative'}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{user?.role || 'Guest'}</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top App Bar (Always visible but styled differently for lg) */}
        <header className="h-16 lg:h-20 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 z-40">
          <div className="flex items-center gap-4">
            <div className="lg:hidden w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Target size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none">{title}</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Sector 7-G / Node Status: Optimal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden sm:flex flex-col text-right mr-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Core Time</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase font-mono tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            <button 
              onClick={onNotifClick}
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 relative hover:bg-slate-100 hover:scale-105 transition-all shadow-sm group"
            >
              <Bell size={18} className="group-hover:rotate-12 transition-transform" />
              {hasNotifications && (
                <span className="absolute top-2.5 right-2.5 lg:top-3 lg:right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              )}
            </button>
            <div className="lg:hidden w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Main Scrolling Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 bg-slate-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePath}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="max-w-7xl mx-auto w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile-Only Bottom Navigation */}
        <nav className="lg:hidden h-20 bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-2 pb-safe">
          {navItems.slice(0, 5).map((item) => {
            const isActive = activePath === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center gap-1.5 px-4 py-2 relative group"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-bg"
                    className="absolute inset-x-1 inset-y-1 bg-blue-50 rounded-2xl -z-10 border border-blue-100/50"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon 
                  size={20} 
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "text-blue-600 scale-110" : "text-slate-400 group-active:scale-90"
                  )} 
                />
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest leading-none transition-colors",
                  isActive ? "text-blue-600" : "text-slate-400"
                )}>
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
