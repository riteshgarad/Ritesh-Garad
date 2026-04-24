import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, MoreVertical, ShieldCheck, Mail, Phone, 
  MapPin, Star, Clock, Heart, Users, ChevronRight, CheckCircle2, 
  XCircle, FilterX, Briefcase, User
} from 'lucide-react';
import { Volunteer, VolunteerApplication, AppUser } from '../types';
import { format } from 'date-fns';

interface VolunteerDirectoryProps {
  volunteers: Volunteer[];
  applications: VolunteerApplication[];
  onApprove: (application: VolunteerApplication) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: 'Active' | 'Inactive') => Promise<void>;
  user: AppUser;
}

export const VolunteerDirectory = ({ volunteers, applications, onApprove, onReject, onUpdateStatus, user }: VolunteerDirectoryProps) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'applications'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  const filteredVolunteers = volunteers.filter(v => 
    (v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (skillFilter === '' || v.skills.includes(skillFilter))
  );

  const pendingApps = applications.filter(a => a.status === 'pending_verification');

  const allSkills = Array.from(new Set(volunteers.flatMap(v => v.skills)));

  return (
    <div className="p-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-2">OPERATIVES</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
            <Users size={12} /> Resource Management & HR Protocol
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('directory')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'directory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Directory
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'applications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Applications
            {pendingApps.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]">
                {pendingApps.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search operatives by name or email..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-50 outline-none transition-all"
              />
            </div>
            <div className="flex gap-4">
              <select 
                value={skillFilter}
                onChange={e => setSkillFilter(e.target.value)}
                className="px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-50"
              >
                <option value="">All Skills</option>
                {allSkills.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredVolunteers.map(volunteer => (
                <motion.div
                  layout
                  key={volunteer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-100 p-6 rounded-3xl group hover:shadow-2xl hover:shadow-indigo-50 transition-all hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 relative overflow-hidden">
                        {volunteer.profileImage ? (
                          <img src={volunteer.profileImage} alt={volunteer.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} />
                        )}
                        <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${volunteer.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{volunteer.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{volunteer.department}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Mail size={14} className="text-slate-300" />
                      <span className="text-xs font-medium">{volunteer.email}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {volunteer.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-1 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                          {skill}
                        </span>
                      ))}
                      {volunteer.skills.length > 3 && (
                        <span className="px-2 py-1 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                          +{volunteer.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Impact Hours</p>
                      <p className="text-lg font-black text-slate-900">{volunteer.hours}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Impact Pts</p>
                      <p className="text-lg font-black text-indigo-600">{volunteer.impactPoints}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      ) : (
        /* Applications Table */
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-bottom border-slate-100 text-left">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicant</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Skills</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied At</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pendingApps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FilterX className="text-slate-200" size={40} />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No pending applications</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingApps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                          {app.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{app.name}</p>
                          <p className="text-[10px] font-medium text-slate-500">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1">
                        {app.skills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-tighter">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{format(app.appliedAt.toDate(), 'PPP')}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                        PENDING
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onApprove(app)}
                          className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button 
                          onClick={() => onReject(app.id)}
                          className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
