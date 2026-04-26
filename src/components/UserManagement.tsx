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
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../App';
import { AppUser } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface UserManagementProps {
  currentUser: AppUser | null;
}

const DEPARTMENTS = ['Finance', 'Social Media', 'Public Relations', 'Operations', 'Marketing', 'HR', 'Legal', 'General'];
const ROLES = ['Admin', 'Department Head', 'Volunteer', 'Staff Operative'];

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Volunteer',
    department: 'General'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    if (!currentUser) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load user network');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      toast.success('Access Identity Provisioned successfully');
      setIsAddModalOpen(false);
      setFormData({ email: '', password: '', name: '', role: 'Volunteer', department: 'General' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      toast.success('Permissions state updated');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic uppercase text-left">
            Identity <span className="text-blue-600">Access</span>
            <span className="bg-slate-900 text-white text-[10px] not-italic px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black shadow-lg shadow-slate-200">
              RBAC Terminal
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2 text-left">
            <Shield size={14} className="text-blue-600" /> Managing security roles, department access, and mission clearances.
          </p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <UserPlus size={16} /> Provision Operative
        </button>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Active Network Directory</h3>
           <div className="flex gap-2">
             <Badge className="bg-emerald-50 text-emerald-600 border-none">{users.filter(u => (u as any).isActive).length} Verified</Badge>
             <Badge className="bg-slate-50 text-slate-400 border-none">{users.length} Total</Badge>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operative</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user: any) => (
                <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge className={cn(
                      "border-none",
                      user.role === 'Admin' ? 'bg-red-50 text-red-600' : 
                      user.role === 'Department Head' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                    )}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <Building2 size={12} className="text-slate-400" />
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{user.department}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <div className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? 'bg-emerald-500' : 'bg-red-500')}></div>
                       <span className={cn("text-[9px] font-black uppercase tracking-widest", user.isActive ? 'text-emerald-600' : 'text-red-600')}>
                         {user.isActive ? 'Active' : 'Locked'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleToggleStatus(user.uid, user.isActive)}
                         className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                       >
                         {user.isActive ? <Lock size={14} /> : <CheckCircle2 size={14} />}
                       </button>
                       <button className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
                         <MoreVertical size={14} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-10 z-[101] text-left"
            >
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">Provision Operative</h2>
              <p className="text-xs text-slate-400 font-medium mb-8">Establish new identity credentials and access permissions.</p>
              
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="Operative Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Email Terminal</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="identity@ngo.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Security Key (Temporary)</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Clearance Role</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-widest"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Department</label>
                    <select 
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-widest"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                     type="button"
                     onClick={() => setIsAddModalOpen(false)}
                     className="flex-1 py-4.5 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                   >
                     Cancel Authorization
                   </button>
                   <button 
                     type="submit"
                     disabled={isSubmitting}
                     className="flex-1 py-4.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                   >
                     {isSubmitting ? 'Provisioning...' : 'Confirm Provisioning'}
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

export default UserManagement;
