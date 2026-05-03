import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
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
  const [totalHours, setTotalHours] = useState<number>(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'pending' | 'active' | 'denied'>('pending');

  const [selectedSession, setSelectedSession] = useState<Attendance | null>(null);

  const { formatted: timerDisplay, elapsed } = useLiveTimer(activeSession?.punchIn);

  useEffect(() => {
    const init = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch projects
        const projectsSnap = await getDocs(query(collection(db, 'projects'), where('status', '==', 'active')));
        setProjects(projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));

        // Fetch User Hours
        const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid), limit(1)));
        if (!userSnap.empty) {
          setTotalHours(userSnap.docs[0].data().hours || 0);
        }

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
      const { id, locationName } = await attendanceService.punchIn(
        user.uid,
        user.displayName || user.email?.split('@')[0] || 'Unknown Operative',
        project.id,
        project.name
      );
      
      const newSession: Attendance = {
        id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Unknown Operative',
        projectId: project.id,
        missionName: project.name,
        location: { lat: 0, lng: 0 }, 
        punchInLocationName: locationName,
        punchIn: new Date(),
        status: 'active'
      };
      setActiveSession(newSession);
      setGpsStatus('active');
      toast.success("Mission Active");
    } catch (err: any) {
      console.error("Punch in error:", err);
      if (err.message === 'LOCATION_PERM_DENIED') {
        alert("CRITICAL: Location Access REFUSED. To log missions, go to Phone Settings > App Management > Mission App > Permissions and enable 'Location' (Allow While Using App).");
        toast.error("Location Required");
      } else {
        toast.error("Deployment failed. Re-sync needed.");
      }
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
      // Refresh recent sessions and hours
      const recent = await attendanceService.getRecentSessions(activeSession.userId);
      setRecentSessions(recent);

      const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', activeSession.userId), limit(1)));
      if (!userSnap.empty) {
        setTotalHours(userSnap.docs[0].data().hours || 0);
      }
      toast.success("Mission Logged");
    } catch (err: any) {
      console.error("Punch out error:", err);
      if (err.message === 'LOCATION_PERM_DENIED') {
        alert("CRITICAL: Location Access REFUSED. Go to Phone Settings > Mission App > Permissions and enable 'Location' to secure your logs.");
        toast.error("Location Required");
      } else {
        toast.error("Log upload failed.");
      }
    } finally {
      setIsPunching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-mahogany/10 border-t-mahogany rounded-full animate-spin" />
        <p className="mt-4 text-[10px] font-black text-mahogany/40 uppercase tracking-widest">Loading Operational Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8 pb-32 px-4 md:px-0">
      {/* Mission Detail Inspection Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-mahogany/60 backdrop-blur-md px-4 pb-0 md:pb-4 md:px-0"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-[#FAF7F2] w-full max-w-md rounded-t-[3rem] md:rounded-[3rem] p-10 overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-mahogany/50 uppercase tracking-[0.2em]">Deployment Log</p>
                  <h3 className="text-2xl font-black text-mahogany italic uppercase tracking-tighter">Mission Pulse</h3>
                </div>
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-mahogany transition-colors"
                >
                  <AlertCircle size={20} className="rotate-45" />
                </button>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Operative State</p>
                  <h4 className="text-xl font-black text-mahogany">{selectedSession.missionName}</h4>
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Mission Certified</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic">Entry Pulse</p>
                      <p className="text-sm font-black text-mahogany">
                        {selectedSession.punchIn?.toDate ? selectedSession.punchIn.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                      </p>
                      <div className="flex gap-2 text-slate-500">
                        <MapPin size={10} className="shrink-0 mt-0.5" />
                        <p className="text-[9px] font-medium leading-tight line-clamp-3">
                          {selectedSession.punchInLocationName || 'Mission Node'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic">Exit Pulse</p>
                      <p className="text-sm font-black text-mahogany">
                        {selectedSession.punchOut?.toDate ? selectedSession.punchOut.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                      </p>
                      <div className="flex gap-2 text-slate-500 justify-end">
                        <p className="text-[9px] font-medium leading-tight line-clamp-3 text-right">
                          {selectedSession.punchOutLocationName || 'Mission Node'}
                        </p>
                        <MapPin size={10} className="shrink-0 mt-0.5" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Duration</p>
                    <div className="flex items-center gap-2">
                       <Clock size={16} className="text-terracotta" />
                       <span className="text-2xl font-black text-mahogany tracking-tighter">{selectedSession.durationMinutes} <span className="text-xs uppercase tracking-normal">Minutes</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deployment Date</p>
                    <p className="text-[11px] font-black text-mahogany uppercase">
                      {selectedSession.punchIn?.toDate ? selectedSession.punchIn.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Today'}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedSession(null)}
                className="w-full mt-8 py-5 bg-mahogany text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-mahogany/20 active:scale-95 transition-all"
              >
                Close Operational Record
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications / Overlay */}
      <AnimatePresence>
        {isPunching && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-6"
          >
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 text-center border-b-8 border-emerald-500">
              <div className="w-20 h-20 border-8 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Syncing Location</h3>
                <p className="text-sm text-slate-500 font-bold max-w-[240px]">
                  Securing mission coordinates. 
                  <span className="block text-emerald-600 mt-1 uppercase text-[10px] tracking-widest animate-pulse">If prompted, select "Allow While Using App"</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-[10px] font-black text-mahogany/40 uppercase tracking-[0.3em]">Garv Manusakicha</p>
        <h1 className="text-4xl font-black text-mahogany tracking-tighter">Mission Control</h1>
        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs">
          <Clock size={14} />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Impact Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-mahogany rounded-[2.5rem] p-6 text-white flex items-center justify-between shadow-2xl shadow-mahogany/20 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-terracotta/20 rounded-full -ml-12 -mb-12 blur-2xl" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <Timer size={32} className="text-terracotta" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Total Service Impact</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black italic tracking-tighter">{totalHours.toFixed(1)}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-terracotta">Hours</span>
            </div>
          </div>
        </div>
        
        <div className="text-right flex flex-col items-end relative z-10">
          <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20 mb-2">
            Verified Rank
          </div>
          <p className="text-[11px] font-black tracking-widest text-white uppercase italic">Active Operative</p>
        </div>
      </motion.div>

      {/* Status Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-6 rounded-[2.5rem] border transition-all duration-500 text-left",
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
          <button 
            className={cn(
              "px-3 py-1 rounded-full flex items-center gap-1.5 transition-all",
              gpsStatus === 'active' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
            )}
          >
            <Navigation size={10} className={gpsStatus === 'active' ? "animate-pulse" : ""} />
            <span className="text-[8px] font-black uppercase tracking-widest">
              GPS {gpsStatus === 'active' ? "Verified" : "Syncing..."}
            </span>
          </button>
        </div>
        
        {activeSession ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-emerald-900 line-clamp-1">{activeSession.missionName}</h2>
              <div className="flex items-center gap-2 text-emerald-600/70">
                <MapPin size={12} />
                <p className="text-[10px] font-bold uppercase truncate max-w-[200px]">
                  {activeSession.punchInLocationName || 'Mission Hub'}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200/40 flex justify-between items-end">
              <div>
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">PUNCHED IN AT</p>
                <p className="text-xs font-black text-emerald-900">
                  {activeSession.punchIn?.toDate ? activeSession.punchIn.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
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
        <div className="space-y-4 text-left">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Operations Node</label>
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
                ? "bg-gradient-to-br from-mahogany to-slate-900 text-white shadow-mahogany/30 ring-8 ring-mahogany/10 border-4 border-white/20" 
                : "bg-gradient-to-br from-terracotta to-[#8B2E15] text-white shadow-terracotta/30 ring-8 ring-terracotta/10 border-4 border-white/20"
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
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Operational Deployment Logs</h3>
          <History size={16} className="text-slate-300" />
        </div>
        
        <div className="space-y-4 px-0">
          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <motion.div 
                key={session.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSession(session)}
                className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow text-left cursor-pointer active:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                      <CheckCircle2 size={24} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-mahogany uppercase tracking-tight line-clamp-1">{session.missionName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {session.punchIn?.toDate ? new Date(session.punchIn.toDate()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-mahogany">{session.durationMinutes} min</p>
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Completed</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">In: {session.punchIn?.toDate ? new Date(session.punchIn.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    <div className="flex items-start gap-1.5">
                      <MapPin size={8} className="text-slate-300 mt-0.5 shrink-0" />
                      <p className="text-[9px] font-medium text-slate-500 line-clamp-2 leading-tight">
                        {session.punchInLocationName || 'Coordinates Recorded'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Out: {session.punchOut?.toDate ? new Date(session.punchOut.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    <div className="flex items-start gap-1.5 justify-end">
                      <p className="text-[9px] font-medium text-slate-500 line-clamp-2 leading-tight text-right">
                        {session.punchOutLocationName || 'Coordinates Recorded'}
                      </p>
                      <MapPin size={8} className="text-slate-300 mt-0.5 shrink-0" />
                    </div>
                  </div>
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
