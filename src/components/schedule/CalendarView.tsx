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
      <div className="bg-white px-6 pt-[env(safe-area-inset-top,24px)] pb-4 border-b border-mahogany/5 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between py-4">
           <div>
             <h1 className="text-xl font-black text-mahogany tracking-tight uppercase leading-none mb-1">
               {format(selectedDate, 'MMMM yyyy')}
             </h1>
             <p className="text-[9px] font-bold text-terracotta/40 uppercase tracking-[0.2em]">Mission Schedule</p>
           </div>
           <div className="flex gap-2">
             <button className="p-2 text-mahogany/40 hover:bg-slate-50 rounded-xl">
               <Search size={20} />
             </button>
             <div className="w-8 h-8 rounded-full bg-slate-100 border border-mahogany/10 flex items-center justify-center text-[10px] font-black text-mahogany">
               {user.name?.[0] || 'U'}
             </div>
           </div>
        </div>

        {/* Horizontal Date Strip */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
          {eachDayOfInterval({
            start: subMonths(new Date(), 0),
            end: addDays(new Date(), 14)
          }).map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const hasMeeting = meetings.some(m => isSameDay(m.start?.toDate ? m.start.toDate() : new Date(m.start), day));

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[54px] h-[72px] rounded-[1.5rem] transition-all shrink-0",
                  isSelected 
                    ? "bg-terracotta text-white shadow-xl shadow-terracotta/20 scale-105" 
                    : "bg-cream border border-mahogany/5 text-mahogany hover:bg-white"
                )}
              >
                <span className="text-[9px] font-black uppercase tracking-tighter mb-1 opacity-60">
                  {format(day, 'EEE')}
                </span>
                <span className="text-sm font-black tracking-tight">
                  {format(day, 'd')}
                </span>
                {hasMeeting && !isSelected && (
                  <div className="w-1 h-1 bg-terracotta mt-1 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agenda Timeline List */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
           <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
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
                   "flex items-center gap-2 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border",
                   filter === f.id 
                    ? "bg-mahogany text-white border-mahogany shadow-lg shadow-mahogany/20" 
                    : "bg-white border-mahogany/5 text-slate-400"
                 )}
               >
                 {f.label}
               </button>
             ))}
           </div>
        </div>

        <div className="space-y-2">
           <AnimatePresence mode="popLayout">
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
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="py-24 flex flex-col items-center justify-center text-center"
               >
                  <div className="w-20 h-20 bg-white border border-mahogany/5 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6 shadow-soft">
                    <CalendarIcon size={32} />
                  </div>
                  <h4 className="text-base font-black text-mahogany uppercase tracking-widest mb-2">Clear Skies</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight max-w-[200px] leading-relaxed">
                    No missions scheduled for this quadrant today.
                  </p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Branded FAB */}
      {['Admin', 'Department Head'].includes(user.role) && (
        <button 
          onClick={() => setShowScheduler(true)}
          className="fixed bottom-[calc(100px+env(safe-area-inset-bottom,24px))] right-6 w-14 h-14 bg-terracotta text-white rounded-2xl shadow-2xl shadow-terracotta/40 flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white/20 backdrop-blur-sm"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      )}

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
