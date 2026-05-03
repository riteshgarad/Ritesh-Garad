import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Target, 
  Lightbulb, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Users, 
  Zap, 
  Award,
  BookOpen,
  Send,
  StickyNote
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { AttendanceHub } from '../attendance/AttendanceHub';
import { innovationService } from '../../services/innovationService';
import { toast } from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';

interface VolunteerOnboardingHubProps {
  user: any;
  setCurrentPage: (page: any) => void;
  initialTab?: 'story' | 'ops' | 'ideas';
}

export const VolunteerOnboardingHub = ({ user, setCurrentPage, initialTab = 'story' }: VolunteerOnboardingHubProps) => {
  const [activeTab, setActiveTab] = useState<'story' | 'ops' | 'ideas'>(initialTab);
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch next 3 meetings
    // Type checking ensures we only get relevant events
    const path = 'schedule';
    const q = query(
      collection(db, path), 
      orderBy('start'), 
      limit(3)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Operational Briefing Sync Error:", error);
      // Silently fail to UI if it's just a background sync issue
    });
    
    return () => unsub();
  }, [user?.uid]);

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2]">
      {/* Brand Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 md:p-10"
      >
        <div className="bg-[#A63A1B] rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-all duration-700" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <Award size={14} className="text-gold" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Authorized Personnel</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter leading-none">
              Welcome to the Family, <br />
              <span className="text-[#FAF7F2]">{user?.name || 'Operative'}</span>
            </h1>
            <p className="text-sm md:text-lg text-white/70 font-bold max-w-xl uppercase tracking-wider italic">
              "Garv Manusakicha" — Let's make an impact together.
            </p>
          </div>
        </div>
      </motion.div>

      {/* 3-Tab Filter Bar */}
      <div className="px-6 mb-8">
        <div className="bg-white/50 backdrop-blur-md p-2 rounded-[2.5rem] flex items-center gap-2 border border-white/50 shadow-sm">
          {[
            { id: 'story', label: 'NGO Story', icon: Heart },
            { id: 'ops', label: 'Operation Center', icon: Target },
            { id: 'ideas', label: 'Idea Hub', icon: Lightbulb }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id 
                  ? "bg-[#A63A1B] text-white shadow-xl shadow-[#A63A1B]/20" 
                  : "text-slate-400 hover:text-slate-900"
              )}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-10"
            >
              {/* Mission Scroll */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-xs font-black text-mahogany uppercase tracking-[0.2em] italic">Success Stories</h3>
                  <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest">View Archives</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-6 px-4 no-scrollbar -mx-4 h-64">
                  {[
                    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=800&auto=format&fit=crop"
                  ].map((url, i) => (
                    <div key={i} className="min-w-[280px] h-full rounded-[2.5rem] overflow-hidden relative group">
                      <img src={url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Mission" />
                      <div className="absolute inset-0 bg-gradient-to-t from-mahogany/80 via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6">
                        <p className="text-white text-[10px] font-black uppercase tracking-widest mb-1 italic">Mission Report: Sector {i + 1}</p>
                        <p className="text-white/80 text-xs font-bold leading-tight">Visual documentation of Garad Foundation in the field.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-8 rounded-[2.5rem] border-b-4 border-emerald-500 shadow-xl shadow-emerald-500/5">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                    <Users size={20} />
                  </div>
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter">5,430+</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lives Impacted</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-b-4 border-[#A63A1B] shadow-xl shadow-[#A63A1B]/5">
                  <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-[#A63A1B] mb-4">
                    <Zap size={20} />
                  </div>
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter">112</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Missions</p>
                </div>
              </div>

              {/* Vision */}
              <div className="bg-[#A63A1B]/5 p-8 rounded-[3rem] border-2 border-dashed border-[#A63A1B]/20 italic text-center">
                <h3 className="text-lg font-black text-[#A63A1B] uppercase tracking-widest mb-2 italic">Our Vision</h3>
                <p className="text-sm font-bold text-mahogany/60 leading-relaxed italic">
                  To empower every human with dignity and dignity with opportunity. We are not just an NGO; we are a movement of "Garv Manusakicha".
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'ops' && (
            <motion.div
              key="ops"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
              {/* Specialized Punch Card (Pulsing Effect) */}
              <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-50 relative overflow-hidden text-center space-y-8">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-terracotta via-mahogany to-terracotta" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-mahogany uppercase italic tracking-tighter">Mission Attendance</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational protocol: Log your presence at the mission node</p>
                </div>

                <div className="relative inline-block">
                   {/* Pulsing ring */}
                   <div className="absolute inset-0 bg-terracotta/20 rounded-full animate-ping scale-150 opacity-20" />
                   <AttendanceHub variant="minimal" />
                </div>
              </div>

              {/* Horizontal Calendar Strip */}
              <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-xs font-black text-mahogany uppercase tracking-[0.2em] italic">Mission Schedule</h3>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 px-4 no-scrollbar -mx-4">
                  {meetings.length > 0 ? meetings.map((meeting) => (
                    <div key={meeting.id} className="min-w-[240px] bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4 group hover:shadow-xl transition-all">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 shrink-0">
                        <span className="text-[10px] font-black text-mahogany uppercase leading-none">{format(meeting.start.toDate(), 'MMM')}</span>
                        <span className="text-lg font-black text-slate-900 leading-none mt-1">{format(meeting.start.toDate(), 'dd')}</span>
                      </div>
                      <div className="flex-1 truncate">
                        <h4 className="text-[11px] font-black text-mahogany uppercase truncate italic mb-1">{meeting.title}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {format(meeting.start.toDate(), 'HH:mm')} • briefing
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="w-full py-10 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 italic">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No intelligence pending</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Onboarding Tasks (Refined) */}
              <div className="space-y-4">
                 <h3 className="text-xs font-black text-mahogany uppercase tracking-[0.2em] px-4 italic">Onboarding Intel</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: "Mission Orientation", desc: "Understand core protocols", done: true },
                      { title: "Identity Verification", desc: "Submit KYC docs", done: true },
                      { title: "First Mission Briefing", desc: "Visit assigned node", done: false },
                      { title: "Innovation Baseline", desc: "Submit first idea", done: false }
                    ].map((task, i) => (
                      <div key={i} className="flex items-center gap-4 p-5 rounded-[2rem] bg-white border border-slate-50 shadow-sm">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all",
                          task.done ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white border-slate-100 text-slate-200"
                        )}>
                          <CheckCircle2 size={14} strokeWidth={4} />
                        </div>
                        <div>
                          <p className={cn("text-[10px] font-black uppercase italic leading-none mb-1", task.done ? "text-mahogany" : "text-slate-400")}>{task.title}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{task.desc}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ideas' && (
             <motion.div
              key="ideas"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <IdeaHub user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button (Idea Hub Quick Launch) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setActiveTab('ideas')}
        className={cn(
          "fixed bottom-24 right-6 w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-terracotta border-4 border-[#FAF7F2] z-50 transition-transform",
          activeTab === 'ideas' ? "scale-0" : "scale-100"
        )}
      >
        <div className="absolute inset-0 bg-terracotta/5 rounded-full animate-ping opacity-20" />
        <Lightbulb size={28} className="fill-current" />
      </motion.button>
    </div>
  );
};

const IdeaHub = ({ user }: { user: any }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other' as any
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ideas, setIdeas] = useState<any[]>([]);

  useEffect(() => {
    innovationService.getUserIdeas(user.uid).then(setIdeas);
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setIsSubmitting(true);
    try {
      await innovationService.submitIdea({
        ...formData,
        submittedBy: user.uid,
        submittedByName: user.name
      });
      toast.success("Inspiration Logged!");
      setFormData({ title: '', description: '', category: 'Other' });
      // Refresh list
      innovationService.getUserIdeas(user.uid).then(setIdeas);
    } catch (err) {
      toast.error("Signal Broadcast Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="bg-[#A63A1B]/5 p-8 rounded-[3rem] border border-[#A63A1B]/10 relative overflow-hidden">
        <StickyNote className="absolute -right-8 -top-8 w-32 h-32 text-[#A63A1B]/5 rotate-12" />
        <div className="relative">
          <h3 className="text-xl font-black text-mahogany uppercase italic flex items-center gap-2">
            <Lightbulb className="text-[#A63A1B]" /> The Idea Hub
          </h3>
          <p className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em] mt-1">Your brain is our greatest asset</p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Innovation Category</label>
              <select 
                className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-terracotta/5 focus:border-terracotta outline-none transition-all shadow-sm appearance-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as any})}
              >
                {['Education', 'Logistics', 'Social Media', 'Environment', 'Community', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Short Identifier</label>
              <input 
                required
                className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-terracotta/5 focus:border-terracotta outline-none transition-all shadow-sm"
                placeholder="e.g. Gamified Learning Nodes"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Conceptual Detailed Briefing</label>
            <textarea 
              required
              rows={4}
              className="w-full bg-white border border-slate-100 rounded-[2rem] px-6 py-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-terracotta/5 focus:border-terracotta outline-none transition-all shadow-sm resize-none italic"
              placeholder="How can we optimize our mission impact?"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-[#A63A1B] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-[#A63A1B]/20 flex items-center justify-center gap-3 transition-all hover:bg-mahogany active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} /> Broadcast Innovation
              </>
            )}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black text-mahogany uppercase tracking-[0.2em] px-4 italic">My Innovation Log</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {ideas.map((idea) => (
            <div key={idea.id} className="group relative">
               {/* Digital Sticky Note Style */}
               <div className="absolute inset-0 bg-yellow-400/10 -rotate-2 rounded-[2rem] group-hover:rotate-0 transition-transform" />
               <div className="relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-terracotta/5 text-terracotta text-[8px] font-black uppercase tracking-widest rounded-full italic">{idea.category}</span>
                    <span className="text-[8px] font-black text-slate-300 uppercase italic">ID: {idea.id.slice(0, 5)}</span>
                  </div>
                  <h4 className="text-sm font-black text-mahogany uppercase mb-3 italic">{idea.title}</h4>
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic line-clamp-3">
                    {idea.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-2">
                       <div className={cn(
                         "w-1.5 h-1.5 rounded-full animate-pulse",
                         idea.status === 'pending' ? "bg-amber-400" : "bg-emerald-400"
                       )} />
                       <span className="text-[8px] font-black text-mahogany/30 uppercase tracking-widest">{idea.status}</span>
                    </div>
                    <BookOpen size={14} className="text-slate-100 group-hover:text-terracotta transition-colors" />
                  </div>
               </div>
            </div>
          ))}
          {ideas.length === 0 && (
             <div className="col-span-full py-16 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <StickyNote size={48} className="mx-auto text-slate-100 mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">The Canvas is Empty. Deploy an Idea.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
