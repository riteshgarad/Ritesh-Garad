import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Trash2, 
  MoreVertical,
  Activity,
  CheckCircle2,
  XCircle,
  Building2,
  Lock,
  Eye,
  Edit2,
  Search,
  Filter,
  Check,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, secondaryAuth } from '../App';
import { AppUser } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { 
  createUserWithEmailAndPassword, 
  signOut as secondarySignOut,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';

interface UserManagementProps {
  currentUser: AppUser | null;
}

const DEPARTMENTS = ['Finance', 'Projects', 'Social Media', 'Public Relations', 'HR', 'General'];
const ROLES = ['Admin', 'Department Head', 'Volunteer'];

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Volunteer',
    department: 'General'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Logic (Crucial): onSnapshot for real-time updates
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Admin') return;

    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ ...doc.data() } as AppUser));
      setUsers(userData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 2. The Logic: Secondary Auth Trick to Create Users without Logging Out Admin
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Step A: Create user in Secondary Auth (Prevents Admin logout)
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.email, 
        formData.password
      );
      const newUser = userCredential.user;

      // Step B: Save profile to Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      // Step C: Immediately sign out secondary auth to clear session
      await secondarySignOut(secondaryAuth);

      toast.success('User created successfully!');
      setIsAddModalOpen(false);
      setFormData({ email: '', password: '', name: '', role: 'Volunteer', department: 'General' });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Identity Conflict: This email is already registered in the mission network.');
      } else if (error.code?.startsWith('auth/')) {
        toast.error(error.message || 'Mission identity creation failed');
      } else {
        handleFirestoreError(error, OperationType.WRITE, 'users');
      }
      // Ensure secondary auth is signed out even on failure
      try { await secondarySignOut(secondaryAuth); } catch(e) {}
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        isActive: !currentStatus
      });
      toast.success('Permissions state updated');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleResetPassword = async (uid: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/users/${uid}/email`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch user credentials');
      const { email } = await response.json();
      
      await sendPasswordResetEmail(auth, email);
      toast.success(`Encrypted reset logic sent to ${email}`);
    } catch (error: any) {
      toast.error('Password reset protocol failed');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm('REVOKE ACCESS: Permanently scrub this operative from Auth and Database?')) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      if (!response.ok) throw new Error('Hard deletion failed');
      
      toast.success('Operative scrubbed from mission records');
    } catch (error: any) {
      toast.error('Identity erasure failed');
    }
  };

  const filteredUsers = activeTab === 'All' 
    ? users 
    : users.filter(u => u.department === activeTab);

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <Shield size={64} className="text-slate-200 mb-4" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Access Forbidden</h2>
        <p className="text-sm text-slate-500">Security clearance Level: Admin required for this terminal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4 md:px-0">
        <div className="text-left">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-3 italic uppercase">
            User <span className="text-blue-600">Network</span>
            <span className="bg-slate-900 text-white text-[10px] not-italic px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black shadow-lg shadow-slate-200 shrink-0">
              Admin Terminal
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
            <Shield size={14} className="text-blue-600 shrink-0" /> Managing security roles & access.
          </p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all w-full lg:w-auto justify-center"
        >
          <UserPlus size={16} /> Add Operative
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-nowrap items-center gap-2 px-4 md:px-0 overflow-x-auto no-scrollbar scrollbar-hide">
        {['All', ...DEPARTMENTS].map(dept => (
          <button
            key={dept}
            onClick={() => setActiveTab(dept)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap shrink-0",
              activeTab === dept 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-100"
            )}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* User Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[32px]"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4 md:px-0 pb-20">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.uid}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                <div className="bg-transparent overflow-hidden transition-all duration-500">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl shadow-inner transition-all group-hover:bg-blue-50 group-hover:text-blue-500">
                      {user.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "px-3 py-1 border-none text-[9px] font-black uppercase tracking-widest",
                        user.role === 'Admin' ? 'bg-red-50 text-red-600' : 
                        user.role === 'Department Head' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      )}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4 text-left">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase line-clamp-1">{user.name}</h3>
                      <p className="text-xs font-medium text-slate-400 flex items-center gap-2">
                        <Mail size={12} className="shrink-0" /> {user.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 flex-grow">
                        <Building2 size={12} className="text-slate-300 shrink-0" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className={cn("w-2 h-2 rounded-full", user.isActive ? 'bg-emerald-500' : 'bg-red-500')}></div>
                         <span className={cn("text-[10px] font-black uppercase tracking-widest", user.isActive ? 'text-emerald-600' : 'text-red-600')}>
                           {user.isActive ? 'Active' : 'Locked'}
                         </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => handleToggleStatus(user.uid, user.isActive)}
                        className={cn(
                          "flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl",
                          user.isActive ? "bg-slate-900 text-white shadow-slate-900/10" : "bg-emerald-600 text-white shadow-emerald-600/20"
                        )}
                      >
                        {user.isActive ? 'Lock Access' : 'Restore'}
                      </button>
                      <button 
                        onClick={() => handleResetPassword(user.uid)}
                        className="p-3.5 rounded-xl bg-white text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"
                        title="Send Reset Email"
                      >
                        <Shield size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.uid)}
                        className="p-3.5 rounded-xl bg-white text-slate-300 hover:text-red-500 transition-all border border-slate-100 shadow-sm"
                        title="Revoke Access"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-[5%] -translate-x-1/2 w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 z-[101] text-left max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Add Operative</h2>
                  <p className="text-xs text-slate-400 font-medium">Provision new mission access credentials.</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Full Identity Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-6 py-4.5 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Secure Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-6 py-4.5 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="identity@ngo-network.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Access Key (Min 6 Chars)</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-6 py-4.5 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Access Tier</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full px-6 py-4.5 bg-slate-50 border border-slate-200 rounded-[20px] text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-blue-500 transition-all"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Mission Dept</label>
                    <select 
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      className="w-full px-6 py-4.5 bg-slate-50 border border-slate-200 rounded-[20px] text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-blue-500 transition-all"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                   <button 
                     type="submit"
                     disabled={isSubmitting}
                     className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                   >
                     {isSubmitting ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         Provisioning...
                       </>
                     ) : (
                       <>
                         <CheckCircle2 size={16} />
                         Confirm Mission Provisioning
                       </>
                     )}
                   </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple X icon missing from previous imports
const X = ({ size, className }: { size: number, className?: string }) => (
  <XCircle size={size} className={className} />
);

export default UserManagement;
