/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import FinanceDashboard from './components/FinanceDashboard';
import SocialMediaDashboard from './components/SocialMediaDashboard';
import PublicRelationsDashboard from './components/PublicRelationsDashboard';
import UserManagement from './components/UserManagement';
import AutomationView from './components/AutomationView';
import { sendEmail } from './services/emailService';
import { BudgetPlanner } from './components/BudgetPlanner';
import { DocumentVault } from './components/DocumentVault';
import { FileUploadModal } from './components/FileUploadModal';
import { VolunteerApplicationForm } from './components/VolunteerApplication';
import { VolunteerDirectory } from './components/VolunteerDirectory';
import { VolunteerProfile } from './components/VolunteerProfile';
import { MilestoneStepper } from './components/MilestoneStepper';
import { VelocityGauge } from './components/VelocityGauge';
import { generateProjectImpactReport } from './services/reportGenerator';
import { generateVolunteerCertificate } from './services/certificateGenerator';
import { TaskEngine } from './components/TaskEngine';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  IndianRupee, 
  FileText, 
  Share2, 
  Star, 
  Zap, 
  Search, 
  Bell, 
  Megaphone,
  Camera,
  Shield,
  Database,
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
  Trash2,
  ClipboardCheck,
  ShieldCheck,
  Trophy,
  Send,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import ExpenseApprovalDashboard from './components/ExpenseApprovalDashboard';
import { VolunteerFinanceDashboard } from './components/VolunteerFinanceDashboard';
import { MobileShell } from './components/MobileShell';
import { MissionDetailView } from './components/project/MissionDetailView';
import { sendPushNotification } from './lib/push';
import OneSignal from 'react-onesignal';
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
import { differenceInDays, parseISO, isFuture, isPast, format } from 'date-fns';
import { cn, getWhatsAppLink } from './lib/utils';
import { 
  BudgetItem, 
  Project, 
  Task, 
  Volunteer, 
  Transaction, 
  Campaign, 
  AppUser, 
  AppNotification, 
  BudgetRequest, 
  FinanceRequest, 
  NGODocument,
  VolunteerApplication,
  WorkLog,
  VolunteerCertificate,
  Milestone,
  ActivityLog,
  TaskStatus,
  ExpenseRequest
} from './types';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_VOLUNTEERS, TEAM, DEPT_COLORS, PHASES } from './constants';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp, query, doc, updateDoc, getDocFromServer, getDocs, deleteDoc, orderBy, limit, writeBatch, where, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// --- Firebase Initialization ---
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Secondary App (Used only for creating users to avoid logout)
const secondaryApp = getApps().find(a => a.name === "Secondary") 
                     || initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

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
  toast.error(`Security Clearance Error: ${operationType} on ${path}`);
  // Do NOT throw, to keep the app alive
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

