import React from 'react';
import { Clock, MapPin, Video, Users, CheckCircle2, Circle, XCircle, MoreVertical, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface MeetingCardProps {
  meeting: {
    id: string;
    title: string;
    description?: string;
    start: any;
    end: any;
    type: 'global' | 'mission' | 'departmental';
    projectName?: string;
    dept?: string;
    meetingLink?: string;
    attendees?: Record<string, 'going' | 'pending' | 'maybe' | 'declined'>;
    creatorName: string;
  };
  currentUserUid: string;
  onRSVP: (meetingId: string, status: 'going' | 'maybe' | 'declined') => void | Promise<void>;
}

export const MeetingCard = ({ meeting, currentUserUid, onRSVP }: MeetingCardProps) => {
  const startTime = meeting.start?.toDate ? meeting.start.toDate() : new Date(meeting.start);
  const endTime = meeting.end?.toDate ? meeting.end.toDate() : new Date(meeting.end);
  const myStatus = meeting.attendees?.[currentUserUid] || 'pending';

  const typeConfig = {
    global: { label: 'Global NGO', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    mission: { label: meeting.projectName || 'Mission', color: 'bg-terracotta/5 text-terracotta border-terracotta/10' },
    departmental: { label: meeting.dept || 'Department', color: 'bg-blue-50 text-blue-700 border-blue-100' }
  };

  const config = typeConfig[meeting.type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-5 border border-mahogany/5 shadow-soft hover:shadow-md transition-all relative group"
      id={`meeting-${meeting.id}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
          config.color
        )}>
          {config.label}
        </div>
        <button className="text-slate-300 hover:text-mahogany transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-base font-black text-mahogany tracking-tight leading-tight mb-1 group-hover:text-terracotta transition-colors">
            {meeting.title}
          </h3>
          {meeting.description && (
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed line-clamp-2">
              {meeting.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={14} className="text-terracotta/40" />
            <span className="text-[10px] font-black uppercase tracking-tight">
              {format(startTime, 'hh:mm a')} - {format(endTime, 'hh:mm a')}
            </span>
          </div>
          
          {meeting.meetingLink && (
            <a 
              href={meeting.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
            >
              <Video size={14} />
              <span className="text-[10px] font-black uppercase tracking-tight flex items-center gap-1">
                Join Meet <ExternalLink size={10} />
              </span>
            </a>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full bg-cream border-2 border-white flex items-center justify-center text-[8px] font-black text-terracotta">
              +{Object.keys(meeting.attendees || {}).length}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => onRSVP(meeting.id, 'going')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                myStatus === 'going' 
                  ? "bg-green-500 text-white shadow-lg shadow-green-200" 
                  : "bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-600"
              )}
            >
              Going
            </button>
            <button 
              onClick={() => onRSVP(meeting.id, 'declined')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                myStatus === 'declined' 
                  ? "bg-red-500 text-white shadow-lg shadow-red-200" 
                  : "bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600"
              )}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
