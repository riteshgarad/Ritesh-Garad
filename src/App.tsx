/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import FinanceDashboard from './components/FinanceDashboard';
import MarketingDashboard from './components/MarketingDashboard';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  IndianRupee, 
  FileText, 
  Share2, 
  Star, 
  Bot, 
  Zap, 
  Search, 
  Bell, 
  Megaphone,
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Target,
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts';
import { differenceInDays, parseISO, isFuture, isPast } from 'date-fns';
import { cn } from './lib/utils';
import { Project, Task, Volunteer, Transaction, Campaign, AppUser, AppNotification, FinanceRequest } from './types';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_VOLUNTEERS, TEAM, DEPT_COLORS, PHASES } from './constants';
import { askAssistant } from './services/geminiService';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp, query, doc, updateDoc, getDocFromServer, getDocs, deleteDoc, orderBy, limit } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const handleFirestoreError = (error: any, operationType: string, path: string | null = null) => {
  const authInfo = auth.currentUser ? {
    userId: auth.currentUser.uid,
    email: auth.currentUser.email || '',
    emailVerified: auth.currentUser.emailVerified,
    isAnonymous: auth.currentUser.isAnonymous,
    providerInfo: auth.currentUser.providerData.map(p => ({
      providerId: p.providerId,
      displayName: p.displayName || '',
      email: p.email || ''
    }))
  } : {
    userId: 'anonymous',
    email: '',
    emailVerified: false,
    isAnonymous: true,
    providerInfo: []
  };

  const errorInfo = {
    error: error.message || 'Unknown Firestore error',
    operationType,
    path,
    authInfo
  };
  
  console.error("Firestore Failure:", JSON.stringify(errorInfo, null, 2));
  throw new Error(JSON.stringify(errorInfo));
};

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection Verified");
  } catch (error: any) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// --- Components ---

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest", className)}>
    {children}
  </span>
);

