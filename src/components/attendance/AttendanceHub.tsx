import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Play, 
  Square, 
  Clock, 
  History, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  Navigation,
  ExternalLink,
  Timer
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { attendanceService } from '../../services/attendanceService';
import { Project, Attendance } from '../../types';
import { useLiveTimer } from '../../hooks/useLiveTimer';
import { cn } from '../../lib/utils';

export const AttendanceHub: React.FC = () => {
  const [activeSession, setActiveSession] = useState<Attendance | null>(null);
  const [recentSessions, setRecentSessions] = useState<Attendance[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'pending' | 'active' | 'denied'>('pending');

  const { formatted: timerDisplay, elapsed } = useLiveTimer(activeSession?.punchIn);

  useEffect(() => {
    const init = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch projects
        const projectsSnap = await getDocs(query(collection(db, 'projects'), where('status', '==', 'active')));
        setProjects(projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));

        // Fetch active session
        const active = await attendanceService.getActiveSession(user.uid);
        setActiveSession(active);
        if (active) setSelectedProjectId(active.projectId);

        // Fetch recent sessions
        const recent = await attendanceService.getRecentSessions(user.uid);
        setRecentSessions(recent);

        // Check GPS permission
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
          if (result.state === 'granted') setGpsStatus('active');
          else if (result.state === 'denied') setGpsStatus('denied');
          
          result.onchange = () => {
            if (result.state === 'granted') setGpsStatus('active');
            else if (result.state === 'denied') setGpsStatus('denied');
          };
        });
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handlePunchIn = async () => {
    const user = auth.currentUser;
    if (!user || !selectedProjectId) return;

    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return;

    setIsPunching(true);
    try {
      const id = await attendanceService.punchIn(
        user.uid,
        user.displayName || 'Anonymous Volunteer',
        project.id,
        project.name
      );
      
      const newSession: Attendance = {
        id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous Volunteer',
        projectId: project.id,
        missionName: project.name,
        location: { lat: 0, lng: 0 }, // Will be updated by server Timestamp but local UI needs something
        punchIn: new Date(),
        status: 'active'
      };
      setActiveSession(newSession);
      setGpsStatus('active');
    } catch (err) {
      console.error("Punch in error:", err);
      alert("Failed to access location. Please enable GPS permissions.");
    } finally {
      setIsPunching(false);
    }
  };

  const handlePunchOut = async () => {
    if (!activeSession) return;

    setIsPunching(true);
    try {
      const durationMins = Math.floor(elapsed / 60);
      await attendanceService.punchOut(activeSession.id, activeSession.userId, durationMins);
      
      setActiveSession(null);
      // Refresh recent sessions
      const recent = await attendanceService.getRecentSessions(activeSession.userId);
      setRecentSessions(recent);
    } catch (err) {
      console.error("Punch out error:", err);
    } finally {
      setIsPunching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-mahogany/10 border-t-mahogany rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-[10px] font-black text-mahogany/40 uppercase tracking-[0.3em]">Garv Manusakicha</p>
        <h1 className="text-4xl font-black text-mahogany tracking-tighter">Mission Control</h1>
        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs">
          <Clock size={14} />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Status Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-6 rounded-[2.5rem] border transition-all duration-500",
          activeSession 
            ? "bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-500/10" 
            : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full",
              activeSession ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
            )} />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              activeSession ? "text-emerald-700" : "text-slate-400"
            )}>
              {activeSession ? "Active on Mission" : "Currently Off-Duty"}
            </span>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full flex items-center gap-1.5",
            gpsStatus === 'active' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
          )}>
            <Navigation size={10} className={gpsStatus === 'active' ? "animate-pulse" : ""} />
            <span className="text-[8px] font-black uppercase tracking-widest">
              GPS {gpsStatus === 'active' ? "Signal Verified" : "Required"}
            </span>
          </div>
        </div>
        
        {activeSession ? (
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-emerald-900 line-clamp-1">{activeSession.missionName}</h2>
            <p className="text-xs text-emerald-600 font-bold opacity-70">Stationed @ Mission Hub</p>
          </div>
        ) : (
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800">Ready to Deploy?</h2>
            <p className="text-xs text-slate-400 font-medium">Select a mission to begin tracking impact.</p>
          </div>
        )}
      </motion.div>

      {/* Mission Selector (Only if off-duty) */}
      {!activeSession && (
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Select Operations Node</label>
          <div className="relative">
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-16 pl-6 pr-12 bg-white border border-slate-100 rounded-3xl text-sm font-black text-mahogany appearance-none outline-none focus:ring-4 focus:ring-mahogany/5 transition-all shadow-sm"
            >
              <option value="">Choose Mission...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          </div>
        </div>
      )}

      {/* The Master Action Button */}
      <div className="flex flex-col items-center gap-8 py-4">
        <div className="relative">
          {activeSession && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
              className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"
            />
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            disabled={!selectedProjectId && !activeSession || isPunching}
            onClick={activeSession ? handlePunchOut : handlePunchIn}
            className={cn(
              "w-56 h-56 rounded-full flex flex-col items-center justify-center gap-3 shadow-2xl transition-all duration-500 relative z-10 disabled:opacity-50 disabled:grayscale",
              activeSession 
                ? "bg-gradient-to-br from-mahogany to-slate-900 text-white shadow-mahogany/30 ring-8 ring-mahogany/10" 
                : "bg-gradient-to-br from-terracotta to-[#8B2E15] text-white shadow-terracotta/30 ring-8 ring-terracotta/10"
            )}
          >
            {isPunching ? (
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : activeSession ? (
              <>
                <Square size={48} className="fill-current" />
                <span className="text-sm font-black uppercase tracking-[0.2em]">End Mission</span>
              </>
            ) : (
              <>
                <Play size={48} className="fill-current ml-2" />
                <span className="text-sm font-black uppercase tracking-[0.2em]">Start Mission</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Live Timer */}
        <AnimatePresence>
          {activeSession && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 text-5xl font-black text-mahogany tabular-nums tracking-tighter">
                <Timer size={32} className="text-emerald-500" />
                {timerDisplay}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Session Duration Active</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent History */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Sessions</h3>
          <History size={16} className="text-slate-300" />
        </div>
        
        <div className="space-y-4 px-2">
          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <motion.div 
                key={session.id}
                className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-mahogany uppercase tracking-tight line-clamp-1">{session.missionName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {session.punchIn?.toDate ? new Date(session.punchIn.toDate()).toLocaleDateString() : 'Today'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-mahogany">{session.durationMinutes} min</p>
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Log Synced</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-10 opacity-30">
              <History size={40} className="mx-auto mb-2 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest">No recent operational logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
