import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Bell, 
  Copy, 
  Zap, 
  AlertCircle, 
  Settings, 
  FileText, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  X,
  Share2,
  ChevronRight,
  Shield,
  Plus,
  IndianRupee
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { VelocityGauge } from './VelocityGauge';
import { ActionGrid } from './ActionGrid';
import { PersonnelScroll } from './PersonnelScroll';
import { toast } from 'react-hot-toast';

interface MissionDetailViewProps {
  projectId: string;
  projects: any[];
  tasks: any[];
  volunteers: any[];
  onBack: () => void;
  onDelete: (id: string, e: any) => void;
  onUpdateProjectStatus: (id: string, status: string, reason?: string) => void;
  onEditBudget: (project: any) => void;
  user: any;
  onGenerateCertificate: (vId: string) => void;
  workLogs: any[];
  onVerifyLog: (logId: string, status: string) => void;
  milestones: any[];
  onToggleMilestone: (projectId: string, milestoneId: string, status: string) => void;
  onAddMilestone: (projectId: string, milestoneData: any) => void;
  financeRequests: any[];
  budgetRequests: any[];
  setCurrentPage: (page: any) => void;
}

export const MissionDetailView = ({
  projectId, projects, tasks, volunteers, onBack, onDelete, onUpdateProjectStatus,
  onEditBudget, user, onGenerateCertificate, workLogs, onVerifyLog,
  milestones, onToggleMilestone, onAddMilestone, financeRequests, budgetRequests,
  setCurrentPage
}: MissionDetailViewProps) => {
  const project = projects.find((p: any) => p.id === projectId);
  const [activeAnalysis, setActiveAnalysis] = useState(false);
  const [showProtocolLog, setShowProtocolLog] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);

  if (!project) return null;

  const projectTasks = tasks.filter((t: any) => t && (t.projectId || t.project_id) === projectId);
  const projectMilestones = milestones.filter((m: any) => m && m.projectId === projectId);
  
  // Velocity is now triggered by Protocol Completion as requested
  const completedMilestones = projectMilestones.filter(m => m.status === 'completed').length;
  const totalMilestones = projectMilestones.length;
  const velocity = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const projectTeam = volunteers.filter((v: any) => 
    v && projectTasks.some((t: any) => t && t.assigned_to === v.name)
  );

  const getAutomatedStatus = () => {
    if (project.status === 'rejected') return { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-50', pulsing: false };
    if (project.status === 'pending_dept_review' || project.status === 'pending_admin_review') return { label: 'Awaiting Auth', color: 'text-amber-500', bg: 'bg-amber-50', pulsing: true };
    if (project.budget_status === 'pending') return { label: 'Awaiting Funds', color: 'text-blue-500', bg: 'bg-blue-50', pulsing: true };
    if (velocity === 100 && totalMilestones > 0) return { label: 'Final Review', color: 'text-emerald-600', bg: 'bg-emerald-50', pulsing: false };
    if (velocity > 0) return { label: 'In Action', color: 'text-terracotta', bg: 'bg-terracotta/10', pulsing: true };
    return { label: (project.status || 'Active').toUpperCase(), color: 'text-slate-500', bg: 'bg-slate-50', pulsing: false };
  };

  const autoStatus = getAutomatedStatus();
  const maskedId = `#${project.id.slice(-4).toUpperCase()}`;

  const copyId = () => {
    navigator.clipboard.writeText(project.id);
    toast.success('System ID Copied', {
        icon: '📋',
        style: {
            borderRadius: '20px',
            background: '#4A1412',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
        }
    });
  };

  const recentTasks = [...projectTasks]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .filter(t => t.status === 'completed' || t.status === 'done')
    .slice(0, 3);

  const [showAddProtocol, setShowAddProtocol] = useState(false);
  const [newProtocolTitle, setNewProtocolTitle] = useState('');

  const handleAddProtocol = () => {
    if (!newProtocolTitle.trim()) return;
    onAddMilestone(projectId, { title: newProtocolTitle });
    setNewProtocolTitle('');
    setShowAddProtocol(false);
    toast.success('Protocol Established');
  };

  return (
    <div className="min-h-screen bg-cream font-sans pb-32">
      {/* Sticky Header with Safe Area */}
      <header className="sticky top-0 z-[60] bg-cream/80 backdrop-blur-xl border-b border-mahogany/5 pt-safe px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-white border border-mahogany/5 flex items-center justify-center text-mahogany active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black text-mahogany uppercase tracking-widest">Mission Briefing</h1>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <button className="w-10 h-10 rounded-xl bg-white border border-mahogany/5 flex items-center justify-center text-mahogany active:scale-95 transition-transform relative">
            <Bell size={18} strokeWidth={2.5} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-terracotta rounded-full border-2 border-white" />
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 lg:p-12 space-y-8 w-full">
        {/* Mission Identity Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex gap-2">
             <div className={cn("px-4 py-2 rounded-full flex items-center gap-2 border shadow-sm", autoStatus.bg, autoStatus.color.replace('text', 'border'))}>
               <div className={cn("w-2 h-2 rounded-full", autoStatus.color.replace('text', 'bg'))} />
               <span className="text-[10px] font-black uppercase tracking-widest">{autoStatus.label}</span>
             </div>
             <button 
               onClick={copyId}
               className="px-4 py-2 bg-white border border-mahogany/5 rounded-full flex items-center gap-2 shadow-sm active:bg-slate-50 transition-colors"
             >
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{maskedId}</span>
               <Copy size={12} className="text-slate-300" />
             </button>
          </div>
          
          <h2 className="text-3xl font-black text-mahogany uppercase tracking-tighter leading-[0.95]">
            {project.name}
          </h2>
          
          <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-3 italic">
            "{project.description}"
          </p>
        </motion.section>

        {/* Command Hub: Visual Modules */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-6"
        >
          {/* Velocity & Progress */}
          <VelocityGauge progress={velocity} />

          {/* Mission Protocol (Signal Nodes) Section */}
          <div className="bg-transparent p-0 overflow-hidden">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-mahogany/5 rounded-lg">
                   <Shield size={14} className="text-mahogany" />
                 </div>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mission Protocol</h3>
               </div>
               <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{completedMilestones}/{totalMilestones} SECURED</span>
               </div>
             </div>
             
             <div className="space-y-6 relative ml-1">
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100/50" />
                {projectMilestones.map((m, i) => (
                  <motion.div 
                    key={i} 
                    layout
                    className="flex gap-4 items-start group"
                  >
                    <button 
                      onClick={() => {
                        const nextStatus = m.status === 'completed' ? 'pending' : 'completed';
                        onToggleMilestone(project.id, m.id, m.status || 'pending');
                        toast(nextStatus === 'completed' ? 'Node Secured' : 'Node Offline', {
                          icon: nextStatus === 'completed' ? '✅' : '⭕',
                          style: { borderRadius: '15px', background: '#4A1412', color: '#fff', fontSize: '10px', fontWeight: 'bold' }
                        });
                      }}
                      className={cn(
                        "relative z-10 w-8 h-8 rounded-[0.8rem] flex items-center justify-center transition-all border-2 active:scale-90",
                        m.status === 'completed' 
                          ? "bg-emerald-500 border-white shadow-lg shadow-emerald-500/20 text-white" 
                          : "bg-white border-slate-100 text-slate-200"
                      )}
                    >
                      {m.status === 'completed' ? <CheckCircle2 size={16} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-slate-100" />}
                    </button>
                    <div className="flex-1 -mt-0.5">
                       <h4 className={cn(
                         "text-xs font-black uppercase tracking-tight transition-colors", 
                         m.status === 'completed' ? 'text-mahogany' : 'text-slate-400'
                       )}>
                         {m.title}
                       </h4>
                       <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                         {m.status === 'completed' ? 'Status: Finalized' : 'Status: Operational Node'}
                       </p>
                    </div>
                  </motion.div>
                ))}

                {showAddProtocol ? (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-3 pl-12"
                  >
                    <input 
                      autoFocus
                      className="w-full bg-slate-50 border border-slate-100 rounded-[1.2rem] px-4 py-3.5 text-xs font-bold text-mahogany outline-none focus:border-terracotta/30 shadow-inner"
                      placeholder="Input Objective..."
                      value={newProtocolTitle}
                      onChange={e => setNewProtocolTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddProtocol()}
                    />
                    <div className="flex gap-2">
                       <button onClick={handleAddProtocol} className="flex-1 py-3 bg-mahogany text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-mahogany/10">Establish Node</button>
                       <button onClick={() => setShowAddProtocol(false)} className="px-4 py-3 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest">Abort</button>
                    </div>
                  </motion.div>
                ) : (
                  <button 
                    onClick={() => setShowAddProtocol(true)}
                    className="flex gap-4 items-center pl-1 opacity-40 hover:opacity-100 transition-opacity active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-[0.8rem] bg-slate-50 flex items-center justify-center text-slate-400 border border-dashed border-slate-200">
                       <Plus size={14} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Establish New Protocol</span>
                  </button>
                )}
             </div>
          </div>

          {/* Finance Deployment Status */}
          <div className="bg-transparent p-0 overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-emerald-50 rounded-lg">
                      <IndianRupee size={14} className="text-emerald-600" />
                   </div>
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finance Operations</h3>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                  project.budget_status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                )}>
                  {project.budget_status === 'approved' ? 'Deployment Ready' : 'Funding Protocol Active'}
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100/50">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Allocated Grant</p>
                 <span className="text-lg font-black text-mahogany tracking-tighter">{project.budget || '₹ 0'}</span>
               </div>
               <div className="p-5 bg-mahogany rounded-[1.8rem] flex flex-col justify-between text-white shadow-xl shadow-mahogany/10">
                 <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Strategy</p>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-tight">Standard</span>
                    <Zap size={12} className="fill-white" />
                 </div>
               </div>
               <div className="col-span-2 p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100/50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Shield size={14} className="text-slate-400" />
                   </div>
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorization Node</p>
                     <span className="text-[10px] font-black text-mahogany uppercase tracking-tight">{project.department || 'Garad HQ'} Division</span>
                   </div>
                 </div>
                 <ChevronRight size={16} className="text-slate-300" />
               </div>
             </div>
          </div>

          {/* Personnel Scrolling */}
          <PersonnelScroll personnel={projectTeam} />

          {/* Recent Activity Mini-List */}
          <div className="bg-transparent p-0 overflow-hidden">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Signal Logs</h3>
             <div className="space-y-4">
               {recentTasks.length > 0 ? recentTasks.map((task, i) => (
                 <div key={i} className="flex gap-3">
                   <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0">
                     <CheckCircle2 size={14} />
                   </div>
                   <div className="flex flex-col justify-center">
                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight leading-none mb-1">{task.title}</p>
                     <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Completed</p>
                   </div>
                 </div>
               )) : (
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center py-4">No recent signals</p>
               )}
               <button 
                  onClick={() => setCurrentPage('tasks')}
                  className="w-full py-3 bg-slate-50 rounded-xl flex items-center justify-center gap-2 group transition-colors hover:bg-slate-100"
               >
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">View All Tasks</span>
                 <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
               </button>
             </div>
          </div>
        </motion.section>

        {/* Command Hub: Action Overhaul */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ActionGrid 
             onAnalyze={() => setActiveAnalysis(true)}
             onProtocolLog={() => setShowProtocolLog(true)}
             onEdit={() => onEditBudget(project)}
             onTerminate={() => setShowTerminateConfirm(true)}
             isAdmin={user.role === 'Admin'}
          />
        </motion.section>
      </main>

      {/* Overlay Modals */}
      <AnimatePresence>
        {activeAnalysis && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveAnalysis(false)} className="absolute inset-0 bg-mahogany/40 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, y: 100 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 100 }} 
              className="relative bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl p-8 sm:p-12 max-w-2xl w-full text-left overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Zap size={240} /></div>
               <h2 className="text-2xl font-black text-mahogany uppercase tracking-tighter mb-1">Impact Analysis</h2>
               <p className="text-[9px] font-black text-terracotta uppercase tracking-[0.2em] mb-10">System Mission Metrics</p>
               
               <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-10">
                 {[
                   { label: 'Social Reach', val: '2.4k+', color: 'text-mahogany' },
                   { label: 'Asset Efficiency', val: '94.2%', color: 'text-emerald-500' },
                   { label: 'Ops Velocity', val: `${velocity}%`, color: 'text-terracotta' },
                   { label: 'Strategic Units', val: projectTeam.length, color: 'text-slate-900' }
                 ].map((stat, i) => (
                   <div key={i} className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                     <p className={cn("text-xl font-black leading-none", stat.color)}>{stat.val}</p>
                   </div>
                 ))}
               </div>

               <button 
                 className="w-full py-5 bg-mahogany text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-xl shadow-mahogany/20 active:scale-95 transition-transform" 
                 onClick={() => setActiveAnalysis(false)}
               >
                 Acknowledge & Close
               </button>
            </motion.div>
          </div>
        )}

        {showProtocolLog && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProtocolLog(false)} className="absolute inset-0 bg-mahogany/40 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, x: 100 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 100 }} 
              className="relative bg-white h-[90vh] sm:h-full sm:max-h-[80vh] w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl p-10 flex flex-col overflow-hidden text-left"
            >
               <h2 className="text-2xl font-black text-mahogany uppercase tracking-tight mb-8">Protocol Audit</h2>
               <div className="flex-1 overflow-y-auto space-y-6 pr-4 no-scrollbar">
                  {milestones.length > 0 ? milestones.map((m, i) => (
                    <div key={i} className="flex gap-4 items-start translate-x-2">
                       <div className="relative flex flex-col items-center">
                          <div className={cn("w-3 h-3 rounded-full border-2", m.status === 'completed' ? 'bg-emerald-500 border-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 border-white')} />
                          {i !== milestones.length - 1 && <div className="w-px h-12 bg-slate-100 my-1" />}
                       </div>
                       <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 flex-1">
                          <p className="text-[11px] font-black text-mahogany uppercase tracking-tight">{m.title}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {m.status === 'completed' ? 'Node Verified' : 'Mission Requirement'}
                          </p>
                       </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-20">
                      <Shield size={48} />
                      <p className="text-xs font-black uppercase mt-4">Empty Log</p>
                    </div>
                  )}
               </div>
               <button 
                 className="mt-8 py-5 bg-slate-100 text-mahogany rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest active:bg-slate-200 transition-colors" 
                 onClick={() => setShowProtocolLog(false)}
               >
                 Seal & Exit Log
               </button>
            </motion.div>
          </div>
        )}

        {showTerminateConfirm && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTerminateConfirm(false)} className="absolute inset-0 bg-red-950/40 backdrop-blur-md" />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               exit={{ opacity: 0, scale: 0.9 }} 
               className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-sm w-full text-center"
             >
                <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto mb-6">
                  <AlertCircle size={40} />
                </div>
                <h2 className="text-xl font-black text-mahogany uppercase tracking-tight mb-2">Confirm Termination?</h2>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed mb-8">
                  Warning: This will permanently purge mission parameters from the repository.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={(e) => {
                      onDelete(project.id, e);
                      setShowTerminateConfirm(false);
                    }}
                    className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-xl shadow-red-500/20"
                  >
                    Permanent Purge
                  </button>
                  <button 
                    onClick={() => setShowTerminateConfirm(false)}
                    className="w-full py-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem]"
                  >
                    Abort Action
                  </button>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};