const Card = ({ children, className, onClick, ...props }: { children: React.ReactNode, className?: string, onClick?: () => void } & React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    onClick={onClick}
    className={cn("bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5", onClick && "cursor-pointer", className)}
    {...props}
  >
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 active:scale-95",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-95",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 active:scale-95"
  };
  return (
    <button 
      className={cn("px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-widest border transition-all disabled:opacity-50 active:scale-[0.98]", variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Notification Panel Component ---

const NotificationPanel = ({ 
  notifications, 
  onClose, 
  onMarkAsRead, 
  onClearAll 
}: { 
  notifications: AppNotification[], 
  onClose: () => void, 
  onMarkAsRead: (id: string) => void,
  onClearAll: () => void
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="absolute right-0 top-14 w-80 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
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
      
      <div className="max-h-96 overflow-y-auto">
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

// --- App Internal State Views ---

type Page = 'dashboard' | 'projects' | 'tasks' | 'volunteers' | 'finance' | 'docs' | 'social' | 'fundraising' | 'chatbot' | 'automation' | 'project-detail';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Modal States
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Automatically promote the specific user to Admin for module management
        const role = firebaseUser.email === 'riteshgarad4@gmail.com' ? 'Admin' : 'Staff Operative';
        
        setUser({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
          email: firebaseUser.email || '',
          role: role
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubProjects = onSnapshot(collection(db, 'projects'), 
      (snapshot) => setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project))),
      (err) => handleFirestoreError(err, 'list', 'projects')
    );

    const unsubTasks = onSnapshot(collection(db, 'tasks'), 
      (snapshot) => setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task))),
      (err) => handleFirestoreError(err, 'list', 'tasks')
    );

    const unsubVolunteers = onSnapshot(collection(db, 'volunteers'), 
      (snapshot) => setVolunteers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Volunteer))),
      (err) => handleFirestoreError(err, 'list', 'volunteers')
    );

    return () => {
      unsubProjects();
      unsubTasks();
      unsubVolunteers();
    };
  }, [user]);

  // --- Database Seeding ---
  useEffect(() => {
    if (!user) return;
    
    const seedIfEmpty = async () => {
      const vSnap = await getDocs(collection(db, 'volunteers'));
      if (vSnap.empty) {
        console.log("Seeding INITIAL_VOLUNTEERS...");
        for (const v of INITIAL_VOLUNTEERS) {
          await addDoc(collection(db, 'volunteers'), { ...v });
        }
      }

      const pSnap = await getDocs(collection(db, 'projects'));
      if (pSnap.empty) {
        console.log("Seeding INITIAL_PROJECTS...");
        for (const p of INITIAL_PROJECTS) {
          const { id, ...data } = p;
          await addDoc(collection(db, 'projects'), { 
            ...data, 
            creator_id: auth.currentUser?.uid,
            created_at: serverTimestamp() 
          });
        }
      }
    };

    seedIfEmpty();
  }, [user]);

  // --- Notification Logic ---
  useEffect(() => {
    if (!user) return;

    const generateNotifications = () => {
      const newNotifs: AppNotification[] = [];
      const now = new Date();

      // Check Task Deadlines
      tasks.forEach(task => {
        if (task.status !== 'completed' && task.due_date) {
          const dueDate = parseISO(task.due_date);
          const daysTo = differenceInDays(dueDate, now);

          if (daysTo >= 0 && daysTo <= 3) {
            newNotifs.push({
              id: `task-deadline-${task.id}`,
              type: 'deadline',
              title: 'Critical Deadline',
              message: `Task "${task.title}" is due in ${daysTo === 0 ? 'today' : daysTo + ' days'}. System requires closure.`,
              timestamp: 'Now',
              isRead: false,
              relatedId: task.id
            });
          } else if (daysTo < 0) {
            newNotifs.push({
              id: `task-overdue-${task.id}`,
              type: 'deadline',
              title: 'Overdue Protocol',
              message: `Task "${task.title}" is past due threshold. ACTION IS MANDATORY.`,
              timestamp: 'Critical',
              isRead: false,
              relatedId: task.id
            });
          }
        }
      });

      // Check Project Milestones (Phase advancements)
      projects.forEach(project => {
        if (project.status === 'active' && project.progress >= 90) {
           newNotifs.push({
            id: `project-milestone-${project.id}`,
            type: 'milestone',
            title: 'System Milestone',
            message: `Project "${project.name}" reached ${project.progress}% completion. Authorization for Phase ${project.phase + 1} pending.`,
            timestamp: 'Sector Update',
            isRead: false,
            relatedId: project.id
          });
        }
      });

      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const filteredNew = newNotifs.filter(n => !existingIds.has(n.id));
        return [...filteredNew, ...prev].slice(0, 20);
      });
    };

    generateNotifications();
  }, [tasks, projects, user]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearNotifications = () => setNotifications([]);

  // --- Data Management ---
  const handleAddProject = () => setIsProjectModalOpen(true);

  const handleAddVolunteer = () => setIsVolunteerModalOpen(true);

  const handleCreateProject = async (formData: any) => {
    if (!auth.currentUser || !user) return;
    try {
      await addDoc(collection(db, 'projects'), {
        ...formData,
        status: "pending_dept_review",
        phase: 1,
        progress: 0,
        budget_status: "pending",
        created_at: serverTimestamp(),
        creator_id: auth.currentUser.uid,
        department: formData.department || user.department || "General"
      });
      setIsProjectModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, 'create', 'projects');
    }
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: any, reason?: string) => {
    if (!auth.currentUser || !user) return;
    try {
      const projectRef = doc(db, 'projects', projectId);
      const updateData: any = { 
        status: newStatus,
        updated_at: serverTimestamp()
      };
      
      if (reason) {
        updateData.rejection_reason = reason;
      }

      await updateDoc(projectRef, updateData);

      // Financial Integration Trigger
      if (newStatus === 'approved') {
        const projectDoc = projects.find(p => p.id === projectId);
        if (projectDoc) {
          // 1. Finance Request for internal track
          await addDoc(collection(db, 'finance_requests'), {
            project_id: projectId,
            project_name: projectDoc.name,
            amount: projectDoc.budget,
            requested_at: serverTimestamp(),
            status: 'pending'
          });

          // 2. Automated Pending Expense entry in Ledger (Requirement 2)
          const budgetNum = parseFloat(projectDoc.budget.replace(/[^0-9.]/g, '')) || 0;
          await addDoc(collection(db, 'transactions'), {
            type: 'expense',
            amount: budgetNum,
            category: 'Project Fund',
            projectID: projectId,
            status: 'pending',
            date: serverTimestamp(),
            createdBy: auth.currentUser.uid,
            paymentMethod: 'Bank Transfer',
            expenditureType: 'Procurement',
            description: `Automated budget allocation for approved project: ${projectDoc.name}`
          });
          
          // Notify the creator
          await addDoc(collection(db, `users/${projectDoc.creator_id}/notifications`), {
            type: 'approval',
            title: 'Project Fully Approved',
            message: `Mission "${projectDoc.name}" has cleared Admin review. Fiscal allocation requested.`,
            timestamp: serverTimestamp(),
            isRead: false,
            relatedId: projectId
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, 'update', `projects/${projectId}`);
    }
  };

  const handleCreateVolunteer = async (formData: any) => {
    try {
      await addDoc(collection(db, 'volunteers'), {
        ...formData,
        hours: 0,
        status: "Active"
      });
      setIsVolunteerModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, 'create', 'volunteers');
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this project? This action cannot be reversed.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'projects', id));
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
        setCurrentPage('projects');
      }
    } catch (err) {
      handleFirestoreError(err, 'delete', `projects/${id}`);
    }
  };

  // --- Login Logic ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setResetSent(false);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, loginEmail, loginPass);
      } else {
        await signInWithEmailAndPassword(auth, loginEmail, loginPass);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed across secure channel.');
    }
  };

  const handleResetPassword = async () => {
    if (!loginEmail) {
      setLoginError('Please enter your email to receive a reset link.');
      return;
    }
    setLoginError('');
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setResetSent(true);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to send reset email.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setLoginEmail('');
    setLoginPass('');
    setSidebarOpen(true);
    setCurrentPage('dashboard');
  };

  // --- Navigation ---
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban, badge: projects.length },
    { id: 'tasks', label: 'Task Board', icon: CheckSquare },
    { id: 'volunteers', label: 'Volunteers', icon: Users },
    { id: 'finance', label: 'Finance', icon: IndianRupee },
    { id: 'docs', label: 'Documentation', icon: FileText },
    { id: 'social', label: 'Social & PR', icon: Share2 },
    { id: 'automation', label: 'Automation', icon: Zap },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-3xl p-10 w-full max-w-md shadow-2xl"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-xl shadow-blue-500/20">G</div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Garad Foundation</h1>
            <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-widest font-black">NGO Operating System</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {loginError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 uppercase tracking-wider">
                {loginError}
              </div>
            )}
            {resetSent && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-xs font-bold border border-emerald-100 uppercase tracking-wider">
                Reset link sent! Check your inbox.
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email Terminal</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="identity@portal.com" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Security Key</label>
              <input 
                type="password" 
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm"
                required
              />
              {!isSignUp && (
                <div className="flex justify-end mt-2 px-1">
                  <button 
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Retrieve Credentials?
                  </button>
                </div>
              )}
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-[0.2em] py-4.5 rounded-xl transition-all shadow-xl shadow-blue-500/25 active:scale-[0.98] mt-2"
            >
              {isSignUp ? 'Register Operative' : 'Authorize Access'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
              >
                {isSignUp ? 'Already registered? System Login' : 'First deployment? Initialize Account'}
              </button>
            </div>
          </form>
          <div className="text-center mt-10 pt-8 border-t border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">System Build v4.2.0-LGT</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-700 overflow-hidden text-xs md:text-sm tracking-tight select-none">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "bg-[#0f172a] shadow-2xl shadow-blue-900/10 transition-all duration-500 ease-out flex flex-col fixed md:relative h-full z-50",
        isSidebarOpen 
          ? "w-68 translate-x-0" 
          : "-translate-x-full md:translate-x-0 md:w-20"
      )}>
        <div className="p-5 md:p-8 flex items-center justify-between h-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-lg shadow-blue-500/30">G</div>
            {(isSidebarOpen) && (
              <div className="overflow-hidden text-left">
                <h2 className="font-black text-white text-sm tracking-tight truncate">Garad Foundation</h2>
                <p className="text-[9px] text-blue-400 font-black truncate tracking-[0.1em] uppercase">NGO Operating System</p>
              </div>
            )}
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-slate-500 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-none">
          {isSidebarOpen && <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 mt-2 px-3 opacity-60 text-left">Operational</div>}
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id as Page);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all group",
                currentPage === item.id 
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              )}
            >
              <item.icon size={18} className={cn("shrink-0", currentPage === item.id ? "text-white" : "group-hover:scale-110 transition-transform")} />
              {(isSidebarOpen) && (
                <>
                  <span className={cn("flex-1 text-left font-bold text-[11px] tracking-wide", currentPage === item.id ? "text-white" : "text-slate-400")}>{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-lg border",
                      currentPage === item.id ? "bg-white/20 border-white/20 text-white" : "bg-blue-600 text-white border-transparent shadow-lg shadow-blue-600/20"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 shrink-0">
          <div className={cn("flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5", !isSidebarOpen && "md:justify-center px-1 md:px-2")}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-black shadow-lg shrink-0">RI</div>
            {(isSidebarOpen) && (
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-[11px] font-black text-white truncate mb-0.5">{user.name}</p>
                <div className="flex items-center gap-2 text-left">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <p className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest leading-none">{user.role}</p>
                </div>
              </div>
            )}
            {(isSidebarOpen) && (
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors bg-white/5 rounded-xl hover:bg-red-500/10"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 shrink-0 shadow-sm sticky top-0 z-[40]">
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2.5 transition-all duration-200 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 shadow-sm"
            >
              <Menu size={20}/>
            </button>
            <h2 className="font-bold text-base md:text-xl text-slate-900 tracking-tight truncate max-w-[120px] md:max-w-none">
              {PAGE_TITLES[currentPage as Page] || currentPage}
            </h2>
          </div>

          <div className="hidden lg:flex items-center gap-4 flex-1 max-w-xl px-12">
            <div className="relative w-full group text-left">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="SEARCH OPERATIONAL DATA..." 
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500/50 py-2.5 pl-12 pr-4 rounded-xl text-[10px] font-black tracking-widest uppercase text-slate-900 transition-all focus:ring-0 placeholder-slate-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 relative text-left">
            <button 
              onClick={() => {
                downloadCSV(projects, 'garad_foundation_projects');
                downloadCSV(tasks, 'garad_foundation_tasks');
                downloadCSV(volunteers, 'garad_foundation_volunteers');
              }}
              className="p-3 bg-white text-slate-500 border border-slate-200 rounded-xl hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all flex items-center gap-2 group"
              title="Export Full Dataset (CSV)"
            >
              <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
              <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Master Export</span>
            </button>

            <button 
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="lg:hidden p-3 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl hover:text-slate-900 active:scale-95 transition-all"
            >
              <Search size={18} />
            </button>
            <button 
              onClick={() => setNotifOpen(!isNotifOpen)}
              className={cn(
                "relative p-3 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm group",
                unreadCount > 0 && "text-blue-600 border-blue-100"
              )}
            >
              <Bell size={18} className={cn("group-hover:rotate-12 transition-transform", unreadCount > 0 && "animate-pulse")} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence>
            {isMobileSearchOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-24 left-4 right-4 z-[60] lg:hidden"
              >
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="SEARCH TERMINAL..." 
                    className="w-full bg-[#121214] border border-blue-500/30 focus:border-blue-500 py-4 pl-12 pr-4 rounded-2xl text-[10px] font-bold tracking-widest uppercase text-white shadow-2xl focus:ring-0"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onBlur={() => setIsMobileSearchOpen(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "circOut" }}
            >
              <PageView 
                page={currentPage} 
                user={user} 
                projects={projects} 
                tasks={tasks}
                volunteers={volunteers}
                selectedProjectId={selectedProjectId}
                setCurrentPage={setCurrentPage}
                onOpenProject={(id: string) => {
                  setSelectedProjectId(id);
                  setCurrentPage('project-detail');
                }}
                onAddProject={handleAddProject}
                onAddVolunteer={handleAddVolunteer}
                onDeleteProject={handleDeleteProject}
                onUpdateProjectStatus={handleUpdateProjectStatus}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fixed Status Footer */}
        <footer className="h-auto md:h-12 bg-white border-t border-slate-200 px-4 md:px-10 py-3 md:py-0 flex flex-col md:flex-row items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] shrink-0 gap-2 md:gap-0 relative z-30 pb-20 md:pb-0">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <span className="flex items-center gap-2 whitespace-nowrap">Core Service: <span className="text-emerald-500">Live</span></span>
            <span className="flex items-center gap-2 whitespace-nowrap hidden sm:flex">Environment: <span className="text-blue-600">Production</span></span>
          </div>
          <div className="flex gap-4 md:gap-8">
            <span>© 2026 Garad Foundation Hub</span>
          </div>
        </footer>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-6 md:hidden z-50">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Hub' },
            { id: 'projects', icon: FolderKanban, label: 'Missions' },
            { id: 'tasks', icon: CheckSquare, label: 'Nodes' },
            { id: 'volunteers', icon: Users, label: 'Ops' },
            { id: 'chatbot', icon: Bot, label: 'AI' },
          ].map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all relative w-12",
                  isActive ? "text-blue-600" : "text-slate-400"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-dot"
                    className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full"
                  />
                )}
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[8px] font-black uppercase tracking-[0.1em]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>

      <AnimatePresence>
        {isProjectModalOpen && (
          <ProjectModal 
            isOpen={isProjectModalOpen} 
            onClose={() => setIsProjectModalOpen(false)} 
            onCreate={handleCreateProject}
            volunteers={volunteers}
          />
        )}
        {isVolunteerModalOpen && (
          <VolunteerModal 
            isOpen={isVolunteerModalOpen} 
            onClose={() => setIsVolunteerModalOpen(false)} 
            onCreate={handleCreateVolunteer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Modals ---

const ProjectModal = ({ isOpen, onClose, onCreate, volunteers }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    tag: 'Technology',
    department: 'Health',
    budget: '',
    lead_name: '',
    description: '',
    timeline: '3 Months'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="relative bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <div className="text-left">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-1">Add Project</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sector Allocation Protocol</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl border border-slate-200">
            <X size={18} />
          </button>
        </div>
        
        <form className="p-6 md:p-8 space-y-6 text-left" onSubmit={(e) => { e.preventDefault(); onCreate(formData); }}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mission Identifier</label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900"
              placeholder="e.g. Clean Water Initiative"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Functional Department</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 appearance-none"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              >
                {['Health', 'Education', 'Environment', 'Economy', 'Technology'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Project Timeline</label>
              <input 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900"
                placeholder="e.g. 6 Months"
                value={formData.timeline}
                onChange={e => setFormData({...formData, timeline: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sector Class</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 appearance-none"
                value={formData.tag}
                onChange={e => setFormData({...formData, tag: e.target.value as any})}
              >
                {['Health', 'Education', 'Environment', 'Community', 'Technology'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CapEx Buffer</label>
              <input 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900"
                placeholder="e.g. ₹2.5L"
                value={formData.budget}
                onChange={e => setFormData({...formData, budget: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lead Strategist</label>
            <select 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 appearance-none"
              value={formData.lead_name}
              onChange={e => setFormData({...formData, lead_name: e.target.value})}
            >
              <option value="">Select Personnel...</option>
              {volunteers.map((v: any) => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
            {volunteers.length === 0 && (
              <p className="text-[9px] text-amber-600 font-bold uppercase mt-1 px-1">
                Note: No personnel detected. Initializing database seeding...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mission Intelligence Briefing</label>
            <textarea 
              required
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 resize-none"
              placeholder="Primary objectives and deployment parameters..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" type="button" className="flex-1 py-4 uppercase tracking-widest bg-white border-slate-200" onClick={onClose}>Abort</Button>
            <Button variant="primary" type="submit" className="flex-1 py-4 uppercase tracking-widest shadow-xl shadow-blue-500/20">ADD PROJECT</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const VolunteerModal = ({ isOpen, onClose, onCreate }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Field Operative',
    department: 'General Operations',
    skills: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="relative bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <div className="text-left">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-1">Onboard Operative</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Network Expansion</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl border border-slate-200">
            <X size={18} />
          </button>
        </div>
        
        <form className="p-6 md:p-8 space-y-6 text-left" onSubmit={(e) => { e.preventDefault(); onCreate(formData); }}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Operative Identity</label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900"
              placeholder="Full Name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Portal</label>
            <input 
              required
              type="email"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900"
              placeholder="operative@garadhub.org"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assigned Role</label>
              <input 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900"
                placeholder="e.g. Field Ops"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Operational Sector</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 appearance-none"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              >
                {Object.keys(DEPT_COLORS).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tactical Skill Matrix</label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900"
              placeholder="Logistics, Comms, Field Audit..."
              value={formData.skills}
              onChange={e => setFormData({...formData, skills: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" type="button" className="flex-1 py-4 uppercase tracking-widest bg-white border-slate-200" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" className="flex-1 py-4 uppercase tracking-widest shadow-xl shadow-blue-500/20">Complete Onboarding</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- Page Views ---

const PageView = ({ page, projects, tasks, volunteers, selectedProjectId, onOpenProject, setCurrentPage, onAddProject, onAddVolunteer, onDeleteProject, onUpdateProjectStatus, user }: any) => {
  switch (page) {
    case 'dashboard':
      return <DashboardView projects={projects} tasks={tasks} volunteers={volunteers} onOpenProject={onOpenProject} setCurrentPage={setCurrentPage} onDeleteProject={onDeleteProject} user={user} />;
    case 'projects':
      return <ProjectsView projects={projects} onOpenProject={onOpenProject} onAdd={onAddProject} onDelete={onDeleteProject} user={user} />;
    case 'project-detail':
      return <ProjectDetailView projectId={selectedProjectId} projects={projects} tasks={tasks} volunteers={volunteers} onBack={() => setCurrentPage('projects')} onDelete={onDeleteProject} onUpdateProjectStatus={onUpdateProjectStatus} user={user} />;
    case 'tasks':
      return <TasksView tasks={tasks} projects={projects} />;
    case 'volunteers':
      return <VolunteersView volunteers={volunteers} onAdd={onAddVolunteer} />;
    case 'finance':
      return <FinanceDashboard user={user} projects={projects} />;
    case 'social':
      return <SocialMediaView />;
    case 'fundraising':
      return <MarketingDashboard user={user} />;
    case 'chatbot':
      return <ChatbotView projects={projects} tasks={tasks} volunteers={volunteers} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
          <Zap size={64} className="mb-4 opacity-20" />
          <h3 className="text-xl font-medium">Coming Soon</h3>
          <p>This module is currently being optimized.</p>
        </div>
      );
  }
};

// --- Sub-Views ---

const DashboardView = ({ projects, tasks, volunteers, onOpenProject, setCurrentPage, onDeleteProject, user }: any) => {
  const isDH = user?.role === 'DH';
  const isAdmin = user?.role === 'Admin';
  
  const pendingByMe = projects.filter((p: any) => {
    if (isAdmin) return p.status === 'pending_admin_review';
    if (isDH) return p.status === 'pending_dept_review' && p.department === user.department;
    return false;
  });

  const activeMissions = projects.filter((p: any) => 
    p.status === 'approved' || p.status === 'active'
  );

  const stats = [
    { label: 'Pending Review', value: pendingByMe.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Active Missions', value: activeMissions.length, icon: FolderKanban, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Units Deployed', value: volunteers.length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Fiscal Allocation', value: '₹12.4L', icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="metric-card shadow-xl shadow-slate-200/50 p-5 md:p-7 group hover:translate-y-[-2px] transition-all border-slate-100 bg-white rounded-[24px] md:rounded-[32px]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="text-left order-2 md:order-1">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</h4>
              </div>
              <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all group-hover:scale-110 order-1 md:order-2", stat.bg, stat.border)}>
                <stat.icon className={stat.color} size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 md:mt-6 text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none bg-emerald-50 w-fit px-2 py-1 rounded-lg border border-emerald-100">
              <TrendingUp size={10} />
              <span>Optimal</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        <Card className="p-8 text-left bg-white border-slate-200 shadow-xl shadow-slate-200/20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Pending My Authorization</h3>
            <Badge className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1">{pendingByMe.length} Signals</Badge>
          </div>
          <div className="space-y-4">
            {pendingByMe.length > 0 ? pendingByMe.slice(0, 3).map((p: any) => (
              <div key={p.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-500/20 transition-all cursor-pointer relative" onClick={() => onOpenProject(p.id)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">Awaiting {p.status === 'pending_dept_review' ? 'DH' : 'Admin'}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.department} SECTOR</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2 leading-none">{p.name}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mb-4">{p.description}</p>
                <div className="flex items-center justify-between">
                   <div className="text-[10px] font-black text-slate-400 uppercase">CapEx: {p.budget}</div>
                   <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            )) : (
              <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Queue Clear</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-8 text-left bg-white border-slate-200 shadow-xl shadow-slate-200/20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">High Response Nodes</h3>
            <Badge className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest">Critical: {tasks.filter((t: any) => t.priority === 'High' && t.status !== 'completed').length}</Badge>
          </div>
          <div className="space-y-4">
            {tasks.filter((t: any) => t.priority === 'High' && t.status !== 'completed').slice(0, 4).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-4">
                   <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
                   <div className="text-left">
                      <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{t.title}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.assigned_to}</p>
                   </div>
                </div>
                <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Active Sector Priority</h3>
              <Button 
                variant="ghost" 
                className="text-[9px] uppercase tracking-[0.2em] font-black"
                onClick={() => setCurrentPage('projects')}
              >
                Scan All
              </Button>
            </div>
            <div className="space-y-8">
              {projects.slice(0, 3).map((p: any) => (
                <div key={p.id} className="group cursor-pointer text-left" onClick={() => onOpenProject(p.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-black text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-widest">{p.name}</span>
                       <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id, e); }}
                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{p.progress}%</span>
                  </div>
                  <div className="pbar h-2 bg-slate-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      className="pfill bg-blue-600 shadow-lg shadow-blue-500/20"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-5">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-xl bg-slate-50 border-2 border-white text-[9px] flex items-center justify-center font-black text-slate-400">U{i}</div>
                      ))}
                    </div>
                    <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest px-2 py-1 bg-blue-50 rounded-lg">{PHASES[p.phase - 1]}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-8">Recent Transaction Logs</h3>
            <div className="divide-y divide-white/5">
              {[
                { name: 'Ramesh Shah', amount: '₹25,000', campaign: 'Clean Water', time: '2h ago' },
                { name: 'Nisha Patil', amount: '₹10,000', campaign: 'Digital Literacy', time: '5h ago' },
                { name: 'Global Grant', amount: '₹2,50,000', campaign: 'Education Fund', time: '1d ago' }
              ].map((d, i) => (
                <div key={i} className="py-6 flex items-center gap-6 group hover:bg-slate-50 transition-all px-4 -mx-4 rounded-3xl border border-transparent hover:border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-[11px] font-black shadow-sm group-hover:scale-110 transition-transform">
                    {INITIALS(d.name)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[14px] font-black text-slate-900 truncate tracking-tight uppercase leading-none">{d.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate mt-2">{d.campaign}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black text-emerald-600 tracking-tight leading-none">{d.amount}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2">{d.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8">Pulse Dispatch Node</h3>
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: 'New Mission', icon: FolderKanban, color: 'bg-blue-50 text-blue-600 border-blue-100', page: 'projects' },
                { label: 'Log Pulse', icon: CheckSquare, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', page: 'tasks' },
                { label: 'Credit flow', icon: IndianRupee, color: 'bg-amber-50 text-amber-600 border-amber-100', page: 'finance' },
                { label: 'Deployment', icon: Users, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', page: 'volunteers' },
              ].map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(action.page)}
                  className="flex flex-col items-center justify-center p-6 rounded-3xl border border-slate-200 bg-white hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all group active:scale-[0.95] shadow-sm"
                >
                  <div className={cn("p-4 rounded-2xl mb-4 group-hover:rotate-12 transition-transform border-2 border-white shadow-sm", action.color)}>
                    <action.icon size={22} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{action.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-slate-900 text-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Live Activity</span>
            </div>
            <div className="space-y-4">
              {[
                { text: 'Budget assessment approved for Satara site', time: '10m ago' },
                { text: 'Siddhesh moved 3 tasks to Done', time: '2h ago' },
                { text: 'Digital Literacy 2026 phase advanced', time: '1d ago' }
              ].map((act, i) => (
                <div key={i} className="relative pl-4 border-l border-slate-700">
                  <div className="absolute left-[-4.5px] top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed">{act.text}</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{act.time}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ProjectDetailView = ({ projectId, projects, tasks, volunteers, onBack, onDelete, onUpdateProjectStatus, user }: any) => {
  const project = projects.find((p: any) => p.id === projectId);
  const projectTasks = tasks.filter((t: any) => t.project_id === projectId);
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!project) return null;

  const canApprove = (
    (user?.role === 'DH' && project.status === 'pending_dept_review' && project.department === user?.department) ||
    (user?.role === 'Admin' && project.status === 'pending_admin_review')
  );

  const handleApprove = () => {
    const nextStatus = project.status === 'pending_dept_review' ? 'pending_admin_review' : 'approved';
    onUpdateProjectStatus(project.id, nextStatus);
  };

  const handleReject = () => {
    if (!rejectionReason) {
       setShowRejectionInput(true);
       return;
    }
    onUpdateProjectStatus(project.id, 'rejected', rejectionReason);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_dept_review': return { label: 'DEPT REVIEW', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
      case 'pending_admin_review': return { label: 'ADMIN REVIEW', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
      case 'approved': return { label: 'APPROVED', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case 'rejected': return { label: 'REJECTED', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
      default: return { label: status.toUpperCase(), color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
    }
  };

  const statusCfg = getStatusConfig(project.status);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="text-slate-500 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
          </button>
          <div className="text-left">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={cn("rounded-lg px-2 py-0.5 text-[10px] uppercase font-black", statusCfg.bg, statusCfg.color)}>{statusCfg.label}</Badge>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg">ID: {project.id}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg">{project.department}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{project.name}</h2>
          </div>
        </div>
        <div className="flex gap-4">
          {user?.role === 'Admin' && (
            <Button variant="danger" className="px-6 py-3 font-black text-[10px] uppercase tracking-widest" onClick={(e) => onDelete(project.id, e)}>Terminate Mission</Button>
          )}
          <Button variant="secondary" className="px-6 py-3 font-black text-[10px] uppercase tracking-widest">Share Protocol</Button>
          <Button variant="primary" className="px-8 py-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20">Edit Mission</Button>
        </div>
      </div>

      {canApprove && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-[#0f172a] rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
            <Bot size={120} />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-left">
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Authorization Required</h3>
              <p className="text-slate-400 text-xs font-medium max-w-md leading-relaxed">
                This project is currently in <span className="text-blue-400 font-bold">"{statusCfg.label}"</span>. Review the budget of {project.budget} and technical parameters before granting clearance.
              </p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              {showRejectionInput ? (
                <div className="flex gap-2 w-full">
                  <input 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500/50"
                    placeholder="Reason for rejection..."
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                  />
                  <Button variant="danger" onClick={handleReject}>Reject</Button>
                  <Button variant="secondary" onClick={() => setShowRejectionInput(false)}>Cancel</Button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setShowRejectionInput(true)}
                    className="px-8 py-3.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                  >
                    <X size={14} /> Denied
                  </button>
                  <button 
                    onClick={() => onUpdateProjectStatus(project.id, project.status, 'Revision Requested')}
                    className="px-8 py-3.5 bg-white/5 text-slate-300 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <Clock size={14} /> Revision
                  </button>
                  <button 
                    onClick={handleApprove}
                    className="px-10 py-3.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
                  >
                    <CheckCircle2 size={16} /> Grant Clearance
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {project.status === 'rejected' && (
        <div className="p-8 bg-red-50 rounded-3xl border border-red-100 flex items-start gap-6 text-left">
           <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertCircle size={24} />
           </div>
           <div>
              <h3 className="text-sm font-black text-red-900 uppercase tracking-widest mb-1">Authorization Rejected</h3>
              <p className="text-red-700 text-xs font-medium">{project.rejection_reason || 'No specific reason provided by evaluator.'}</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Project Info & Tasks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <Card className="p-8 text-left bg-white border-slate-200 shadow-xl shadow-slate-200/20">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Mission Briefing</h3>
            <p className="text-slate-600 font-medium leading-relaxed mb-10 text-[15px]">
              {project.description}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Strategist</p>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-[10px]">{INITIALS(project.lead_name)}</div>
                   <p className="text-sm font-black text-slate-900 uppercase leading-none">{project.lead_name}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment Phase</p>
                <div className="flex items-center gap-3">
                   <Building2 size={16} className="text-slate-400" />
                   <p className="text-sm font-black text-slate-900 uppercase leading-none">{PHASES[project.phase - 1]}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Established</p>
                <div className="flex items-center gap-3">
                   <Clock size={16} className="text-slate-400" />
                   <p className="text-sm font-black text-slate-900 uppercase leading-none">24 APR 2026</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Tasks Section */}
          <Card className="p-8 text-left bg-white border-slate-200 shadow-xl shadow-slate-200/20 mb-8">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-10">Mission Protocol Roadmap</h3>
            <div className="relative flex justify-between items-start mb-14">
              <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 z-0 hidden md:block"></div>
              {PHASES.map((phase, idx) => {
                const isActive = project.phase === idx + 1;
                const isCompleted = project.phase > idx + 1;
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center group flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                      isActive ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/40" : 
                      isCompleted ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-slate-300 border-slate-100"
                    )}>
                      {isCompleted ? <CheckCircle2 size={18} /> : <span>{idx + 1}</span>}
                    </div>
                    <div className="mt-4 text-center">
                      <p className={cn(
                        "text-[9px] font-black uppercase tracking-widest transition-colors",
                        isActive ? "text-blue-600" : "text-slate-400"
                      )}>{phase}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-start gap-4">
                 <div className="p-2.5 bg-blue-100/50 text-blue-600 rounded-xl">
                    <Zap size={18} />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Focus</p>
                    <p className="text-xs font-black text-slate-900 uppercase">{PHASES[project.phase - 1]} Operations</p>
                 </div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="p-2.5 bg-emerald-100/50 text-emerald-600 rounded-xl">
                    <CheckCircle2 size={18} />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Criteria</p>
                    <p className="text-xs font-black text-slate-900 uppercase">Phase Integration Stable</p>
                 </div>
              </div>
            </div>
          </Card>

          {/* Tasks Section */}
          <Card className="p-8 text-left bg-white border-slate-200 shadow-xl shadow-slate-200/20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Deployment Pipeline</h3>
              <Badge className="bg-slate-50 text-slate-400 border border-slate-100 rounded-lg px-3 py-1 text-[10px] font-black">{projectTasks.length} NODES</Badge>
            </div>
            
            <div className="space-y-4">
              {projectTasks.length > 0 ? projectTasks.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-500/20 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      t.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {t.status === 'completed' ? <CheckCircle2 size={18} /> : <Target size={18} />}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{t.title}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{t.department}</span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.15em]",
                          t.priority === 'High' ? "text-red-500" : "text-amber-500"
                        )}>{t.priority} PRIORITY</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned to</p>
                      <p className="text-[11px] font-black text-slate-900 uppercase leading-none">{t.assigned_to}</p>
                    </div>
                    <Badge className={cn(
                      "px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest border",
                      t.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                      t.status === 'inprogress' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-white text-slate-400 border-slate-200"
                    )}>
                      {t.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No nodes dispatched for this mission.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Stats & Budget */}
        <div className="space-y-8">
           {/* Progress Card */}
           <Card className="p-8 text-left bg-white border-slate-200 shadow-xl shadow-slate-200/20">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Mission Velocity</h3>
              <div className="flex items-center justify-center relative mb-8">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50"/>
                  <motion.circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent"
                    strokeDasharray={364.4}
                    initial={{ strokeDashoffset: 364.4 }}
                    animate={{ strokeDashoffset: 364.4 - (364.4 * project.progress) / 100 }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="text-blue-600"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{project.progress}%</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</span>
                <Badge className="bg-white text-emerald-500 border border-emerald-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest">Optimal</Badge>
              </div>
           </Card>

           {/* Budget Card */}
           <Card className="p-8 text-left bg-white border-slate-200 shadow-xl shadow-slate-200/20">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Fiscal Allocation</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-end justify-between mb-4">
                    <div className="text-left">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total CapEx</p>
                       <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{project.budget}</h4>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilization</p>
                       <h4 className="text-xl font-black text-emerald-500 tracking-tighter leading-none">₹{(parseInt(project.budget.replace(/[^0-9]/g, '')) * 0.7 || 0).toLocaleString()}L</h4>
                    </div>
                  </div>
                  <div className="pbar h-3 bg-slate-50 border border-slate-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '70%' }}
                      className="pfill bg-emerald-500 shadow-lg shadow-emerald-500/20"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Approved</p>
                      <p className="text-sm font-black text-slate-900 uppercase">95% Flow</p>
                   </div>
                   <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Burn Rate</p>
                      <p className="text-sm font-black text-slate-900 uppercase">Sustainable</p>
                   </div>
                </div>
              </div>
           </Card>

            {/* Personnel Allocation */}
            <Card className="p-8 text-left bg-white border-slate-200 shadow-xl shadow-slate-200/20">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Personnel Deployment Hub</h3>
               <div className="space-y-4">
                 <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-blue-500/20">
                       {INITIALS(project.lead_name)}
                    </div>
                    <div>
                       <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{project.lead_name}</p>
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">MISSION COMMANDER</p>
                    </div>
                 </div>

                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Active Operatives</p>
                 <div className="space-y-3">
                   {volunteers.slice(0, 3).map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl group hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 font-black text-[9px] uppercase tracking-tighter">{INITIALS(v.name)}</div>
                           <div className="text-left">
                              <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{v.name}</p>
                              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{v.role}</p>
                           </div>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow"></div>
                      </div>
                   ))}
                 </div>
                 
                 {project.status === 'approved' && user?.role === 'Admin' && (
                    <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                       <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">HR Allocation Node</p>
                          <Badge className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">Pending Assignment</Badge>
                       </div>
                       <Button variant="secondary" className="w-full py-3.5 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-900 hover:text-white border-slate-200">Broadcast Personnel Call</Button>
                    </div>
                 )}
               </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

const SocialMediaView = () => {
  const posts = [
    { id: 1, platform: 'Instagram', title: 'Mission Update: Satara Water', status: 'Draft', type: 'Reel', date: '25 APR' },
    { id: 2, platform: 'LinkedIn', title: 'Corporate Partnership Announcement', status: 'In Review', type: 'Article', date: '26 APR' },
    { id: 3, platform: 'Twitter', title: 'Impact Metric Briefing', status: 'Scheduled', type: 'Thread', date: '27 APR' },
  ];

  return (
    <div className="space-y-10 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Content Pipeline</h3>
               <Button variant="primary" className="text-[10px] uppercase font-black tracking-widest">+ New Dispatch</Button>
            </div>
            <div className="space-y-4">
               {posts.map(post => (
                 <div key={post.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-blue-500/20 transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                          <Share2 size={20} />
                       </div>
                       <div>
                          <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{post.title}</h4>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[9px] font-black text-slate-400 border border-slate-200 px-2 py-0.5 rounded-lg uppercase">{post.platform}</span>
                             <span className="text-[9px] font-black text-slate-400 border border-slate-200 px-2 py-0.5 rounded-lg uppercase">{post.type}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{post.date}</p>
                          <Badge className="bg-white text-blue-600 border border-blue-100 font-black text-[9px] px-3 py-1 rounded-lg uppercase tracking-widest">{post.status}</Badge>
                       </div>
                       <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                 </div>
               ))}
            </div>
          </Card>
        </div>
        <div className="space-y-8">
           <Card className="p-8 bg-slate-900 text-white border-none">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Social Influence Node</h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aggregate Reach</span>
                    <span className="text-xl font-black tracking-tighter">12.4k</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Growth Delta</span>
                    <span className="text-xl font-black tracking-tighter text-emerald-400">+15.2%</span>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

const FundraisingView = () => {
  return (
    <div className="space-y-10 text-left">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Active Campaigns', value: '4' },
            { label: 'Avg Donation', value: '₹1,240' },
            { label: 'Donor Retention', value: '82%' }
          ].map((stat, i) => (
            <Card key={i} className="p-8">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
               <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
            </Card>
          ))}
       </div>
       <Card className="p-8 border-dashed border-2 border-slate-200 bg-slate-50 flex flex-col items-center justify-center py-20 text-slate-400">
          <Star size={44} className="mb-6 opacity-20" />
          <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Campaign Architect Hub</h3>
          <p className="text-[10px] font-black uppercase mt-2 tracking-widest opacity-30">Constructing Next Fiscal Cycle Initiative</p>
       </Card>
    </div>
  );
};

const ProjectsView = ({ projects, onOpenProject, onAdd, onDelete, user }: any) => {
  const [filter, setFilter] = useState('All Initiatives');
  
  const filteredProjects = projects.filter((p: any) => {
    if (user?.role === 'Volunteer' && p.creator_id !== auth.currentUser?.uid) return false;
    if (filter === 'All Initiatives') return true;
    if (filter === 'Active') return p.status === 'approved' || p.status === 'active';
    if (filter === 'Strategic Planning') return p.status === 'pending_dept_review' || p.status === 'pending_admin_review';
    if (filter === 'Archived') return p.status === 'completed' || p.status === 'rejected';
    return true;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_dept_review': return { label: 'DEPT REVIEW', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
      case 'pending_admin_review': return { label: 'ADMIN REVIEW', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
      case 'approved': return { label: 'APPROVED', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case 'rejected': return { label: 'REJECTED', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
      default: return { label: status.toUpperCase(), color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide gap-2">
          {['All Initiatives', 'Active', 'Strategic Planning', 'Archived'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 md:px-5 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border transition-all shadow-sm whitespace-nowrap",
                filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:text-blue-600 hover:border-blue-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Button variant="primary" className="flex items-center gap-3 w-full md:w-auto justify-center px-8 py-4 md:py-3 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all" onClick={onAdd}>
          <Plus size={16} /> <span className="uppercase tracking-[0.1em] font-black text-[11px]">Add Project</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10 md:pb-0">
        {filteredProjects.map((p: any) => {
          const statusCfg = getStatusConfig(p.status);
          return (
            <Card key={p.id} className="p-8 group cursor-pointer border-slate-200 bg-white shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-blue-500/10 relative overflow-hidden" onClick={() => onOpenProject(p.id)}>
              <div className="flex items-start justify-between mb-8">
                <div className="flex flex-col items-start gap-2">
                  <Badge className="bg-blue-50 text-blue-600 border border-blue-100 px-4 py-1.5 rounded-xl">{p.tag}</Badge>
                   <Badge className={cn("px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded-md", statusCfg.bg, statusCfg.color, statusCfg.border)}>
                    {statusCfg.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">FUND: {p.budget}</div>
                  {user?.role === 'Admin' && (
                    <button 
                      onClick={(e) => onDelete(p.id, e)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-black text-slate-900 text-xl mb-4 group-hover:text-blue-600 transition-colors tracking-tight text-left uppercase leading-none">{p.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-6 font-medium text-left">{p.description}</p>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span className="text-blue-600">PHASE {p.phase}</span>
                    <span className="text-slate-900">{p.progress}%</span>
                  </div>
                  <div className="pbar h-2 bg-slate-50 border border-slate-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      className="pfill bg-blue-600 shadow-lg shadow-blue-500/20"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black text-[11px] shadow-sm">
                      {INITIALS(p.lead_name)}
                    </div>
                    <div className="text-left">
                       <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-none">{p.lead_name}</span>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-slate-300 group-hover:text-blue-600 transition-colors transform group-hover:translate-x-1 duration-300">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const TasksView = ({ tasks }: any) => {
  const columns = [
    { id: 'todo', label: 'Mission Backlog', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { id: 'inprogress', label: 'Operational Pipeline', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { id: 'completed', label: 'Archived Output', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' }
  ];

  return (
    <div className="space-y-6 md:space-y-10 h-[calc(100vh-220px)] md:h-auto overflow-hidden">
      <div className="flex overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory gap-6 md:gap-8 custom-scrollbar">
        {columns.map(col => (
          <div key={col.id} className="min-w-[85vw] md:min-w-0 md:flex-1 space-y-6 snap-center first:pl-2 last:pr-2 md:first:pl-0 md:last:pr-0">
            <div className={cn("px-6 py-4 border rounded-3xl flex items-center justify-between bg-white shadow-xl shadow-slate-200/20", col.border)}>
              <span className={cn("text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-xl", col.bg, col.color)}>{col.label}</span>
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100 uppercase">
                {tasks.filter((t: any) => t.status === col.id).length} units
              </span>
            </div>
            
            <div className="space-y-4 md:space-y-5 text-left h-[calc(100vh-320px)] md:h-auto overflow-y-auto pr-1 custom-scrollbar">
              {tasks.filter((t: any) => t.status === col.id).map((task: any) => (
                <Card key={task.id} className="p-7 border-l-4 border-l-blue-600 transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-6">
                    <h5 className="text-[13px] font-black text-slate-900 uppercase tracking-widest leading-relaxed">{task.title}</h5>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-8">
                    <Badge className="bg-slate-50 text-slate-400 border border-slate-100 font-black text-[9px] px-3 py-1 rounded-lg uppercase tracking-widest">{task.department}</Badge>
                    <Badge className={cn(
                      "text-[9px] font-black tracking-[0.2em] px-3 py-1 border rounded-lg",
                      task.priority === 'High' ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100"
                    )}>{task.priority}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-2xl bg-white flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200 shadow-sm uppercase tracking-widest leading-none">
                        {INITIALS(task.assigned_to)}
                      </div>
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">{task.assigned_to}</span>
                    </div>
                    {task.status !== 'completed' && (
                      <button className="text-slate-300 hover:text-blue-600 transition-all p-2 bg-slate-50 rounded-xl hover:bg-blue-50 group">
                        <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
              {tasks.filter((t: any) => t.status === col.id).length === 0 && (
                <div className="py-24 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/50">
                  <CheckSquare size={44} className="mb-6 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Zero Tasks Pending</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VolunteersView = ({ volunteers, onAdd }: any) => {
  return (
    <Card className="shadow-2xl shadow-slate-200/40 border-slate-200">
      <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="text-left">
          <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-xs">Mission Personnel Hub</h3>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Direct Deployment Registry</p>
        </div>
        <Button variant="primary" className="text-[10px] font-black px-6 py-3 uppercase tracking-widest rounded-xl" onClick={onAdd}>+ Onboard Operative</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">
              <th className="px-10 py-6">Operative Identity</th>
              <th className="px-10 py-6">Assigned Sector</th>
              <th className="px-10 py-6">Skill Matrix</th>
              <th className="px-10 py-6">Runtime</th>
              <th className="px-10 py-6 text-center">Protocol Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {volunteers.map((v: any) => (
              <tr key={v.id} className="hover:bg-slate-50/50 transition-all group border-none">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-5">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 text-xs font-black shadow-sm group-hover:scale-110 transition-transform">
                      {INITIALS(v.name)}
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-slate-900 tracking-tight">{v.name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{v.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <Badge className="bg-slate-100 text-slate-500 border border-slate-200 px-4 py-1.5 rounded-xl">{v.department}</Badge>
                </td>
                <td className="px-10 py-6">
                  <p className="text-[12px] text-slate-600 font-bold truncate max-w-[200px]">{v.skills}</p>
                </td>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                    <span className="font-mono text-[12px] font-black text-slate-900 tracking-tight">{v.hours}H LOGGED</span>
                  </div>
                </td>
                <td className="px-10 py-6 text-center">
                  <Badge className={cn(
                    "font-black tracking-[0.2em] px-4 py-2 border rounded-2xl",
                    v.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100 opacity-60"
                  )}>
                    {v.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// --- Finance View Data ---
const EXPENDITURE_DATA = [
  { month: 'Nov', amount: 45000 },
  { month: 'Dec', amount: 52000 },
  { month: 'Jan', amount: 38000 },
  { month: 'Feb', amount: 65000 },
  { month: 'Mar', amount: 48000 },
  { month: 'Apr', amount: 59000 },
];

const DONATION_DATA = [
  { month: 'Nov', amount: 80000 },
  { month: 'Dec', amount: 95000 },
  { month: 'Jan', amount: 72000 },
  { month: 'Feb', amount: 110000 },
  { month: 'Mar', amount: 88000 },
  { month: 'Apr', amount: 120000 },
];

const ALLOCATION_DATA = [
  { name: 'Health', value: 400, color: '#3b82f6' },
  { name: 'Education', value: 300, color: '#10b981' },
  { name: 'Environment', value: 200, color: '#f59e0b' },
  { name: 'Community', value: 100, color: '#6366f1' },
];

const FinanceView = () => {
  const [financeRequests, setFinanceRequests] = useState<FinanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'finance_requests'), orderBy('requested_at', 'desc'), limit(10));
    return onSnapshot(q, (snapshot) => {
      setFinanceRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceRequest)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. System Metrics & Hubs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Operational Efficiency', value: '94.2%', icon: Zap, color: 'text-emerald-500', trend: '+2.1%' },
          { label: 'Asset Utilization', value: '78.5%', icon: Target, color: 'text-blue-500', trend: '-0.4%' },
          { label: 'Fund Health Index', value: 'Gold', icon: Star, color: 'text-amber-500', trend: 'Stable' },
          { label: 'Burn Rate Alpha', value: 'Sustainable', icon: TrendingUp, color: 'text-indigo-500', trend: 'Optimal' },
        ].map((hub, i) => (
          <div key={i} className="p-5 md:p-8 bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] shadow-xl shadow-slate-200/20 group hover:border-blue-500/20 transition-all">
            <div className={cn("p-2.5 md:p-3 w-fit rounded-xl mb-4 md:mb-6 bg-slate-50 group-hover:scale-110 transition-transform", hub.color)}>
               <hub.icon size={18} />
            </div>
            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{hub.label}</p>
            <h4 className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter leading-none">{hub.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Pending Requests from Projects */}
        <Card className="p-8 bg-white border-slate-200 shadow-xl shadow-slate-200/20 text-left">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Live Budget Requisitions</h3>
              <Badge className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 font-black text-[9px] uppercase tracking-widest">{financeRequests.length} Nodes</Badge>
           </div>
           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {financeRequests.length > 0 ? financeRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-500/20 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black text-xs shadow-sm">
                         FR
                      </div>
                      <div className="text-left">
                         <p className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1">{req.project_name}</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REQ_ID: {req.id}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-emerald-600 tracking-tighter">{req.amount}</p>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg mt-1 block w-fit ml-auto",
                        req.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      )}>{req.status}</Badge>
                   </div>
                </div>
              )) : (
                <div className="py-20 flex flex-col items-center justify-center opacity-20">
                   <IndianRupee size={48} />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4">Zero Pending Requests</p>
                </div>
              )}
           </div>
        </Card>

        {/* Donation Inflows */}
        <Card className="p-8 bg-white border-slate-200 shadow-xl shadow-slate-200/20 text-left">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Donation Inflow Pulse
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DONATION_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                   tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontWeight: 900,
                    fontSize: '11px',
                    textTransform: 'uppercase'
                  }} 
                />
                <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Budget Allocation Pie */}
        <Card className="p-8 bg-white border-slate-200 shadow-xl shadow-slate-200/20 text-left">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Asset Allocation Matrix</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ALLOCATION_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {ALLOCATION_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Ops</span>
                <span className="text-xl font-black text-slate-900 leading-none">100%</span>
              </div>
            </div>
            <div className="space-y-4">
               {ALLOCATION_DATA.map((item) => (
                 <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.name}</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-900">{(item.value / 10).toFixed(0)}%</span>
                 </div>
               ))}
            </div>
          </div>
        </Card>

        {/* Transaction Summary Logic Card */}
        <Card className="p-8 bg-white border-slate-200 shadow-xl shadow-slate-200/20 text-left overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={120} className="text-blue-600" />
           </div>
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Financial Equilibrium</h3>
           <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 relative z-10">
             System diagnostics indicate high fiscal stability. All sectors are currently operating within pre-approved budgetary bounds with a positive growth delta of 15% YoY.
           </p>
           <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Ops Efficiency</p>
                 <h4 className="text-2xl font-black text-blue-900 tracking-tighter">94.2%</h4>
              </div>
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
                 <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Fund Health</p>
                 <h4 className="text-2xl font-black text-emerald-900 tracking-tighter">Optimal</h4>
              </div>
           </div>
        </Card>
      </div>

      {/* Ledger Stream (Previously Existing) */}
      <Card className="p-8 border-slate-200 shadow-xl shadow-slate-200/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="text-left">
            <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-xs">Ledger Stream</h3>
            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Real-time Fiscal Propagation</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="text-[10px] px-6 py-3 font-black rounded-xl uppercase tracking-widest">Export Dataset</Button>
            <Button variant="primary" className="text-[10px] px-6 py-3 font-black rounded-xl uppercase tracking-widest shadow-xl shadow-blue-500/20">+ Log Pulse</Button>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { date: '22 Apr', desc: 'Campaign Materials - Satara', cat: 'Campaign', amount: '-₹12,400', type: 'debit' },
            { date: '21 Apr', desc: 'Monthly Donor - Anupama S.', cat: 'Donation', amount: '+₹5,000', type: 'credit' },
            { date: '20 Apr', desc: 'Site Audit Expense', cat: 'Operations', amount: '-₹3,200', type: 'debit' },
            { date: '18 Apr', desc: 'CSR Fund - Tech Corp', cat: 'Grant', amount: '+₹1,50,000', type: 'credit' }
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:border-blue-500/20 transition-all group text-left">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.date.split(' ')[1]}</span>
                  <span className="text-lg font-black text-slate-900 leading-none mt-1">{t.date.split(' ')[0]}</span>
                </div>
                <div>
                  <h5 className="text-[13px] font-black text-slate-900 tracking-tight uppercase mb-2">{t.desc}</h5>
                  <Badge className="bg-white text-slate-400 border border-slate-200 px-3 py-1 text-[9px] tracking-widest">{t.cat}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("text-lg font-black tracking-tighter", t.type === 'debit' ? "text-red-500" : "text-emerald-500")}>{t.amount}</p>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", t.type === 'debit' ? "bg-red-400" : "bg-emerald-400")}></div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Authorized</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const ChatbotView = ({ projects, tasks, volunteers }: any) => {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Namaste! I am the Garad Hub OS Assistant. System diagnostics show optimal performance. How can I assist your mission today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const context = useMemo(() => {
    return `
      PROJECTS: ${projects.map((p: any) => p.name).join(', ')}
      TASKS: ${tasks.length} total, ${tasks.filter((t: any) => t.status === 'completed').length} completed
      VOLUNTEERS: ${volunteers.length} total active members
    `;
  }, [projects, tasks, volunteers]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const reply = await askAssistant(userMsg, context);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failure. AI terminal unresponsive.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-auto lg:h-[calc(100vh-280px)] min-h-[500px]">
      <div className="lg:col-span-3 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/20 overflow-hidden order-1 lg:order-1">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <Bot size={26} />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-black text-slate-900 tracking-[0.2em] uppercase leading-none">Garad Neural Hub</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest leading-none">OS Operational</span>
              </div>
            </div>
          </div>
          <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest px-5 py-2.5 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all bg-white shadow-sm">Export Audit Log</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-10 scroll-smooth custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex items-start gap-4 md:gap-6", m.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn(
                "w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2",
                m.role === 'user' ? "bg-white text-slate-400 border-slate-100" : "bg-blue-600 text-white border-blue-400"
              )}>
                {m.role === 'user' ? <Users size={18} /> : <Bot size={20} />}
              </div>
              <div className={cn(
                "p-5 md:p-7 rounded-3xl max-w-[90%] md:max-w-[85%] text-[13px] md:text-sm leading-relaxed border shadow-sm",
                m.role === 'user' 
                  ? "bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-blue-500/10 font-medium" 
                  : "bg-slate-50 text-slate-700 border-slate-100 rounded-tl-none font-medium text-left"
              )}>
                <div className="markdown-body">
                  <Markdown>{m.content}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start gap-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 border-2 border-blue-400 shadow-xl shadow-blue-500/20">
                <Bot size={20} />
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl rounded-tl-none border border-slate-100 flex gap-2 items-center shadow-sm">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50">
          <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 focus-within:border-blue-600 focus-within:shadow-xl focus-within:shadow-blue-500/10 transition-all p-1 shadow-inner">
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none py-4 px-6 md:px-8 focus:outline-none text-[13px] md:text-sm placeholder-slate-300 text-slate-900 font-black uppercase tracking-widest"
              placeholder="Direct Transmission to neural link..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 group active:scale-95"
            >
              <Zap size={20} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <Card className="p-6 text-left">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Inquiry Protocols</h4>
          <div className="space-y-4">
            {Object.entries(PAGE_TITLES).slice(0, 4).map(([id, title]) => (
              <button 
                key={id} 
                onClick={() => setInput(`Give me a summary of ${title}`)}
                className="w-full text-left p-5 text-[11px] font-black text-slate-600 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all uppercase tracking-widest active:scale-[0.98] shadow-sm leading-tight"
              >
                {title} Audit
              </button>
            ))}
          </div>
        </Card>
        
        <Card className="p-8 bg-slate-900 border-none shadow-2xl shadow-slate-900/20 text-left">
          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Metrics Terminal</h4>
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Outflow</span>
              <span className="text-sm font-black text-white tracking-tighter">₹3.92L</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Units</span>
              <span className="text-sm font-black text-white tracking-tighter">842</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grant Flow</span>
              <span className="text-sm font-black text-white tracking-tighter">4 Nodes</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- Utilities ---

// --- Utilities ---
const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  );
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const INITIALS = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard Overview',
  projects: 'Project Portfolio',
  tasks: 'Task Board',
  volunteers: 'Volunteer Network',
  finance: 'Financial Ledger',
  docs: 'Documentation Hub',
  social: 'Social Media Pipeline',
  fundraising: 'Fundraising Campaigns',
  chatbot: 'AI Assistant',
  automation: 'Automation Lab',
  'project-detail': 'Project Details'
};
