import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Filter, 
  Search,
  Users,
  Compass,
  Target,
  Shield,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, orderBy, where, updateDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firestore_errors';
import { cn } from '../../lib/utils';
import { MeetingCard } from './MeetingCard';
import { MeetingScheduler } from './MeetingScheduler';

interface CalendarViewProps {
  user: any;
}

export const CalendarView = ({ user }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<any[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [filter, setFilter] = useState<'all' | 'global' | 'mission' | 'dept'>('all');

  useEffect(() => {
    const q = query(
      collection(db, 'schedule'),
      orderBy('start', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMeetings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMeetings(allMeetings);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'schedule');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleRSVP = async (meetingId: string, status: 'going' | 'maybe' | 'declined') => {
    const path = `schedule/${meetingId}`;
    try {
      const meetingRef = doc(db, 'schedule', meetingId);
      await updateDoc(meetingRef, {
        [`attendees.${user.uid}`]: status
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSaveMeeting = async (meetingData: any) => {
    const path = 'schedule';
    try {
      const newMeetingRef = doc(collection(db, 'schedule'));
      await setDoc(newMeetingRef, meetingData);
      setShowScheduler(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const filteredMeetings = meetings.filter(m => {
    const mDate = m.start?.toDate ? m.start.toDate() : new Date(m.start);
    const isSame = isSameDay(mDate, selectedDate);
    if (!isSame) return false;

    if (filter === 'all') return true;
    if (filter === 'global') return m.type === 'global';
    if (filter === 'mission') return m.type === 'mission';
    if (filter === 'dept') return m.type === 'departmental';
    return true;
  });

  const calendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-6 pt-safe pb-6 border-b border-mahogany/5 sticky top-0 z-20">
        <div className="flex items-center justify-between py-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-mahogany rounded-2xl flex items-center justify-center text-white shadow-lg shadow-mahogany/20">
                <CalendarIcon size={20} strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="text-xl font-black text-mahogany tracking-tight uppercase leading-none mb-1">Schedule</h1>
               <p className="text-[9px] font-bold text-terracotta/40 uppercase tracking-widest">Garad Foundation Bridge</p>
             </div>
           </div>
           <div className="flex gap-2">
             {['Admin', 'Department Head'].includes(user.role) && (
               <button 
                 onClick={() => setShowScheduler(true)}
                 className="p-3 bg-terracotta text-white rounded-2xl shadow-xl shadow-terracotta/20 active:scale-95 transition-all"
               >
                 <Plus size={20} strokeWidth={3} />
               </button>
             )}
           </div>
        </div>

        {/* Custom Calendar Grid */}
        <div className="mt-4 bg-cream/50 rounded-[2.5rem] p-4 border border-mahogany/5">
          <div className="flex items-center justify-between mb-4 px-2">
             <h2 className="text-sm font-black text-mahogany uppercase tracking-widest">
               {format(currentDate, 'MMMM yyyy')}
             </h2>
             <div className="flex gap-1">
               <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl text-slate-400"><ChevronLeft size={18} /></button>
               <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl text-slate-400"><ChevronRight size={18} /></button>
             </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {weekDayNames.map(day => (
              <div key={day} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-tighter py-2">
                {day}
              </div>
            ))}
            {calendarDays().map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const hasMeeting = meetings.some(m => isSameDay(m.start?.toDate ? m.start.toDate() : new Date(m.start), day));

              return (
                <button
                  key={idx}
                  onClick={() => onDateClick(day)}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all",
                    !isCurrentMonth ? "opacity-20" : "opacity-100",
                    isSelected ? "bg-terracotta text-white shadow-lg shadow-terracotta/20 scale-110 z-10" : "hover:bg-white"
                  )}
                >
                  <span className={cn(
                    "text-xs font-bold",
                    isToday(day) && !isSelected ? "text-terracotta underline decoration-2 underline-offset-4" : ""
                  )}>
                    {format(day, 'd')}
                  </span>
                  {hasMeeting && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 bg-terracotta/40 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agenda Section */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-mahogany/5 shadow-sm">
           <div className="flex gap-1 overflow-x-auto no-scrollbar">
             {[
               { id: 'all', label: 'All', icon: Compass },
               { id: 'global', label: 'Global', icon: Globe },
               { id: 'mission', label: 'Missions', icon: Target },
               { id: 'dept', label: 'Dept', icon: Shield }
             ].map(f => (
               <button
                 key={f.id}
                 onClick={() => setFilter(f.id as any)}
                 className={cn(
                   "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0",
                   filter === f.id ? "bg-terracotta text-white shadow-md shadow-terracotta/20" : "text-slate-400 hover:bg-slate-50"
                 )}
               >
                 {filter === f.id && <f.icon size={12} />}
                 {f.label}
               </button>
             ))}
           </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-2">
            <h3 className="text-[11px] font-black text-mahogany uppercase tracking-[0.2em]">Agenda</h3>
            <div className="h-px flex-1 bg-slate-200/50" />
            <span className="text-[10px] font-bold text-slate-400">{format(selectedDate, 'EEE, MMM d')}</span>
          </div>

          <div className="space-y-4 min-h-[200px]">
             {filteredMeetings.length > 0 ? (
               filteredMeetings.map(meeting => (
                 <div key={meeting.id}>
                   <MeetingCard 
                     meeting={meeting} 
                     currentUserUid={user.uid}
                     onRSVP={handleRSVP}
                   />
                 </div>
               ))
             ) : (
               <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                  <div className="w-16 h-16 bg-cream border border-mahogany/5 rounded-[2rem] flex items-center justify-center text-slate-300 mb-4">
                    <CalendarIcon size={32} />
                  </div>
                  <h4 className="text-sm font-black text-mahogany uppercase tracking-widest mb-2">No pulses detected</h4>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                    The bridge is clear for this sector. Start a new mission to sync the foundation.
                  </p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {showScheduler && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScheduler(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 top-20 bg-white z-[101] rounded-t-[3rem] overflow-hidden"
            >
              <MeetingScheduler 
                currentUser={user}
                onClose={() => setShowScheduler(false)}
                onSave={handleSaveMeeting}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
