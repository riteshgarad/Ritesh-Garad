import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  Mail, 
  Plus, 
  Briefcase,
  ChevronDown,
  Users,
  CheckCircle2,
  XCircle,
  FilterX,
  User,
  Calendar,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { 
  collection, 
  doc, 
  updateDoc, 
  arrayUnion, 
  deleteDoc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { db, auth } from '../App';
import { Volunteer, VolunteerApplication, AppUser } from '../types';
import { format } from 'date-fns';
import { AddVolunteerModal } from './AddVolunteerModal';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { sendEmail } from '../services/emailService';

// Standard UI components to maintain consistency
const Button = ({ children, onClick, className, variant = 'primary', disabled = false, type = 'button', haptic = true }: any) => {
  const baseClasses = "px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-slate-900/10",
    secondary: "bg-white text-slate-900 border border-slate-200 hover:border-slate-900",
    danger: "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100"
  };

  const Component = haptic ? motion.button : 'button';

  return (
    <Component
      type={type}
      // @ts-ignore
      whileTap={haptic ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(baseClasses, (variants as any)[variant], className)}
    >
      {children}
    </Component>
  );
};

const Badge = ({ children, className, ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border", className)} {...props}>
    {children}
  </div>
);

interface VolunteerDirectoryProps {
  volunteers: Volunteer[];
  applications: VolunteerApplication[];
  onApprove: (application: VolunteerApplication) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: Volunteer['status']) => Promise<void>;
  onAddVolunteer: (data: any) => Promise<void>;
  user: AppUser;
  projects?: any[]; // Added for assignment
}

