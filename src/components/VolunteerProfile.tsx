import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, Clock, Heart, Award, ShieldCheck, Mail, Calendar, 
  MapPin, CheckCircle2, LayoutGrid, List, FileText, Download,
  ExternalLink, ChevronRight, BarChart, Send, Plus, MessageCircle, Phone
} from 'lucide-react';
import { Volunteer, Project, WorkLog, VolunteerCertificate, AppUser, NGODocument } from '../types';
import { format } from 'date-fns';
import { FileCard } from './FileCard';
import { getWhatsAppLink } from '../lib/utils';

interface VolunteerProfileProps {
  volunteer: Volunteer;
  projects: Project[];
  logs: WorkLog[];
  certificates: VolunteerCertificate[];
  onLogHours: (log: any) => Promise<void>;
  user: AppUser;
  documents: NGODocument[];
}

export const VolunteerProfile = ({ volunteer, projects, logs, certificates, onLogHours, user, documents }: VolunteerProfileProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'certs' | 'evidence'>('overview');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    projectId: '',
    hours: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const activeProjects = (projects || []).filter(p => p && p.status === 'active');
  const myLogs = (logs || []).filter(l => l && l.volunteerId === volunteer.id).sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
  const myCerts = (certificates || []).filter(c => c && c.volunteerId === volunteer.id);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProject = projects.find(p => p.id === logForm.projectId);
    await onLogHours({
      ...logForm,
      projectName: selectedProject?.name || '',
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      status: 'pending',
      date: new Date(logForm.date)
    });
    setIsLogModalOpen(false);
    setLogForm({ projectId: '', hours: 0, description: '', date: format(new Date(), 'yyyy-MM-dd') });
  };

  const nextMilestone = Math.ceil((volunteer.impactPoints + 1) / 500) * 500;
  const progress = (volunteer.impactPoints / nextMilestone) * 100;

  return (
    <div className="p-6 font-sans">
      {/* Top Banner Card */}
      <div className="relative mb-12">
        <div className="h-48 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[40px] shadow-lg overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>
        
        <div className="absolute -bottom-8 left-12 flex items-end gap-6">
          <div className="w-32 h-32 bg-white rounded-3xl p-1 shadow-2xl shadow-indigo-200">
            <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 relative overflow-hidden">
              {volunteer.profileImage ? (
                <img src={volunteer.profileImage} alt={volunteer.name} className="w-full h-full object-cover" />
              ) : (
                <BarChart size={40} />
              )}
            </div>
          </div>
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter shadow-sm">{volunteer.name}</h1>
            <div className="flex items-center gap-3">
              <p className="text-white/80 font-black uppercase tracking-widest text-[10px] drop-shadow-sm">
                {volunteer.role} • {volunteer.department}
              </p>
              {volunteer.phone && (
                <button 
                  onClick={() => window.open(getWhatsAppLink(volunteer.phone), '_blank')}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle size={10} fill="currentColor" />
                  WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="absolute top-6 right-6 flex gap-3">
          <button className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
            Edit Profile
          </button>
          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Log Contribution
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Stats & Skills */}
        <div className="lg:col-span-1 space-y-12">
          <div className="bg-transparent p-0 overflow-hidden text-left">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Impact Milestone</h3>
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-50" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * progress) / 100} className="text-indigo-600 transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 leading-none">{volunteer.impactPoints}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Impact Pts</span>
              </div>
            </div>
            <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {nextMilestone - volunteer.impactPoints} PTS TO <span className="text-indigo-600">NEXT TIER</span>
            </p>
          </div>

          <div className="bg-transparent p-0 overflow-hidden text-left">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mastered Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(volunteer.skills) ? volunteer.skills : []).map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-transparent p-0 overflow-hidden text-left">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Badges</h3>
            <div className="flex flex-wrap gap-4">
              {volunteer.badges.map(badge => (
                <div key={badge} className="group relative">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 hover:scale-110 transition-transform cursor-pointer">
                    <Award size={24} />
                  </div>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                    {badge}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Activity & Tabs */}
        <div className="lg:col-span-3">
          <div className="flex gap-8 border-b border-slate-100 mb-8">
            {[
              { id: 'overview', label: 'Impact Grid' },
              { id: 'logs', label: 'Work History' },
              { id: 'certs', label: 'Recognition' },
              { id: 'evidence', label: 'KYC & Evidence' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Assignments */}
                <div className="bg-transparent p-0 overflow-hidden">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-indigo-500" /> Active Assignments
                  </h3>
                  <div className="space-y-4">
                    {activeProjects.length > 0 ? activeProjects.map(project => (
                      <div key={project.id} className="p-4 bg-slate-50 rounded-2xl group hover:bg-indigo-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                          <span className="text-[10px] font-black text-indigo-500 bg-white px-2 py-1 rounded-lg uppercase tracking-wider">{project.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-10">No active assignments</p>
                    )}
                  </div>
                </div>

                {/* Lifetime Stats */}
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'Total Hours', val: volunteer.hours, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Certificates', val: myCerts.length, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Life Impact', val: `${volunteer.impactPoints}+`, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Days Active', val: Math.floor((Date.now() - volunteer.joinDate.toDate()) / (1000 * 60 * 60 * 24)), icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-50' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-transparent p-0 overflow-hidden flex flex-col items-center text-center">
                      <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                        <stat.icon size={24} />
                      </div>
                      <p className="text-2xl font-black text-slate-900 mb-1">{stat.val}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="bg-transparent overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hours</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {myLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.projectName}</p>
                          <p className="text-[10px] font-medium text-slate-500 mt-1 line-clamp-1">{log.description}</p>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-sm font-black text-slate-900">{log.hours}h</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{format(log.date.toDate(), 'PPP')}</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                             log.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : 
                             log.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                           }`}>
                             {log.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'certs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCerts.map(cert => (
                  <div key={cert.id} className="bg-transparent overflow-hidden group transition-all text-left">
                    <div className="w-full aspect-[1/1.4] bg-slate-50 rounded-2xl mb-6 relative overflow-hidden flex items-center justify-center border border-slate-100">
                      <FileText size={48} className="text-slate-200" />
                      <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/80 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button 
                          onClick={() => window.open(cert.certificateURL, '_blank')}
                          className="w-12 h-12 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight mb-2">{cert.projectName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(cert.issuedAt.toDate(), 'MMM yyyy')}</p>
                  </div>
                ))}
                
                {/* Empty State / Achievement Suggestion */}
                {myCerts.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                      <Award size={40} />
                    </div>
                    <h3 className="text-base font-black text-slate-400 uppercase tracking-widest mb-2">No certificates yet</h3>
                    <p className="text-xs font-medium text-slate-400 max-w-xs">Complete an active project to earn your first recognition certificate.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'evidence' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Verified Credentials</h3>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest">Vault Synchronized</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents
                    .filter(doc => doc.uploaderId === volunteer.id && doc.status === 'verified')
                    .map(doc => (
                      <div key={doc.id}>
                        <FileCard 
                          doc={doc} 
                          user={user} 
                        />
                      </div>
                    ))
                  }
                  {documents.filter(doc => doc.uploaderId === volunteer.id && doc.status === 'verified').length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-center">
                      <ShieldCheck size={40} className="text-slate-200 mb-4" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Verified Nodes Found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Hours Modal */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
            >
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Log Contribution</h2>
              <form onSubmit={handleLogSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Project</label>
                  <select 
                    required
                    value={logForm.projectId}
                    onChange={e => setLogForm({...logForm, projectId: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  >
                    <option value="">Select Project</option>
                    {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hours Spent</label>
                    <input 
                      required
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      value={logForm.hours}
                      onChange={e => setLogForm({...logForm, hours: parseFloat(e.target.value)})}
                      className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                    <input 
                      required
                      type="date"
                      value={logForm.date}
                      onChange={e => setLogForm({...logForm, date: e.target.value})}
                      className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description of Work</label>
                  <textarea 
                    required
                    rows={3}
                    value={logForm.description}
                    onChange={e => setLogForm({...logForm, description: e.target.value})}
                    placeholder="e.g. Organized teaching materials for Grade 5..."
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Send size={14} /> Submit for Verification
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