type Page = 'dashboard' | 'projects' | 'tasks' | 'volunteers' | 'finance' | 'docs' | 'social-media' | 'public-relations' | 'fundraising' | 'automation' | 'project-detail' | 'users' | 'expense-approvals' | 'roadmap' | 'new-proposal' | 'finance-requests' | 'kyc';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [documents, setDocuments] = useState<NGODocument[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [certificates, setCertificates] = useState<VolunteerCertificate[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [financeRequests, setFinanceRequests] = useState<FinanceRequest[]>([]);
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Modal States
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [proofTaskTargetId, setProofTaskTargetId] = useState<string | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // --- Auth & Data Fetching ---
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Listen to user profile in real-time
        unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), async (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUser({
              uid: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || 'Member',
              email: firebaseUser.email || '',
              role: data.role || 'Staff Operative',
              department: data.department || 'General'
            });
            setAuthInitialized(true);
          } else {
            // Auto-provision profile if missing (Migration/Bootstrap)
            const role = firebaseUser.email === 'riteshgarad4@gmail.com' ? 'Admin' : 'Staff Operative';
            const initialProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
              email: firebaseUser.email || '',
              role: role,
              department: 'General',
              isActive: true,
              createdAt: serverTimestamp()
            };
            
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), initialProfile);
              setUser(initialProfile as any);
              setAuthInitialized(true);
            } catch (err) {
              console.error("Profile bootstrap failed:", err);
              setUser({
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
                email: firebaseUser.email || '',
                role: role,
                department: 'General'
              });
              setAuthInitialized(true);
            }
          }
        }, (err) => {
          console.error("Profile Snapshot Error:", err);
          handleFirestoreError(err, 'get' as any, `users/${firebaseUser.uid}`);
          setAuthInitialized(true);
        });
      } else {
        if (unsubProfile) unsubProfile();
        setUser(null);
        setAuthInitialized(true);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  useEffect(() => {
    const initOneSignal = async () => {
      const appId = (import.meta as any).env.VITE_ONESIGNAL_APP_ID;
      if (appId) {
        try {
          await OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
              enable: true,
              position: 'bottom-right',
              size: 'medium',
              displayPredicate: () => true,
              showCredit: false,
              prenotify: true,
            } as any,
          });
          console.log("OneSignal Status: Active");
        } catch (err) {
          console.error("OneSignal Initialization Error:", err);
        }
      }
    };
    initOneSignal();
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
      (snapshot) => setVolunteers(snapshot.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          ...data,
          skills: Array.isArray(data.skills) ? data.skills : (typeof data.skills === 'string' ? data.skills.split(',').map((s: string) => s.trim()) : [])
        } as Volunteer;
      })),
      (err) => handleFirestoreError(err, 'list', 'volunteers')
    );

    const unsubDocuments = onSnapshot(collection(db, 'documents'),
      (snapshot) => setDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NGODocument))),
      (err) => handleFirestoreError(err, 'list', 'documents')
    );

    const unsubFinance = (user.role === 'Admin' || (user.role === 'Dept Head' && user.department === 'Finance')) 
      ? onSnapshot(collection(db, 'finance_requests'),
          (snapshot) => setFinanceRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FinanceRequest))),
          (err) => handleFirestoreError(err, 'list', 'finance_requests')
        )
      : () => {};

    const unsubBudgets = (user.role === 'Admin' || user.role === 'Dept Head')
      ? onSnapshot(collection(db, 'budget_requests'),
          (snapshot) => setBudgetRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BudgetRequest))),
          (err) => handleFirestoreError(err, 'list', 'budget_requests')
        )
      : () => {};

    const unsubActivityLogs = (user.role === 'Admin')
      ? onSnapshot(query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50)),
          (snapshot) => setActivityLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog))),
          (err) => handleFirestoreError(err, 'list', 'activity_logs')
        )
      : () => {};

    const unsubApps = (user.role === 'Admin' || (user.role === 'Dept Head' && user.department === 'HR'))
      ? onSnapshot(collection(db, 'volunteer_applications'),
          (snapshot) => setApplications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerApplication))),
          (err) => handleFirestoreError(err, 'list', 'volunteer_applications')
        )
      : () => {};

    const unsubTransactions = (user.role === 'Admin' || (user.role === 'Dept Head' && user.department === 'Finance'))
      ? onSnapshot(collection(db, 'transactions'),
          (snapshot) => setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))),
          (err) => handleFirestoreError(err, 'list', 'transactions')
        )
      : () => {};

    const unsubExpenseRequests = (user.role === 'Admin' || (user.role === 'Department Head' && user.department === 'Finance'))
      ? onSnapshot(collection(db, 'expense_requests'),
          (snapshot) => setExpenseRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRequest))),
          (err) => handleFirestoreError(err, 'list', 'expense_requests')
        )
      : () => {};

    const unsubLogs = onSnapshot(collection(db, 'work_logs'),
      (snapshot) => setWorkLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WorkLog))),
      (err) => handleFirestoreError(err, 'list', 'work_logs')
    );

    const unsubCerts = onSnapshot(collection(db, 'volunteer_certificates'),
      (snapshot) => setCertificates(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerCertificate))),
      (err) => handleFirestoreError(err, 'list', 'volunteer_certificates')
    );

    return () => {
      unsubProjects();
      unsubTasks();
      unsubVolunteers();
      unsubDocuments();
      unsubFinance();
      unsubBudgets();
      unsubActivityLogs();
      unsubApps();
      unsubTransactions();
      unsubExpenseRequests();
      unsubLogs();
      unsubCerts();
    };
  }, [user]);

  useEffect(() => {
    if (!selectedProjectId || !user) {
      setMilestones([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'projects', selectedProjectId, 'milestones'), 
      (snapshot) => setMilestones(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Milestone))),
      (err) => handleFirestoreError(err, 'list', `projects/${selectedProjectId}/milestones`)
    );
    return () => unsub();
  }, [selectedProjectId, user]);

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
        if (!task) return;
        const status = task.status as any;
        const dueDateStr = (task as any).due_date || (task as any).dueDate;
        
        if (status !== 'done' && status !== 'completed' && dueDateStr) {
          const dueDate = parseISO(dueDateStr);
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
        if (!project) return;
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

  const handleCreateProject = async (formData: any) => {
    if (!auth.currentUser || !user) return;
    try {
      const projectRef = await addDoc(collection(db, 'projects'), {
        ...formData,
        status: "pending_dept_review",
        phase: 1,
        progress: 0,
        budget_status: "pending",
        created_at: serverTimestamp(),
        creator_id: auth.currentUser.uid,
        department: formData.department || user.department || "General"
      });

      // Itemized Budget Request Integration
      if (formData.budget_items && formData.budget_items.length > 0) {
        const totalBudget = formData.budget_items.reduce((acc: number, curr: any) => acc + Number(curr.cost), 0);
        await addDoc(collection(db, 'budget_requests'), {
          projectId: projectRef.id,
          projectName: formData.name,
          proposerId: user.uid,
          proposedBy: user.name,
          department: formData.department || user.department || "General",
          itemizedList: formData.budget_items,
          totalAmount: totalBudget,
          status: 'pending_finance',
          submittedAt: serverTimestamp()
        });
      }

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

      // Add Progress auto-update for completion
      if (newStatus === 'completed') {
        updateData.progress = 100;
      }

      await updateDoc(projectRef, updateData);

      // Automated Email Notification for status change
      try {
        const projectDoc = projects.find(p => p.id === projectId);
        if (projectDoc) {
          await sendEmail({
            requesterEmail: projectDoc.creator_email || "riteshgarad4@gmail.com",
            amount: "0", // Contextual for project status
            status: newStatus.toUpperCase(),
            requesterName: projectDoc.name,
            reason: reason
          });
        }
      } catch (err) {
        console.warn("Project status email notification failed:", err);
      }

      // Trigger Auto-Report Generation if completed
      if (newStatus === 'completed') {
        const proj = projects.find(p => p.id === projectId);
        if (proj) {
          const projectTransactions = transactions.filter(t => t.projectID === projectId);
          generateProjectImpactReport(proj, proj.budget_items || [], projectTransactions);
          toast.success("Impact Report auto-generated successfully.");
        }
      }

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
        hours: formData.hours || 0,
        impactPoints: formData.impactPoints || 0,
        badges: formData.badges || [],
        status: formData.status || "Active",
        joinDate: serverTimestamp()
      });
      setIsVolunteerModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, 'create', 'volunteers');
    }
  };

  const handleAddVolunteer = (data?: any) => {
    if (data && typeof data === 'object' && data.name) {
      handleCreateVolunteer(data);
    } else {
      setIsVolunteerModalOpen(true);
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

  const handleUploadDocument = async (data: any) => {
    if (!user || !auth.currentUser) return;
    try {
      // 1. Create status-based triggers (e.g. Finance link)
      const docData: Partial<NGODocument> = {
        fileName: data.fileName,
        fileURL: data.fileURL,
        category: data.category,
        description: data.description || '',
        projectId: data.projectId || '',
        projectName: data.projectName || 'General',
        status: 'pending',
        uploadedBy: user.name,
        uploaderId: user.uid,
        uploadDate: serverTimestamp(),
        metadata: {
          size: `${((data.fileSize || 0) / 1024 / 1024).toFixed(2)} MB`,
          type: data.fileType || 'unknown',
          uploadedAt: serverTimestamp()
        }
      };

      const docRef = await addDoc(collection(db, 'documents'), docData);
      
      // Handle task proof-of-work link
      if (proofTaskTargetId) {
        await handleTaskStatusChange(proofTaskTargetId, 'done');
        await updateDoc(doc(db, 'tasks', proofTaskTargetId), {
          relatedDocId: docRef.id
        });
        setProofTaskTargetId(null);
      }
      
      // Inter-departmental trigger: Auto-link Invoice to a transaction if relevant info exists
      if (data.category === 'Invoice' && data.projectId) {
        toast('Finance node notified of new invoice receipt.', { icon: '📊' });
      }

      toast.success("Document Sealed in Vault.");
    } catch (err) {
      handleFirestoreError(err, 'create', 'documents');
    }
  };

  const handleVerifyDocument = async (id: string, status: 'verified' | 'rejected', reason?: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'documents', id);
      await updateDoc(docRef, {
        status,
        rejectionReason: reason || '',
        reviewedBy: user.name,
        reviewedAt: serverTimestamp()
      });
      toast.success(`Protocol executed: Document node marked as ${status}.`);
    } catch (err) {
      handleFirestoreError(err, 'update', `documents/${id}`);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Perform hard deletion on this record?")) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
      toast.success("Record expunged from repository.");
    } catch (err) {
      handleFirestoreError(err, 'delete', `documents/${id}`);
    }
  };

  // --- Volunteer Handlers ---
  const handleVolunteerApplication = async (appData: any) => {
    setIsUpdateLoading(true);
    try {
      await addDoc(collection(db, 'volunteer_applications'), {
        ...appData,
        status: 'pending_verification',
        appliedAt: serverTimestamp()
      });
      toast.success("Application submitted successfully.");
    } catch (err) {
      handleFirestoreError(err, 'create', 'volunteer_applications');
    } finally {
      setIsUpdateLoading(false);
    }
  };

  const handleApproveApplication = async (app: VolunteerApplication) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // 1. Create Volunteer record
      const volunteerRef = doc(collection(db, 'volunteers'));
      batch.set(volunteerRef, {
        name: app.name,
        email: app.email,
        skills: app.skills,
        role: 'Volunteer',
        department: 'General',
        hours: 0,
        status: 'Active',
        impactPoints: 0,
        badges: ['Newbie'],
        joinDate: serverTimestamp()
      });

      // 2. Update Application status
      batch.update(doc(db, 'volunteer_applications', app.id), {
        status: 'approved',
        reviewedBy: user.name,
        reviewedAt: serverTimestamp()
      });

      // 3. Update User Role if account exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', app.email));
      const userSnap = await getDocs(q);
      
      if (!userSnap.empty) {
        userSnap.forEach(userDoc => {
          batch.update(userDoc.ref, { role: 'Volunteer' });
        });
      }

      await batch.commit();
      toast.success(`Protocol executed. ${app.name} has been onboarded.`);
    } catch (err) {
      handleFirestoreError(err, 'update', `volunteer_applications/${app.id}`);
    }
  };

  const logActivity = async (log: Partial<ActivityLog>) => {
    try {
      await addDoc(collection(db, 'activity_logs'), {
        ...log,
        timestamp: serverTimestamp(),
        userId: user?.uid,
        userName: user?.name
      });
    } catch (err) {
      console.error("Activity logging failed:", err);
    }
  };

  const handleAddTask = async (taskData?: Partial<Task>) => {
    if (!user) return;
    if (!taskData || !taskData.title) {
      setIsAddTaskModalOpen(true);
      return;
    }
    try {
      // Find project safely to avoid property access on undefined/null
      const project = projects.find(p => p && p.id === taskData.projectId);
      await addDoc(collection(db, 'tasks'), {
        ...taskData,
        projectName: project?.name || 'Unknown Project',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        creatorName: user.name
      });
      
      logActivity({
        type: 'system',
        message: `New data bridge created: "${taskData.title}" for ${project?.name || 'Unknown'}`,
        projectId: taskData.projectId,
        projectName: project?.name
      });
      
      setIsAddTaskModalOpen(false);
      toast.success("Protocol Injected. Data bridge established.");
    } catch (err) {
      handleFirestoreError(err, 'create', 'tasks');
    }
  };

  const handleTaskStatusChange = async (id: string, newStatus: TaskStatus) => {
    if (!user) return;
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const batch = writeBatch(db);
      const taskRef = doc(db, 'tasks', id);

      // 1. Update Task Status
      batch.update(taskRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'done' ? { completedAt: serverTimestamp() } : {})
      });

      // 2. Cascade Logic if status is 'done'
      if (newStatus === 'done') {
        // A. Velocity Sync: Update Project Progress
        const projectRef = doc(db, 'projects', task.projectId);
        const project = projects.find(p => p.id === task.projectId);
        if (project) {
          const newProgress = Math.min(100, (project.progress || 0) + task.impactValue);
          batch.update(projectRef, { 
            progress: newProgress,
            // If progress hits 100, maybe mark project as completed? No, keep it active until manual closure.
          });
          
          logActivity({
            type: 'project_updated',
            message: `${project.name} Velocity increased to ${newProgress}%`,
            projectId: task.projectId,
            projectName: project.name
          });
        }

        // B. Dependency Engine: Unlock dependent tasks
        const dependents = tasks.filter(t => t.dependencyId === task.id);
        dependents.forEach(dep => {
          batch.update(doc(db, 'tasks', dep.id), {
            status: 'todo',
            updatedAt: serverTimestamp()
          });
          logActivity({
            type: 'finance_unlocked',
            message: `Dependency cleared: "${dep.title}" is now UNLOCKED`,
            projectId: dep.projectId,
            projectName: dep.projectName
          });
        });

        // C. Finance Inter-link: If Finance task, create ledger entry
        if (task.assignedDept === 'Finance' && task.budget) {
          const transRef = doc(collection(db, 'transactions'));
          batch.set(transRef, {
            type: 'expense',
            amount: task.budget,
            category: 'Operational',
            description: `Automated disbursement for Task: ${task.title}`,
            projectID: task.projectId,
            status: 'cleared',
            date: serverTimestamp(),
            createdBy: 'System (TaskEngine)',
            expenditureType: 'Procurement'
          });
          logActivity({
            type: 'finance_unlocked',
            message: `Disbursement protocol executed for "${task.title}": $${task.budget}`,
            projectId: task.projectId,
            projectName: task.projectName
          });
        }

        logActivity({
          type: 'task_completed',
          message: `Mission Node Completed: "${task.title}"`,
          projectId: task.projectId,
          projectName: task.projectName
        });
      }

      await batch.commit();
      toast.success(`Protocol status: ${newStatus.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, 'update', `tasks/${id}`);
    }
  };

  const handleLogHours = async (logData: any) => {
    try {
      await addDoc(collection(db, 'work_logs'), {
        ...logData,
        status: 'pending',
        date: logData.date instanceof Date ? logData.date : serverTimestamp()
      });
      toast.success("Hours logged. Pending verification by Sector Lead.");
    } catch (err) {
      handleFirestoreError(err, 'create', 'work_logs');
    }
  };

  const handleVerifyWorkLog = async (logId: string, status: 'verified' | 'rejected') => {
    if (!user) return;
    try {
      const log = workLogs.find(l => l.id === logId);
      if (!log) return;

      const batch = writeBatch(db);
      
      // 1. Update Log Status
      batch.update(doc(db, 'work_logs', logId), {
        status,
        verifiedBy: user.name,
        verifiedAt: serverTimestamp()
      });

      // 2. If verified, update volunteer hours and points
      if (status === 'verified') {
        const vRef = doc(db, 'volunteers', log.volunteerId);
        const currentV = volunteers.find(v => v.id === log.volunteerId);
        if (currentV) {
          batch.update(vRef, {
            hours: (currentV.hours || 0) + log.hours,
            impactPoints: (currentV.impactPoints || 0) + (log.hours * 10)
          });
        }
      }

      await batch.commit();
      toast.success(`Contribution ${status}. Records synchronized.`);
    } catch (err) {
      handleFirestoreError(err, 'update', `work_logs/${logId}`);
    }
  };

  const handleGenerateCertificate = async (volunteerId: string, projectId: string) => {
    if (!user) return;
    try {
      const v = volunteers.find(v => v.id === volunteerId);
      const p = projects.find(p => p.id === projectId);
      
      if (!v || !p) {
        toast.error("Internal Error: Entity not found.");
        return;
      }

      // Generate PDF
      const fileName = generateVolunteerCertificate(v, p);
      
      // Save metadata to Firestore
      await addDoc(collection(db, 'volunteer_certificates'), {
        volunteerId,
        volunteerName: v.name,
        projectId,
        projectName: p.name,
        issuedAt: serverTimestamp(),
        certificateURL: `certificates/${fileName}` // In a real app we'd upload this to storage first
      });

      toast.success("Recognition Diploma generated and archived.");
    } catch (err) {
      handleFirestoreError(err, 'create', 'volunteer_certificates');
    }
  };

  const handleToggleMilestone = async (projectId: string, milestoneId: string, currentStatus: string) => {
    try {
      const milestoneRef = doc(db, 'projects', projectId, 'milestones', milestoneId);
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await updateDoc(milestoneRef, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? serverTimestamp() : null
      });

      // Recalculate progress and potentially status
      const milestonesSnap = await getDocs(collection(db, 'projects', projectId, 'milestones'));
      const allM = milestonesSnap.docs.map(d => d.data());
      const completedCount = allM.filter((m: any) => m.status === 'completed').length;
      const progress = allM.length > 0 ? Math.round((completedCount / allM.length) * 100) : 0;

      const projectDoc = projects.find(p => p.id === projectId);
      let status = projectDoc?.status;

      if (progress === 100) {
        status = 'completed';
      } else if (progress > 0) {
        status = 'active';
      } else if (projectDoc?.budget_status === 'approved') {
        status = 'active'; // Or 'Ready to Launch' if we had that literally
      }

      await updateDoc(doc(db, 'projects', projectId), { 
        progress,
        status: status || projectDoc?.status
      });

      if (newStatus === 'completed') {
        const pDoc = projects.find(p => p.id === projectId);
        const mDoc = allM.find((m: any) => m.id === milestoneId) || { title: 'A Protocol' };
        sendPushNotification({
          title: 'Protocol Secured 🛡️',
          message: `${user?.name || 'A volunteer'} finalized "${mDoc.title}" for mission ${pDoc?.name || 'Assigned'}`,
          segment: 'Subscribed Users'
        });
      }
    } catch (err) {
      handleFirestoreError(err, 'update', `projects/${projectId}/milestones/${milestoneId}`);
    }
  };

  const handleAddMilestone = async (projectId: string, milestoneData: any) => {
    try {
      await addDoc(collection(db, 'projects', projectId, 'milestones'), {
        ...milestoneData,
        status: 'pending',
        projectId,
        created_at: serverTimestamp()
      });

      // Recalculate progress because total count changed
      const milestonesSnap = await getDocs(collection(db, 'projects', projectId, 'milestones'));
      const allM = milestonesSnap.docs.map(d => d.data());
      const completedCount = allM.filter((m: any) => m.status === 'completed').length;
      const progress = allM.length > 0 ? Math.round((completedCount / allM.length) * 100) : 0;

      await updateDoc(doc(db, 'projects', projectId), { progress });
      toast.success("New milestone established.");

      const pDoc = projects.find(p => p.id === projectId);
      sendPushNotification({
        title: 'New Mission Protocol 🛰️',
        message: `${user?.name || 'Command'} updated protocol for ${pDoc?.name || 'Active Mission'}`,
        segment: 'Subscribed Users'
      });
    } catch (err) {
      handleFirestoreError(err, 'create', `projects/${projectId}/milestones`);
    }
  };

  // --- Login Logic ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setResetSent(false);
    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, loginEmail, loginPass);
        // Create initial user document
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          email: loginEmail,
          name: loginEmail.split('@')[0],
          role: loginEmail === 'riteshgarad4@gmail.com' ? 'Admin' : 'Staff Operative',
          department: 'General',
          isActive: true,
          createdAt: serverTimestamp()
        });
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

  const handleUpdateBudget = async (projectId: string, budgetItems: BudgetItem[]) => {
    if (!auth.currentUser || !user) return;
    setIsUpdateLoading(true);
    try {
      const totalBudget = budgetItems.reduce((acc, curr) => acc + Number(curr.cost), 0);
      const batch = writeBatch(db);

      // 1. Update Project
      const projectRef = doc(db, 'projects', projectId);
      batch.update(projectRef, {
        budget_items: budgetItems,
        budget: `₹${totalBudget.toLocaleString()}`,
        budget_status: 'pending', 
        budget_rejection_reason: null,
        resubmittedAt: serverTimestamp()
      });

      // 2. Find and update budget request status
      const reqSnapshot = await getDocs(query(collection(db, 'budget_requests'), where('projectId', '==', projectId)));
      if (!reqSnapshot.empty) {
        const reqId = reqSnapshot.docs[0].id;
        batch.update(doc(db, 'budget_requests', reqId), {
          itemizedList: budgetItems,
          totalAmount: totalBudget,
          status: 'pending_finance',
          submittedAt: serverTimestamp(),
          resubmittedAt: serverTimestamp(),
          rejectionReason: null,
          proposerId: user.uid,
          proposedBy: user.name
        });
      } else {
        // Create it if it doesn't exist (failsafe)
        const projectDoc = projects.find(p => p.id === projectId);
        const newDocRef = doc(collection(db, 'budget_requests'));
        batch.set(newDocRef, {
          projectId: projectId,
          projectName: projectDoc?.name || 'Project Budget',
          proposerId: user.uid,
          proposedBy: user.name,
          department: projectDoc?.department || user.department || "General",
          itemizedList: budgetItems,
          totalAmount: totalBudget,
          status: 'pending_finance',
          submittedAt: serverTimestamp(),
          resubmittedAt: serverTimestamp()
        });
      }

      await batch.commit();
      toast.success("Budget resubmitted for approval.");
      setIsEditBudgetModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      toast.error("Resubmission failed. Please check connectivity.");
      handleFirestoreError(err, 'update', `projects/${projectId}/budget`);
    } finally {
      setIsUpdateLoading(false);
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
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban, badge: projects.length },
    { id: 'tasks', label: 'Task Board', icon: CheckSquare },
    { id: 'volunteers', label: 'Volunteers', icon: Users },
    { id: 'finance', label: 'Finance', icon: IndianRupee },
    { id: 'docs', label: 'Documentation', icon: FileText },
    { id: 'social-media', label: 'Social Media', icon: Camera, depts: ['Social Media'] },
    { id: 'public-relations', label: 'Public Relations', icon: Megaphone, depts: ['Public Relations'] },
    { id: 'automation', label: 'Automation', icon: Zap },
    { 
      id: 'expense-approvals', 
      label: 'Expense Approvals', 
      icon: ClipboardCheck, 
      roles: ['Admin', 'Department Head'],
      badge: expenseRequests.filter(r => r.status === 'pending').length || undefined 
    },
    { id: 'users', label: 'User Network', icon: Shield, roles: ['Admin'] },
  ];

  const navItems = allNavItems.filter(item => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    
    // Explicit Role restriction
    if (item.roles && !item.roles.includes(user.role)) return false;

    // Social Media Head restrictions
    if (user.department === 'Social Media') {
      return ['social-media', 'tasks', 'docs', 'dashboard'].includes(item.id);
    }
    
    // PR Head restrictions
    if (user.department === 'Public Relations') {
      return ['public-relations', 'tasks', 'docs', 'dashboard'].includes(item.id);
    }

    // Expense Approvals visibility
    if (item.id === 'expense-approvals') {
       return user.role === 'Admin' || (user.role === 'Department Head' && user.department === 'Finance');
    }

    // Finance/Volunteers/Automation are generally restricted to admins or specific roles
    if (user.role !== 'Admin' && ['finance', 'volunteers', 'automation', 'users'].includes(item.id)) return false;

    // Others (General/Projects/Documentation) are generally visible
    if (['social-media', 'public-relations'].includes(item.id)) return false;

    return true;
  });

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-white rounded-[1.5rem] mb-8 shadow-2xl shadow-terracotta/10 flex items-center justify-center border border-terracotta/5 overflow-hidden">
            <div className="relative w-12 h-12">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-terracotta/20 rounded-full"
              />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center text-terracotta"
              >
                <Database size={28} />
              </motion.div>
            </div>
          </div>
        <div className="text-center">
          <h2 className="text-[10px] font-black text-mahogany uppercase tracking-[0.4em] animate-pulse mb-2">Initializing OS Kernels</h2>
          <p className="text-[8px] font-bold text-terracotta/40 uppercase tracking-[0.2em]">Mission Bharari Protocol v5.0</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (isApplying) {
      return (
        <VolunteerApplicationForm 
          onSubmit={handleVolunteerApplication} 
          isLoading={isUpdateLoading} 
        />
      );
    }

    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center relative overflow-hidden font-sans">
        {/* Aesthetic Background Accents */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-terracotta/10 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="flex flex-col items-center text-center mb-12"
          >
            {/* Logo Hero */}
            <motion.div 
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.3, damping: 12, stiffness: 200 }}
              className="w-32 h-32 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(166,58,27,0.15)] flex items-center justify-center mb-6 border border-terracotta/10 relative"
            >
              <div className="relative w-16 h-16">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-mahogany/10 rounded-[1.5rem]"
                />
                <div className="absolute inset-0 flex items-center justify-center text-mahogany">
                  <Shield size={40} strokeWidth={2.5} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h1 className="text-3xl font-black text-mahogany tracking-tighter uppercase leading-none mb-2">
                MISSION BHARARI
              </h1>
              <p className="text-[10px] font-black text-terracotta/60 uppercase tracking-[0.4em] mb-1">
                Powered by Garad Foundation
              </p>
              <p className="text-[11px] font-medium text-mahogany/40 italic font-serif">
                "Garv Manusakicha"
              </p>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 shadow-2xl shadow-terracotta/5"
          >
            <form onSubmit={handleAuth} className="space-y-5">
              <AnimatePresence mode="wait">
                {loginError && (
                  <motion.div 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: [0, -10, 10, -10, 10, 0], opacity: 1 }}
                    className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-bold border border-red-100 uppercase tracking-wider text-center"
                  >
                    {loginError}
                  </motion.div>
                )}
                {resetSent && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-[10px] font-bold border border-emerald-100 uppercase tracking-wider text-center"
                  >
                    Reset link sent! Check your inbox.
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-mahogany/40 uppercase tracking-[0.2em] px-2 italic">Sector Identity</label>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="name@foundation.org" 
                  className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-terracotta focus:ring-4 focus:ring-terracotta/5 transition-all text-sm shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[9px] font-black text-mahogany/40 uppercase tracking-[0.2em] italic">Access Key</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={handleResetPassword}
                      className="text-[9px] font-black text-terracotta hover:text-mahogany uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Lost Key?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-terracotta focus:ring-4 focus:ring-terracotta/5 transition-all text-sm shadow-sm"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isUpdateLoading}
                className="w-full bg-terracotta hover:bg-mahogany text-white font-black text-[10px] uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-terracotta/25 active:scale-[0.98] mt-4 flex items-center justify-center gap-2 group"
              >
                {isUpdateLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'REGISTER OPERATIVE' : 'ACCESS COMMAND HUB'}
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="pt-4 flex flex-col gap-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[9px] font-black text-mahogany/30 hover:text-terracotta uppercase tracking-[0.15em] transition-colors"
                >
                  {isSignUp ? 'RETURN TO BASE LOGIN' : 'NEW ASSIGNMENT? INITIALIZE ACCOUNT'}
                </button>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] flex-1 bg-mahogany/5" />
                  <span className="text-[8px] font-black text-mahogany/20 uppercase tracking-widest italic">Mission Access</span>
                  <div className="h-[1px] flex-1 bg-mahogany/5" />
                </div>

                <button
                  type="button"
                  onClick={() => setIsApplying(true)}
                  className="w-full py-4 rounded-2xl border border-mahogany/5 text-[9px] font-black text-mahogany/60 hover:bg-gold/10 hover:text-terracotta transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Star size={14} fill="currentColor" className="text-gold" /> BECOME A VOLUNTEER
                </button>
              </div>
            </form>
          </motion.div>

          {/* Footer Metadata */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-12"
          >
            <p className="text-[9px] text-mahogany/20 font-black uppercase tracking-[0.5em]">
              System Build 5.0.0 // Global Foundation OS
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <Toaster position="top-center" />
      
      <MobileShell 
        activePath={currentPage} 
        onNavigate={(id) => setCurrentPage(id as Page)}
        title={PAGE_TITLES[currentPage as Page] || currentPage}
        user={user}
        hasNotifications={unreadCount > 0}
        projectsCount={projects.length}
        pendingApprovalsCount={expenseRequests.filter(r => r.status === 'pending').length}
        tasksCount={tasks.filter(t => t.status !== 'done' && t.status !== 'completed').length}
      >
        <PageView 
              page={currentPage} 
              user={user} 
              projects={projects} 
              tasks={tasks}
              volunteers={volunteers}
              documents={documents}
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
              onEditBudget={(p: any) => {
                setEditingProject(p);
                setIsEditBudgetModalOpen(true);
              }}
              onDeleteDocument={handleDeleteDocument}
              setIsDocumentModalOpen={setIsDocumentModalOpen}
              transactions={transactions}
              expenseRequests={expenseRequests}
              applications={applications}
              onApprove={handleApproveApplication}
              onReject={async (id: string) => {
                await updateDoc(doc(db, 'volunteer_applications', id), { status: 'rejected' });
              }}
              onLogHours={handleLogHours}
              workLogs={workLogs}
              certificates={certificates}
              onVerifyLog={handleVerifyWorkLog}
              onGenerateCert={handleGenerateCertificate}
              milestones={milestones}
              onToggleMilestone={handleToggleMilestone}
              onAddMilestone={handleAddMilestone}
              financeRequests={financeRequests}
              budgetRequests={budgetRequests}
              onUploadDocument={handleUploadDocument}
              onVerifyDocument={handleVerifyDocument}
              onTaskStatusChange={handleTaskStatusChange}
              onAddTask={handleAddTask}
              activityLogs={activityLogs}
              setProofTaskTargetId={setProofTaskTargetId}
            />
      </MobileShell>

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
        {isEditBudgetModalOpen && (
          <EditBudgetModal 
            isOpen={isEditBudgetModalOpen}
            onClose={() => setIsEditBudgetModalOpen(false)}
            onUpdate={handleUpdateBudget}
            project={editingProject}
            isLoading={isUpdateLoading}
          />
        )}
        {isDocumentModalOpen && (
          <FileUploadModal 
            isOpen={isDocumentModalOpen}
            onClose={() => setIsDocumentModalOpen(false)}
            onUpload={handleUploadDocument}
            projects={projects}
          />
        )}
        {isAddTaskModalOpen && (
          <TaskModal 
            isOpen={isAddTaskModalOpen}
            onClose={() => setIsAddTaskModalOpen(false)}
            onCreate={handleAddTask}
            projects={projects}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const EditBudgetModal = ({ isOpen, onClose, onUpdate, project, isLoading }: any) => {
  const [items, setItems] = useState<BudgetItem[]>(project?.budget_items || []);

  useEffect(() => {
    if (project?.budget_items) {
      setItems(project.budget_items);
    }
  }, [project]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white w-full max-w-xl rounded-[32px] p-8 shadow-2xl border border-slate-200"
      >
        <div className="text-left mb-8 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Revise Fiscal Strategy</h3>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest leading-none">Mission: {project?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto mb-8 pr-2">
          <BudgetPlanner 
            items={items} 
            onChange={setItems}
          />
        </div>

        <div className="flex gap-3">
          <button 
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            disabled={isLoading}
            onClick={() => onUpdate(project.id, items)}
            className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Resubmitting...
              </>
            ) : (
              'Update & Resubmit'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const TaskModal = ({ isOpen, onClose, onCreate, projects }: any) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedDept: 'General' as any,
    priority: 'Medium' as any,
    impactValue: 10,
    proofRequired: false,
    status: 'todo'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 text-left">
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
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-1">Inject Node Protocol</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Network Orchestration</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl border border-slate-200">
            <X size={18} />
          </button>
        </div>
        
        <form className="p-6 md:p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onCreate(formData); }}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Target Project</label>
            <select 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 appearance-none"
              value={formData.projectId}
              onChange={e => setFormData({...formData, projectId: e.target.value})}
            >
              <option value="">Select Mission...</option>
              {projects.filter((p: any) => p.status === 'approved' || p.status === 'active').map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Task identifier</label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900"
              placeholder="Primary Objective Title"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Functional allocation</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 appearance-none"
              value={formData.assignedDept}
              onChange={e => setFormData({...formData, assignedDept: e.target.value as any})}
            >
              {['Finance', 'Operations', 'Marketing', 'HR', 'Legal', 'Social Media', 'Public Relations', 'General'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Priority level</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 appearance-none"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as any})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Velocity Weight (%)</label>
              <input 
                type="number"
                required
                min="1"
                max="100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900"
                value={formData.impactValue}
                onChange={e => setFormData({...formData, impactValue: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Objective Parameters</label>
            <textarea 
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 resize-none"
              placeholder="Detailed instructions..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Proof of Result Required</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Forces document upload for closure</p>
            </div>
            <button 
              type="button"
              onClick={() => setFormData({...formData, proofRequired: !formData.proofRequired})}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative border",
                formData.proofRequired ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-200" : "bg-slate-200 border-slate-300"
              )}
            >
              <div className={cn("absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-all", formData.proofRequired ? "left-7" : "left-1")} />
            </button>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" type="button" className="flex-1 py-4 uppercase tracking-widest bg-white border-slate-200" onClick={onClose}>Abort</Button>
            <Button variant="primary" type="submit" className="flex-1 py-4 uppercase tracking-widest shadow-xl shadow-blue-500/20">Inject Signal</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ProjectModal = ({ isOpen, onClose, onCreate, volunteers }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    tag: 'Technology' as any,
    department: 'Health',
    budget: '',
    budget_items: [] as BudgetItem[],
    lead_name: '',
    description: '',
    timeline: '3 Months'
  });

  if (!isOpen) return null;

  const totalCalculatedBudget = formData.budget_items.reduce((acc, curr) => acc + Number(curr.cost), 0);

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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Legacy Budget Format (Optional)</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900"
                placeholder="e.g. ₹2.5L"
                value={formData.budget || `₹${totalCalculatedBudget.toLocaleString()}`}
                onChange={e => setFormData({...formData, budget: e.target.value})}
              />
            </div>
          </div>

          <BudgetPlanner 
            items={formData.budget_items} 
            onChange={(items) => setFormData({ ...formData, budget_items: items, budget: `₹${items.reduce((a,c) => a+c.cost, 0).toLocaleString()}` })}
          />

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

const PageView = ({ 
  page, projects, tasks, volunteers, documents, transactions, selectedProjectId, 
  onOpenProject, setCurrentPage, onAddProject, onAddVolunteer, onDeleteProject, 
  onUpdateProjectStatus, onEditBudget, onDeleteDocument, setIsDocumentModalOpen, user,
  applications, onApprove, onReject, onLogHours, workLogs, certificates, 
  onVerifyLog, onGenerateCert, milestones, onToggleMilestone, onAddMilestone,
  financeRequests, budgetRequests, expenseRequests,
  onUploadDocument, onVerifyDocument,
  onTaskStatusChange, onAddTask, activityLogs, setProofTaskTargetId
}: any) => {
  // Determine if current user has a volunteer record
  const currentVolunteer = volunteers.find((v: any) => v.email === user?.email);

  switch (page) {
    case 'dashboard':
      return <DashboardView projects={projects} tasks={tasks} volunteers={volunteers} onOpenProject={onOpenProject} setCurrentPage={setCurrentPage} onDeleteProject={onDeleteProject} user={user} />;
    case 'projects':
      return <ProjectsView projects={projects} onOpenProject={onOpenProject} onAdd={onAddProject} onDelete={onDeleteProject} user={user} />;
    case 'project-detail':
      return (
        <ProjectDetailView 
          projectId={selectedProjectId} 
          projects={projects} 
          tasks={tasks} 
          volunteers={volunteers} 
          onBack={() => setCurrentPage('projects')} 
          setCurrentPage={setCurrentPage}
          onDelete={onDeleteProject} 
          onUpdateProjectStatus={onUpdateProjectStatus} 
          onEditBudget={onEditBudget} 
          user={user}
          onGenerateCertificate={(vId: string) => onGenerateCert(vId, selectedProjectId)}
          workLogs={workLogs.filter((l: any) => l.projectId === selectedProjectId)}
          onVerifyLog={onVerifyLog}
          milestones={milestones}
          onToggleMilestone={onToggleMilestone}
          onAddMilestone={onAddMilestone}
          financeRequests={financeRequests}
          budgetRequests={budgetRequests}
        />
      );
    case 'tasks':
      return (
        <TaskEngine 
          tasks={tasks} 
          projects={projects} 
          user={user} 
          onStatusChange={onTaskStatusChange}
          onAddTask={onAddTask}
          onUploadProof={(id: string) => {
            setProofTaskTargetId(id);
            setIsDocumentModalOpen(true);
          }}
          logs={activityLogs}
        />
      );
    case 'volunteers':
      const canManage = user.role === 'Admin' || user.role === 'Department Head' || user.role === 'DH';
      
      if (canManage) {
        return (
          <VolunteerDirectory 
            volunteers={volunteers}
            applications={applications}
            onApprove={onApprove}
            onReject={onReject}
            onUpdateStatus={async () => {}} 
            onAddVolunteer={onAddVolunteer}
            user={user}
            projects={projects}
          />
        );
      }
      
      if (currentVolunteer) {
        return (
          <VolunteerProfile 
            volunteer={currentVolunteer}
            projects={projects}
            logs={workLogs}
            certificates={certificates}
            onLogHours={onLogHours}
            user={user}
            documents={documents}
          />
        );
      }

      return <VolunteerDirectory volunteers={volunteers} applications={applications} projects={projects} onAddVolunteer={onAddVolunteer} user={user} onApprove={onApprove} onReject={onReject} onUpdateStatus={async () => {}} />;
    case 'finance':
      if (user?.role === 'Volunteer') {
        return <VolunteerFinanceDashboard user={user} />;
      }
      return <FinanceDashboard user={user} projects={projects} />;
    case 'docs':
      return (
        <DocumentVault 
          documents={documents} 
          projects={projects}
          onUpload={onUploadDocument} 
          onVerify={onVerifyDocument}
          onDelete={onDeleteDocument} 
          user={user} 
        />
      );
    case 'social-media':
      return <SocialMediaDashboard user={user} />;
    case 'public-relations':
      return <PublicRelationsDashboard user={user} />;
    case 'users':
      return <UserManagement currentUser={user} />;
    case 'automation':
      return <AutomationView />;
    case 'expense-approvals':
      return <ExpenseApprovalDashboard user={user} requests={expenseRequests} />;
    case 'create':
      return (
        <div className="space-y-6 pt-safe text-left">
          <div className="px-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">Operational Quick Launch</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deploy new assets or initialize mission parameters</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => onAddProject()}
              className="flex items-center gap-6 p-6 bg-white border border-slate-200 rounded-[32px] shadow-lg shadow-slate-200/40 group active:scale-[0.98] transition-all text-left"
            >
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:rotate-6 transition-transform">
                <FolderKanban size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">New Mission</h3>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">Initialize foundation project</p>
              </div>
            </button>

            <button 
              onClick={() => onAddTask()}
              className="flex items-center gap-6 p-6 bg-white border border-slate-200 rounded-[32px] shadow-lg shadow-slate-200/40 group active:scale-[0.98] transition-all text-left"
            >
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:rotate-6 transition-transform">
                <CheckSquare size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Log Node</h3>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">Assign operational task</p>
              </div>
            </button>

            <button 
              onClick={() => onAddVolunteer()}
              className="flex items-center gap-6 p-6 bg-white border border-slate-200 rounded-[32px] shadow-lg shadow-slate-200/40 group active:scale-[0.98] transition-all text-left"
            >
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:rotate-6 transition-transform">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Add Unit</h3>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">Onboard mission operative</p>
              </div>
            </button>
          </div>
        </div>
      );
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
    if (!p) return false;
    if (isAdmin) return p.status === 'pending_admin_review';
    if (isDH) return p.status === 'pending_dept_review' && p.department === user.department;
    return false;
  });

  const activeMissions = projects.filter((p: any) => 
    p && (p.status === 'approved' || p.status === 'active')
  );

  const stats = [
    { label: 'Pending Review', value: pendingByMe.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Active Missions', value: activeMissions.length, icon: FolderKanban, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Units Deployed', value: volunteers.length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Fiscal Allocation', value: '₹12.4L', icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  ];

  const functionalNodes = [
    { id: 'dashboard', label: 'Command Hub', icon: LayoutDashboard, desc: 'Root system overview' },
    { id: 'projects', label: 'Mission Data', icon: FolderKanban, desc: 'Project lifecycle mgmt' },
    { id: 'tasks', label: 'Node Engine', icon: CheckSquare, desc: 'Operational task flow' },
    { id: 'volunteers', label: 'Unit Directory', icon: Users, desc: 'Personnel records' },
    { id: 'finance', label: 'Resource Cell', icon: IndianRupee, desc: 'Financial oversight' },
    { id: 'docs', label: 'Signal Vault', icon: FileText, desc: 'Document protocol' },
    { id: 'social-media', label: 'Comm Link', icon: Share2, desc: 'Outreach & visibility' },
    { id: 'public-relations', label: 'PR portal', icon: Megaphone, desc: 'Public relations' },
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
            <Badge className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest">Critical: {tasks.filter((t: any) => t.priority === 'High' && t.status !== 'done' && t.status !== 'completed').length}</Badge>
          </div>
          <div className="space-y-4">
            {tasks.filter((t: any) => t && t.priority === 'High' && t.status !== 'done' && t.status !== 'completed').slice(0, 4).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-4">
                   <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
                   <div className="text-left">
                      <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{t.title}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.assignedVolunteerName || t.assigned_to}</p>
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
                ...(user.role === 'Admin' ? [{ label: 'Automata', icon: Zap, color: 'bg-rose-50 text-rose-600 border-rose-100', page: 'automation' }] : [])
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

const ProjectDetailView = (props: any) => {
  return <MissionDetailView {...props} />;
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


// Old VolunteersView purged for tactical upgrade


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
  'dashboard': 'Command Hub',
  'projects': 'Active Missions',
  'tasks': 'Operational Force Board',
  'volunteers': 'Unit Records',
  'finance': 'Resource Cell / Ledger',
  'docs': 'Protocols Vault',
  'social-media': 'Social Link Pipeline',
  'public-relations': 'Media Relations',
  'fundraising': 'Capital Inflow',
  'automation': 'Workflow Automata',
  'project-detail': 'Mission Briefing',
  'users': 'Cyber Access Control',
  'expense-approvals': 'Financial Authorizations',
  'roadmap': 'Strategic Roadmap',
  'new-proposal': 'Mission Proposal',
  'finance-requests': 'Resource Requisition',
  'kyc': 'Personnel Authentication'
};
