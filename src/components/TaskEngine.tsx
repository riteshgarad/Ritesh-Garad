import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, Layers, 
  BarChart2, Clock, Zap, Target,
  ArrowRight, CheckCircle2, Lock, Layout
} from 'lucide-react';
import { Task, Project, AppUser, TaskStatus, TaskCategory } from '../types';
import { InterlinkedCard } from './InterlinkedCard';
import { GlobalActivityFeed } from './GlobalActivityFeed';

interface TaskEngineProps {
  tasks: Task[];
  projects: Project[];
  user: AppUser;
  onStatusChange: (id: string, newStatus: TaskStatus) => Promise<void>;
  onAddTask: (task: Partial<Task>) => Promise<void>;
  onUploadProof: (id: string) => void;
  logs: any[];
}

export const TaskEngine = ({ 
  tasks, 
  projects, 
  user, 
  onStatusChange, 
  onAddTask, 
  onUploadProof,
  logs
}: TaskEngineProps) => {
  const [activeSegment, setActiveSegment] = useState<TaskCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'board' | 'feed'>('board');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    assignedDept: 'General',
    status: 'todo',
    impactValue: 10,
    proofRequired: false
  });

  const stats = useMemo(() => {
    const total = (tasks || []).length;
    const completed = (tasks || []).filter(t => t && (t.status as string === 'done' || t.status as string === 'completed')).length;
    const locked = (tasks || []).filter(t => t && (t.status === 'locked')).length;
    const avgVelocity = (projects || []).reduce((acc, p) => acc + (p?.progress || 0), 0) / ((projects || []).length || 1);

    return { total, completed, locked, avgVelocity: Math.round(avgVelocity) };
  }, [tasks, projects]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSegment = activeSegment === 'All' || t.assignedDept === activeSegment;
      return matchesSearch && matchesSegment;
    });
  }, [tasks, searchQuery, activeSegment]);

  const segments: (TaskCategory | 'All')[] = ['All', 'Finance', 'Operations', 'Marketing', 'HR', 'Legal'];

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.projectId) return;
    await onAddTask(newTask);
    setIsAddingTask(false);
    setNewTask({ assignedDept: 'General', status: 'todo', impactValue: 10, proofRequired: false });
  };

  return (
    <div className="flex h-full gap-8 p-0 text-left relative overflow-hidden">
      {/* Sidebar Analytics */}
      <div className="hidden xl:flex w-80 flex-col gap-6">
        <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-125 transition-all duration-700">
             <BarChart2 size={160} />
          </div>
          <div className="relative z-10 space-y-6">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-white/10 rounded-2xl">
                 <Zap size={20} className="text-amber-400 fill-amber-400" />
               </div>
               <h3 className="text-sm font-black uppercase tracking-widest italic">Node Velocity</h3>
             </div>
             
             <div className="flex items-end gap-1">
               <span className="text-5xl font-black italic tracking-tighter">{stats.avgVelocity}%</span>
               <span className="text-[10px] font-bold uppercase opacity-60 mb-2">Aggregate</span>
             </div>

             <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-60">
                  <span>Throughput Rate</span>
                  <span>{stats.completed}/{stats.total} Tasks</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.completed / stats.total) * 100 || 0}%` }}
                    className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="flex-1 bg-white border border-slate-100 rounded-[3rem] p-8 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Segments</h3>
             <div className="p-2 bg-slate-50 text-slate-900 rounded-xl">
               <Layers size={14} />
             </div>
           </div>
           
           <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
             {segments.map((seg) => (
                <button
                  key={seg}
                  onClick={() => setActiveSegment(seg)}
                  className={`w-full flex items-center justify-between p-5 rounded-[2rem] transition-all border ${
                    activeSegment === seg ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-x-2' : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:translate-x-1'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{seg}</span>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black ${
                    activeSegment === seg ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {seg === 'All' ? stats.total : tasks.filter(t => t.assignedDept === seg).length}
                  </div>
                </button>
             ))}
           </div>
        </div>
      </div>

      {/* Main Orchestration Node */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="bg-transparent md:bg-white md:border md:border-slate-100 md:rounded-[3rem] p-4 md:p-6 shadow-none md:shadow-xl md:shadow-slate-200/20 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
             <div className="p-4 bg-slate-50 text-slate-900 rounded-[1.5rem] shadow-sm hidden sm:block">
                <Target size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Task Orchestrator</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cross-Departmental Synergy Matrix</p>
             </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
             <div className="relative shrink-0 w-48 sm:w-64">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Intercept Protocol Data..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-[10px] font-black uppercase tracking-widest focus:border-slate-900 outline-none transition-all"
                />
             </div>
             <button 
               onClick={() => setView(view === 'board' ? 'feed' : 'board')}
               className="p-4 bg-slate-50 text-slate-900 rounded-2xl hover:bg-slate-100 transition-all shadow-sm flex items-center gap-2 group shrink-0"
             >
                {view === 'board' ? <Clock size={18} className="group-hover:rotate-12 transition-transform" /> : <Layout size={18} className="group-hover:rotate-12 transition-transform" />}
                <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Telemetry</span>
             </button>
             <button 
               onClick={() => setIsAddingTask(true)}
               className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0"
             >
                <Plus size={18} />
                <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">New Data Bridge</span>
             </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 px-4 md:px-0">
          <AnimatePresence mode="wait">
            {view === 'board' ? (
              <motion.div
                key="board"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 overflow-y-auto pb-24 md:pb-6 custom-scrollbar"
              >
                {filteredTasks.length === 0 ? (
                  <div className="col-span-full h-full flex flex-col items-center justify-center opacity-30 italic text-slate-400 p-20 text-center">
                    <Target size={64} strokeWidth={1} className="mb-6 animate-pulse" />
                    <p className="text-sm font-black uppercase tracking-widest">No active data bridges in this segment</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div key={task.id}>
                      <InterlinkedCard 
                        task={task} 
                        onStatusChange={onStatusChange}
                        onUploadProof={onUploadProof}
                      />
                    </div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="feed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full"
              >
                <GlobalActivityFeed logs={logs} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isAddingTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingTask(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-[101] p-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Inject Protocol</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Establish a new data bridge across departments</p>
                </div>
                <button onClick={() => setIsAddingTask(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                  <ArrowRight size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission Link</label>
                  <select 
                    value={newTask.projectId}
                    onChange={e => setNewTask({...newTask, projectId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:border-slate-900 transition-all appearance-none"
                  >
                    <option value="">Select Project Node...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Title</label>
                  <input 
                    type="text"
                    placeholder="Enter operation name..."
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:border-slate-900 transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Execution Details</label>
                  <textarea 
                    placeholder="Describe the synergistic objective..."
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 text-xs font-medium outline-none focus:border-slate-900 transition-all min-h-[150px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departmental Custody</label>
                    <select 
                      value={newTask.assignedDept}
                      onChange={e => setNewTask({...newTask, assignedDept: e.target.value as TaskCategory})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:border-slate-900 transition-all appearance-none"
                    >
                      {segments.filter(s => s !== 'All').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Impact Multiplier</label>
                    <input 
                      type="number"
                      value={newTask.impactValue}
                      onChange={e => setNewTask({...newTask, impactValue: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:border-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Enforce Empirical Evidence</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter italic">Requires file upload to achieve 'Done' status</p>
                   </div>
                   <button 
                    onClick={() => setNewTask({...newTask, proofRequired: !newTask.proofRequired})}
                    className={`w-14 h-8 rounded-full transition-all relative ${newTask.proofRequired ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-200'}`}
                   >
                     <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${newTask.proofRequired ? 'left-7' : 'left-1'}`} />
                   </button>
                </div>

                <div className="pt-10">
                  <button 
                    onClick={handleCreateTask}
                    disabled={!newTask.title || !newTask.projectId}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    Authorize Data Bridge
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
