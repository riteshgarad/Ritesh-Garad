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
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  doc, 
  updateDoc, 
  arrayUnion, 
  deleteDoc
} from 'firebase/firestore';
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
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch(`/api/users/${volunteer.uid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Deletion failed");
      }

      toast.success(
        <div className="flex flex-col">
          <span className="font-bold uppercase tracking-widest text-[10px]">Protocol Executed</span>
          <span className="text-xs opacity-70">Operative {volunteer.name} purged from mission records.</span>
        </div>
      );
    } catch (error: any) {
      console.error(error);
      toast.error(`Purge Failed: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAssignToMission = async (volunteer: Volunteer, projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    try {
      // 1. Update Project assignedTeam
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        assignedTeam: arrayUnion(volunteer.uid)
      });

      // 2. Update User activeMissions
      const userRef = doc(db, 'users', volunteer.uid);
      await updateDoc(userRef, {
        activeMissions: arrayUnion(projectId),
        status: 'On Mission'
      });

      // 3. Send Notification
      try {
        await sendEmail({
          to: volunteer.email,
          subject: `[MISSION DRAFT] Assigned to: ${project.name}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1e3a8a; border-radius: 12px; background-color: #f0f7ff;">
              <h2 style="color: #1e40af; text-transform: uppercase;">You Have Been Drafted</h2>
              <p>Hello ${volunteer.name},</p>
              <p>You have been officially assigned to the mission: <strong>${project.name}</strong>.</p>
              <p>Please check your Task Board for your initial objectives and coordination parameters.</p>
              <hr style="border: 0; border-top: 1px solid #bfdbfe; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">Mission Control Intelligence Hub.</p>
            </div>
          `
        });
      } catch (e) {
        console.warn("Email notification failed, but data saved.");
      }

      toast.success(`Deployment Successful: ${volunteer.name} assigned to ${project.name}`);
    } catch (error: any) {
      console.error(error);
      toast.error('Deployment Protocol Failed');
    }
  };

  const canManage = user.role === 'Admin' || user.role === 'HR' || user.role === 'DH' || user.role === 'Department Head';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50" />
        
        <div className="space-y-4 flex-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-600 rounded-full" />
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase whitespace-nowrap">Operative Registry</h1>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Users size={12} /> Resource Grid & Personnel Matrix
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {['directory', 'applications'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
                {tab === 'applications' && pendingApps.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] animate-pulse">
                    {pendingApps.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {canManage && (
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 h-auto"
            >
              <Plus size={16} />
              Onboard Agent
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'directory' ? (
          <motion.div 
            key="directory-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            {/* Search & Sort */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by name, biometric ID, or expertise..."
                  className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-3xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-600/10 transition-all outline-none shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="bg-white border border-slate-100 shadow-sm rounded-3xl px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none focus:ring-2 focus:ring-blue-600/10 cursor-pointer"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
              >
                <option value="newest">Latest Recruits</option>
                <option value="experience">Experienced Veterans</option>
                <option value="available">Available Assets</option>
              </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
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
              </AnimatePresence>
            </div>

            {filteredVolunteers.length === 0 && (
              <div className="py-40 text-center bg-white rounded-[2.5rem] border border-slate-50 shadow-sm">
                <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="text-slate-200" size={32} />
                </div>
                <p className="text-xl font-black text-slate-300 uppercase tracking-[0.2em]">No Matches in Registry</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="applications-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {pendingApps.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-24 text-center flex flex-col items-center gap-6">
                <FilterX className="text-slate-100" size={80} />
                <p className="text-xl font-black text-slate-300 uppercase tracking-widest italic">Zero Pending Entries</p>
              </div>
            ) : (
              pendingApps.map(app => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={app.id} 
                  className="bg-white border border-slate-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-xl transition-all shadow-sm"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner">
                      {app.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{app.name}</h3>
                      <p className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors uppercase tracking-widest mt-1">{app.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block mr-6">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Incoming</p>
                      <p className="text-sm font-black text-slate-600">{format(app.appliedAt.toDate(), 'PPP')}</p>
                    </div>
                    <Button 
                      variant="secondary"
                      onClick={() => onApprove(app)}
                      className="w-14 h-14 p-0 rounded-2xl text-emerald-500 bg-emerald-50 border-emerald-100 hover:bg-emerald-500"
                    >
                      <CheckCircle2 size={24} />
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => onReject(app.id)}
                      className="w-14 h-14 p-0 rounded-2xl"
                    >
                      <XCircle size={24} />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 flex items-center justify-center text-xl font-black text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
              {initials}
            </div>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ring-2",
              v.status === 'Active' ? "bg-emerald-500 ring-emerald-100" : "bg-amber-500 ring-amber-100"
            )} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{v.name || 'Anonymous Agent'}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[150px]">{v.email}</p>
          </div>
        </div>

        <button 
          onClick={onDelete}
          disabled={isDeleting}
          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
        >
          {isDeleting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Trash2 size={18} />}
        </button>
      </div>

      {/* Skills Matrix */}
      <div className="mt-8 flex flex-wrap gap-2 min-h-[40px] z-10 relative">
        {v.skills?.toString().split(',').map((skill: string, i: number) => (
          <Badge key={i} className="bg-slate-50 text-slate-500 border border-slate-200/60 rounded-lg px-3 py-1 font-bold text-[9px] group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            {skill.trim()}
          </Badge>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mission Hours</p>
          <p className="text-xl font-black text-slate-900">{v.hours || 0}H</p>
        </div>
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Deployment</p>
          <p className="text-sm font-black text-slate-900 tracking-tighter truncate leading-none mt-1">{v.department}</p>
        </div>
      </div>

      {/* Connectivity & Actions */}
      <div className="mt-8 flex items-center gap-3 relative z-10">
        <button 
          onClick={() => window.location.href = `mailto:${v.email}?subject=Mission Coordination`}
          className="flex-1 bg-indigo-50 text-indigo-600 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all group"
        >
          <Mail size={16} className="group-hover:rotate-12 transition-transform" />
          Connect
        </button>
        
        <div className="relative flex-1">
          <button 
            onClick={() => setIsAssigning(!isAssigning)}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10"
          >
            <Briefcase size={14} />
            Assign
            <ChevronDown size={14} className={cn("transition-transform", isAssigning && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isAssigning && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 right-0 mb-3 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-20 min-w-[200px]"
              >
                <div className="p-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Deployment Node</p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {projects.length > 0 ? projects.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onAssign(p.id);
                        setIsAssigning(false);
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-[10px] font-black text-slate-600 group-hover:text-blue-600 truncate mr-2">{p.name}</span>
                      <Plus size={14} className="text-slate-200 group-hover:text-blue-400" />
                    </button>
                  )) : (
                    <div className="p-4 text-center">
                      <p className="text-[10px] font-black text-slate-300 uppercase">No active missions</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

