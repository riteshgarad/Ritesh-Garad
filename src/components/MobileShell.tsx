import React, { useState } from 'react';
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
  ChevronDown,
  Settings,
  IndianRupee,
  Share2,
  Clock,
  Layout,
  LogOut,
  Users,
  Shield,
  ShieldCheck,
  Megaphone,
  Globe,
  Database,
  Zap,
  X,
  MessageCircle,
  Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NotificationPanel } from './NotificationPanel';

interface MobileShellProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: any) => void;
  title: string;
  hasNotifications?: boolean;
  onNotifClick?: () => void;
  onLogout?: () => void;
  notifications?: any[];
  isNotifOpen?: boolean;
  onMarkAsRead?: (id: string) => void;
  onClearNotifications?: () => void;
  user?: any;
  projectsCount?: number;
  pendingApprovalsCount?: number;
  tasksCount?: number;
}

export const MobileShell = ({ 
  children, 
  activePath, 
  onNavigate, 
  title, 
  hasNotifications,
  onNotifClick,
  onLogout,
  notifications = [],
  isNotifOpen = false,
  onMarkAsRead,
  onClearNotifications,
  user,
  projectsCount = 0,
  pendingApprovalsCount = 0,
  tasksCount = 0
}: MobileShellProps) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['missions', 'finance']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const navigation = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', desc: 'Home Hub' },
    { id: 'messages', icon: MessageCircle, label: 'Mission Comms' },
    { id: 'schedule', icon: Calendar, label: 'Calendar' },
    { 
      id: 'missions', 
      icon: Target, 
      label: 'Missions',
      roles: ['Admin', 'Project Head', 'Department Head'],
      depts: ['Operations', 'General'],
      subs: [
        { id: 'projects', label: 'Active Missions' },
        { id: 'roadmap', label: 'Strategic Roadmap' },
        { id: 'new-proposal', label: 'Draft Proposal' }
      ]
    },
    { 
      id: 'finance', 
      icon: IndianRupee, 
      label: 'Finance Command',
      roles: ['Admin', 'Finance Head', 'Department Head', 'Volunteer'],
      subs: [
        { id: 'finance-requests', label: 'Fund Requests', roles: ['Admin', 'Department Head', 'Finance Head'] },
        { id: 'finance-expenses', label: 'Expense Requests', roles: ['Admin', 'Department Head', 'Finance Head', 'Volunteer'] },
        { id: 'finance-ledger', label: 'Digital Ledger', roles: ['Admin', 'Finance Head'] },
        { id: 'finance-budgets', label: 'Mission Budgets', roles: ['Admin', 'Finance Head'] },
        { id: 'finance-income', label: 'Income Hub', roles: ['Admin', 'Finance Head'] }
      ]
    },
    { 
      id: 'network', 
      icon: Users, 
      label: 'Personnel Network',
      roles: ['Admin'],
      subs: [
        { id: 'volunteers', label: 'Unit Directory' },
        { id: 'users', label: 'Access Control', roles: ['Admin'] },
        { id: 'kyc', label: 'Verified Credentials' }
      ]
    },
    { 
      id: 'media', 
      icon: Megaphone, 
      label: 'Communications',
      roles: ['Admin', 'Marketing Head', 'Department Head'],
      depts: ['Marketing'],
      subs: [
        { id: 'social-media', label: 'Social Pipeline' },
        { id: 'public-relations', label: 'PR & Outreach' }
      ]
    },
    { id: 'docs', icon: FileText, label: 'Protocols Vault' },
    { id: 'automation', icon: Zap, label: 'Automation Hub', roles: ['Admin'] },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (!user) return false;
    
    const isYukta = user.email === 'yuktagarad@gmail.com' || user.name === 'Yukta';
    
    // Strict filtering for Yukta as requested: Only Comms, Finance, and Calendar + Dashboard & Missions
    if (isYukta) {
      const allowedForYukta = ['dashboard', 'messages', 'finance', 'schedule', 'missions', 'projects'];
      return allowedForYukta.includes(item.id);
    }

    if (user.role === 'Admin') return true;
    
    // Check main item role/dept
    const roleMatch = item.roles ? item.roles.some(r => r === user.role) : true;
    const deptMatch = item.depts ? item.depts.includes(user.department) : true;
    
    if (!(roleMatch && deptMatch)) return false;

    return true;
  });

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white font-sans">
      <div className="p-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-mahogany rounded-2xl flex items-center justify-center shadow-xl shadow-mahogany/20 border border-white/10 text-white">
          <Shield size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-mahogany leading-none mb-1">Garad Foundation</h1>
          <p className="text-[9px] font-bold text-terracotta/40 uppercase tracking-widest">Operation: Mission Bharari</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        {filteredNavigation.map((item) => {
          const isMenuActive = activePath === item.id || item.subs?.some(s => s.id === activePath);
          const isExpanded = expandedMenus.includes(item.id);
          const Icon = item.icon;

          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => item.subs ? toggleMenu(item.id) : handleNavClick(item.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all group",
                  isMenuActive 
                    ? "text-terracotta" 
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "p-2 rounded-xl transition-all",
                    isMenuActive 
                      ? "bg-terracotta/5 text-terracotta font-black" 
                      : "bg-transparent text-slate-400 group-hover:text-terracotta"
                  )}>
                    <Icon size={18} />
                  </div>
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-tight",
                    isMenuActive ? "text-mahogany" : "text-slate-600"
                  )}>{item.label}</span>
                </div>
                {item.subs && (
                  <div className="flex items-center gap-2">
                    {item.id === 'missions' && projectsCount > 0 && (
                      <span className="w-5 h-5 bg-terracotta/10 text-terracotta text-[9px] font-black flex items-center justify-center rounded-full">
                        {projectsCount}
                      </span>
                    )}
                    {item.id === 'finance' && pendingApprovalsCount > 0 && (
                      <span className="w-5 h-5 bg-red-100 text-red-600 text-[9px] font-black flex items-center justify-center rounded-full">
                        {pendingApprovalsCount}
                      </span>
                    )}
                    <ChevronDown 
                      size={14} 
                      className={cn(
                        "transition-transform text-slate-400",
                        isExpanded ? "rotate-180" : ""
                      )} 
                    />
                  </div>
                )}
              </button>

              {item.subs && isExpanded && (
                <div className="ml-10 space-y-1 border-l-2 border-slate-50 pl-4 py-1">
                  {item.subs.filter((sub: any) => {
                    const isYukta = user?.email === 'yuktagarad@gmail.com' || user?.name === 'Yukta';
                    if (user?.role === 'Admin' || isYukta) return true;
                    if (sub.roles && !sub.roles.includes(user?.role || 'Guest')) return false;
                    return true;
                  }).map((sub: any) => {
                    const isSubActive = activePath === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleNavClick(sub.id)}
                        className={cn(
                          "w-full text-left py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          isSubActive 
                            ? "text-terracotta bg-terracotta/5" 
                            : "text-slate-400 hover:text-mahogany hover:translate-x-1"
                        )}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-6 mt-6 border-t border-slate-50 px-2">
          <button 
            onClick={() => handleNavClick('create')}
            className="w-full flex items-center justify-center gap-3 p-4 bg-terracotta text-white rounded-[2rem] shadow-xl shadow-terracotta/20 hover:bg-mahogany active:scale-95 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <Plus size={16} />
            <span>Deploy Initiative</span>
          </button>
        </div>
      </nav>

      <div className="p-6 border-t border-slate-50">
         <div className="bg-cream rounded-[2rem] p-4 flex items-center gap-3 border border-terracotta/5">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-terracotta font-black text-xs shadow-sm border border-terracotta/10">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-mahogany uppercase truncate">{user?.name || 'Operative'}</p>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <ShieldCheck size={10} className="text-terracotta shrink-0" />
                <p className="text-[8px] font-black text-terracotta/60 uppercase tracking-widest truncate">{user?.role || 'Guest'}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                <Settings size={14} />
              </button>
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  title="Secure Logout"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white lg:bg-slate-50 flex font-sans overflow-hidden h-[100dvh]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 bg-white border-r border-slate-100 flex-col shadow-2xl shadow-slate-200/50 z-50 rounded-r-[40px] fixed h-[100dvh] top-0 left-0 pt-[env(safe-area-inset-top,24px)]">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-[101] lg:hidden shadow-2xl rounded-r-[3rem] overflow-hidden pt-[env(safe-area-inset-top,20px)]"
            >
              <SidebarContent />
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-8 right-6 p-2 bg-slate-50 text-slate-400 rounded-xl"
              >
                <X size={20} />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden lg:ml-80">
        {/* Top App Bar */}
        {activePath !== 'messages' && (
          <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-50 flex items-center justify-between px-6 lg:px-10 z-40 pt-[calc(env(safe-area-inset-top,24px)+24px)] pb-6 h-auto min-h-[100px]">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <Menu size={20} />
              </button>
              <div className="hidden sm:block lg:hidden w-10 h-10 bg-mahogany rounded-xl flex items-center justify-center shadow-md border border-white/10 text-white">
                <Shield size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-mahogany leading-none">{title}</h1>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </div>
                <p className="text-[9px] font-bold text-terracotta/40 uppercase tracking-widest hidden sm:block">Sector 7-G / Node Protocol v5.0</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 h-full py-2">
              <div className="hidden md:flex flex-col text-right mr-2 justify-center">
                <span className="text-[9px] font-black text-terracotta/30 uppercase tracking-widest mb-0.5">System Clock</span>
                <span className="text-[10px] font-bold text-mahogany uppercase font-mono tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {onNotifClick && (
                <div className="relative">
                  <button 
                    onClick={onNotifClick}
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 relative hover:text-terracotta hover:border-terracotta/50 transition-all shadow-sm active:scale-95 group"
                    title="Notifications"
                    id="notification-bell"
                  >
                    <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                    {hasNotifications && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-terracotta rounded-full border-2 border-white animate-pulse" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {isNotifOpen && (
                      <div className="absolute right-0 top-full mt-2 z-[100]">
                        <NotificationPanel 
                          notifications={notifications}
                          onClose={onNotifClick}
                          onMarkAsRead={(id) => onMarkAsRead?.(id)}
                          onClearAll={() => onClearNotifications?.()}
                        />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </header>
        )}

        {/* Main Scrolling Content Area */}
        <main className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/20 max-w-full",
          activePath === 'messages' ? "p-0" : "p-0 md:p-6 lg:p-10"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activePath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "w-full h-full",
                activePath === 'messages' ? "px-0" : "px-0 md:px-8 xl:px-12"
              )}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile-Only Bottom Navigation (Sleek Modern Profile) */}
        <nav className="lg:hidden h-[calc(70px+env(safe-area-inset-bottom,16px))] bg-white/95 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.04)] z-50">
          {[
            { id: 'dashboard', icon: Home, label: 'HUB' },
            { id: 'schedule', icon: Calendar, label: 'CAL' },
            { id: 'create', icon: Plus, label: 'NEW', isSpecial: true },
            { id: 'messages', icon: MessageCircle, label: 'COMMS' },
            { id: 'projects', icon: Target, label: 'MISSIONS' }
          ].map((item) => {
            const isActive = activePath === item.id || (item.id === 'projects' && activePath === 'roadmap');
            const Icon = item.icon;

            if (item.id === 'create') {
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick('create')}
                  className="relative -top-5"
                >
                  <div className="w-16 h-16 bg-mahogany rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-mahogany/30 ring-8 ring-white/50 transition-all active:scale-90 hover:rotate-90">
                    <Plus size={28} strokeWidth={2.5} />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="flex flex-col items-center gap-1.5 px-4 h-full justify-center relative group min-w-[64px]"
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-mahogany/5" : "bg-transparent"
                )}>
                  <Icon 
                    size={22} 
                    className={cn(
                      "transition-all duration-300",
                      isActive ? "text-mahogany scale-110" : "text-slate-400 group-active:scale-90"
                    )} 
                  />
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-[0.15em] leading-none transition-colors",
                  isActive ? "text-mahogany" : "text-slate-400"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-dot"
                    className="absolute bottom-1 w-1 h-1 bg-mahogany rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