export const VolunteerDirectory = ({ 
  volunteers, 
  applications, 
  onApprove, 
  onReject, 
  onUpdateStatus, 
  onAddVolunteer, 
  user,
  projects = []
}: VolunteerDirectoryProps) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'applications'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'experience' | 'available'>('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const pendingApps = applications.filter(a => a.status === 'pending_verification');

  // Filter & Sort Logic
  const filteredVolunteers = useMemo(() => {
    let result = volunteers.filter(v => 
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.skills?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'experience') {
      result = [...result].sort((a, b) => (b.hours || 0) - (a.hours || 0));
    } else if (sortBy === 'available') {
      result = result.filter(v => v.status === 'Active');
    }

    return result;
  }, [volunteers, searchQuery, sortBy]);

  const handleDelete = async (volunteer: Volunteer) => {
    if (!window.confirm(`Are you absolutely sure? This will PERMANENTLY purge ${volunteer.name} from mission records and revoke their biometric access.`)) return;

    setIsDeleting(volunteer.id);
    try {
      // Delete from volunteers collection first (client-side)
      await deleteDoc(doc(db, 'volunteers', volunteer.id));

      // Attempt to delete from Auth/Users via API if uid exists
      if (volunteer.uid) {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          try {
            const response = await fetch(`/api/admin/users/${volunteer.uid}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              console.warn("Auth deletion skipped or failed, but profile removed locally.");
            }
          } catch (apiErr) {
            console.warn("API call failed, but Firestore document was removed.");
          }
        }
      }

      toast.success(
        <div className="flex flex-col">
          <span className="font-bold uppercase tracking-widest text-[10px]">Protocol Executed</span>
          <span className="text-xs opacity-70">Operative {volunteer.name} purged from mission records.</span>
        </div>
      );
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `volunteers/${volunteer.id}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAssignToMission = async (volunteer: Volunteer, projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Use uid if available, otherwise fallback to document id
    const volunteerIdentifier = volunteer.uid || volunteer.id;

    if (!volunteerIdentifier) {
      toast.error('Invalid Volunteer Identifier');
      return;
    }

    try {
      // 1. Update Project assignedTeam
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        assignedTeam: arrayUnion(volunteerIdentifier)
      });

      // 2. Update User activeMissions if uid exists (representing a linked account)
      if (volunteer.uid) {
        const userRef = doc(db, 'users', volunteer.uid);
        await updateDoc(userRef, {
          activeMissions: arrayUnion(projectId),
          status: 'On Mission'
        });
      }

      // Also update the volunteer document itself
      const volunteerRef = doc(db, 'volunteers', volunteer.id);
      await updateDoc(volunteerRef, {
        status: 'On Mission',
        activeMissions: arrayUnion(projectId)
      });

      // 3. Send Notification
      try {
        await sendEmail({
          requesterEmail: volunteer.email,
          amount: '0',
          status: 'MISSION_DRAFTED',
          requesterName: volunteer.name,
          message: `You have been officially drafted into the mission: ${project.name}`
        });
      } catch (e) {
        console.warn("Email notification failed, but data saved.");
      }

      toast.success(`Deployment Successful: ${volunteer.name} assigned to ${project.name}`);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'assignment protocol');
    }
  };

  const canManage = user.role === 'Admin' || user.role === 'HR' || user.role === 'DH' || user.role === 'Department Head';

  return (
    <div className="space-y-6 pb-32 px-4 md:px-0">
      {/* Search & Sort Area */}
      <div className="flex flex-col gap-6">
        <div className="relative group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search agents..."
            className="w-full pl-8 pr-6 py-5 bg-transparent border-b border-slate-200 rounded-none text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex bg-slate-50/50 p-1.5 rounded-2xl self-start overflow-x-auto no-scrollbar scrollbar-hide">
          {['directory', 'applications'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0",
                activeTab === tab ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400"
              )}
            >
              {tab}
              {tab === 'applications' && pendingApps.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]">
                  {pendingApps.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'directory' ? (
          <motion.div 
            key="directory-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-6"
          >
            {filteredVolunteers.map((v, i) => (
              <VolunteerCard 
                key={v.id} 
                v={v} 
                index={i} 
                projects={projects}
                onDelete={() => handleDelete(v)}
                isDeleting={isDeleting === v.id}
                onAssign={(pid: string) => handleAssignToMission(v, pid)}
              />
            ))}
            {filteredVolunteers.length === 0 && (
              <div className="py-20 text-center bg-white rounded-[3rem] shadow-soft flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="text-slate-200" size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching operatives found</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="applications-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {pendingApps.length === 0 ? (
              <div className="bg-transparent p-20 text-center flex flex-col items-center gap-4">
                <CheckCircle2 className="text-emerald-100" size={60} />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">All clear. No pending recruits.</p>
              </div>
            ) : (
              pendingApps.map(app => (
                <div key={app.id} className="bg-transparent p-6 overflow-hidden flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-xl font-black">
                      {app.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">{app.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400">{app.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onApprove(app)}
                      className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 size={20} />
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onReject(app.id)}
                      className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center"
                    >
                      <XCircle size={20} />
                    </motion.button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom,16px)+110px)] right-6 pointer-events-none z-50">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsModalOpen(true)}
          className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 pointer-events-auto"
        >
          <Plus size={28} />
        </motion.button>
      </div>

      <AddVolunteerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddVolunteer}
        isLoading={false}
      />
    </div>
  );
};

const VolunteerCard = ({ v, index, projects, onDelete, isDeleting, onAssign }: any) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const initials = v.name ? v.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      className="bg-transparent p-6 overflow-hidden relative group"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.75rem] flex items-center justify-center text-white text-xl font-black shadow-lg">
              {initials}
            </div>
            <span className={cn(
              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white",
              v.status === 'Active' ? "bg-emerald-500" : "bg-amber-500"
            )} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{v.name}</h3>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <ShieldCheck size={10} className="text-blue-500" />
              {v.department} • Level {Math.floor((v.impactPoints || 0) / 100) + 1}
            </div>
          </div>
        </div>
        
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={onDelete}
          className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
        >
          <Trash2 size={18} />
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {v.skills?.toString().split(',').slice(0, 3).map((skill: string, i: number) => (
          <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-slate-100">
            {skill.trim()}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-50">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Impact Points</p>
          <p className="text-lg font-black text-slate-900">{v.impactPoints || 0}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-50">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Contribution</p>
          <p className="text-lg font-black text-slate-900">{v.hours || 0}H</p>
        </div>
      </div>

      <div className="flex gap-2">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = `mailto:${v.email}?subject=Mission Ping`}
          className="flex-1 bg-blue-50 text-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
        >
          <Mail size={16} />
          Quick Connect
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAssigning(!isAssigning)}
          className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
        >
          <Briefcase size={16} />
          Assign
        </motion.button>
      </div>

      <AnimatePresence>
        {isAssigning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-x-0 bottom-0 top-0 bg-white/95 backdrop-blur-md z-30 flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Select Mission Site</h4>
              <button onClick={() => setIsAssigning(false)} className="p-2 bg-slate-100 rounded-lg"><XCircle size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {projects.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => { onAssign(p.id); setIsAssigning(false); }}
                  className="w-full p-4 bg-slate-50 hover:bg-blue-50 text-left rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

