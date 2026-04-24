import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Users, CheckCircle2, XCircle, FilterX, User, 
  MessageCircle, ShieldCheck, Clock, Award, MoreVertical, 
  Plus, ExternalLink, Filter
} from 'lucide-react';
import { Volunteer, VolunteerApplication, AppUser } from '../types';
import { format } from 'date-fns';
import { AddVolunteerModal } from './AddVolunteerModal';

interface VolunteerDirectoryProps {
  volunteers: Volunteer[];
  applications: VolunteerApplication[];
  onApprove: (application: VolunteerApplication) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: Volunteer['status']) => Promise<void>;
  onAddVolunteer: (data: any) => Promise<void>;
  user: AppUser;
}

export const VolunteerDirectory = ({ volunteers, applications, onApprove, onReject, onUpdateStatus, onAddVolunteer, user }: VolunteerDirectoryProps) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'applications'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredVolunteers = volunteers.filter(v => 
    (v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (skillFilter === '' || v.skills.includes(skillFilter)) &&
    (statusFilter === '' || v.status === statusFilter)
  );

  const pendingApps = applications.filter(a => a.status === 'pending_verification');
  const allSkills = Array.from(new Set(volunteers.flatMap(v => v.skills)));

  const getStatusColor = (status: Volunteer['status']) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'On Break': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Ex-Volunteer': return 'bg-slate-50 text-slate-500 border-slate-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  const canManage = user.role === 'Admin' || user.role === 'HR' || user.role === 'DH';

  return (
    <div className="p-6 font-sans relative min-h-screen pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-2">OPERATIVES</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
            <Users size={12} /> Talent Management & Resource Grid
          </p>
        </div>
        
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
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Advanced Controls */}
          <div className="space-y-4 mb-10">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search operatives by name, role or email..."
                className="w-full pl-12 pr-4 py-5 bg-white border border-slate-100 rounded-[32px] text-sm font-medium focus:ring-4 focus:ring-indigo-50 shadow-sm outline-none transition-all"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <Filter size={14} className="text-slate-300" />
                <select 
                  value={skillFilter}
                  onChange={e => setSkillFilter(e.target.value)}
                  className="text-[10px] font-black text-slate-900 uppercase tracking-widest outline-none bg-transparent"
                >
                  <option value="">By Skill</option>
                  {allSkills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <ShieldCheck size={14} className="text-slate-300" />
                <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="text-[10px] font-black text-slate-900 uppercase tracking-widest outline-none bg-transparent"
                >
                  <option value="">By Status</option>
                  {['Active', 'Pending', 'On Break', 'Ex-Volunteer'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Grid View (Mobile First Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredVolunteers.map(volunteer => (
                <motion.div
                  layout
                  key={volunteer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-100 p-8 rounded-[40px] group hover:shadow-2xl hover:shadow-indigo-50 transition-all relative overflow-hidden"
                >
                  {/* Status Ribbon */}
                  <div className={`absolute top-0 right-0 px-6 py-1.5 ${getStatusColor(volunteer.status)} border-b border-l rounded-bl-3xl text-[8px] font-black uppercase tracking-widest`}>
                    {volunteer.status}
                  </div>

                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 relative overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                      {volunteer.profileImage ? (
                        <img src={volunteer.profileImage} alt={volunteer.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{volunteer.name}</h3>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">{volunteer.department}</p>
                    </div>
                  </div>

                  {/* Skill Pills */}
                  <div className="flex flex-wrap gap-2 mb-8 min-h-[48px] content-start">
                    {(Array.isArray(volunteer.skills) ? volunteer.skills : []).map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Impact Stats */}
                  <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-3xl mb-8 group-hover:bg-white group-hover:border group-hover:border-slate-100 transition-all">
                    <div className="text-center border-r border-slate-100">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Impact Hrs</p>
                      <p className="text-xl font-black text-slate-900">{volunteer.hours}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Impact Pts</p>
                      <p className="text-xl font-black text-indigo-600">{volunteer.impactPoints}</p>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => window.open(`https://wa.me/${volunteer.phone?.replace(/[^0-9]/g, '')}`, '_blank')}
                      className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                    >
                      <MessageCircle size={18} fill="currentColor" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Connect</span>
                    </button>
                    <button className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-600 transition-all group-hover:rotate-6">
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      ) : (
        /* Applications List (Mobile Friendly) */
        <div className="space-y-6">
          {pendingApps.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-[40px] p-24 text-center flex flex-col items-center gap-4">
              <FilterX className="text-slate-100" size={80} />
              <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">Grid analysis complete. Zero pending entries.</p>
            </div>
          ) : (
            pendingApps.map(app => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={app.id} 
                className="bg-white border border-slate-100 p-8 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-50 border border-indigo-100 text-indigo-500 rounded-3xl flex items-center justify-center text-xl font-black shadow-inner">
                    {app.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{app.name}</h3>
                    <p className="text-xs font-medium text-slate-400 group-hover:text-indigo-500 transition-colors">{app.email}</p>
                    <div className="flex gap-1.5 mt-3">
                      {app.skills.map(s => <span key={s} className="px-2 py-1 bg-slate-50 text-[8px] font-black uppercase tracking-tighter rounded-md">{s}</span>)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block mr-6">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Received</p>
                    <p className="text-xs font-bold text-slate-600">{format(app.appliedAt.toDate(), 'PPP')}</p>
                  </div>
                  <button 
                    onClick={() => onApprove(app)}
                    className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                  >
                    <CheckCircle2 size={24} />
                  </button>
                  <button 
                    onClick={() => onReject(app.id)}
                    className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* FAB (Floating Action Button) */}
      {canManage && (
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-10 right-10 w-20 h-20 bg-slate-900 text-white rounded-[28px] flex items-center justify-center shadow-[0_20px_50px_rgba(15,23,42,0.3)] z-40"
        >
          <Plus size={32} />
        </motion.button>
      )}

      {/* Onboarding Modal */}
      <AddVolunteerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddVolunteer}
        isLoading={false}
      />
    </div>
  );
};
