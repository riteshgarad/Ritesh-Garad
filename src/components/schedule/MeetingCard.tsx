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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-4 relative group"
      id={`meeting-${meeting.id}`}
    >
      {/* Timeline Column */}
      <div className="flex flex-col items-center w-12 pt-1 shrink-0">
        <span className="text-[10px] font-black text-mahogany uppercase tracking-tighter text-right w-full mb-1">
          {format(startTime, 'HH:mm')}
        </span>
        <div className="w-2.5 h-2.5 rounded-full bg-terracotta border-2 border-white shadow-sm z-10" />
        <div className="w-0.5 flex-1 bg-slate-100 group-last:bg-transparent mt-1" />
      </div>

      {/* Card Content Column */}
      <div className="flex-1 pb-8">
        <div className={cn(
          "bg-white rounded-3xl p-5 border-l-4 shadow-soft hover:shadow-md transition-all relative",
          meeting.type === 'mission' ? "border-terracotta" : 
          meeting.type === 'global' ? "border-blue-500" : "border-emerald-500"
        )}>
          <div className="flex justify-between items-start mb-2">
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
              config.color
            )}>
              {config.label}
            </div>
            {meeting.meetingLink && (
              <a 
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 transition-colors"
                title="Join Mission Pulse"
              >
                <Video size={16} />
              </a>
            )}
          </div>

          <h3 className="text-sm font-black text-mahogany tracking-tight leading-tight mb-1">
            {meeting.title}
          </h3>
          
          {meeting.description && (
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed line-clamp-2 mb-3">
              {meeting.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto">
            <div className="flex -space-x-1.5">
              {[1, 2].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-slate-50 border border-white flex items-center justify-center text-[7px] font-bold text-slate-400">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-6 h-6 rounded-full bg-cream border border-white flex items-center justify-center text-[7px] font-black text-terracotta">
                +{Object.keys(meeting.attendees || {}).length}
              </div>
            </div>

            <div className="flex gap-1.5">
              <button 
                onClick={() => onRSVP(meeting.id, 'going')}
                className={cn(
                  "px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                  myStatus === 'going' 
                    ? "bg-green-500 text-white" 
                    : "bg-slate-50 text-slate-400"
                )}
              >
                Intend
              </button>
              <button 
                onClick={() => onRSVP(meeting.id, 'declined')}
                className={cn(
                  "px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                  myStatus === 'declined' 
                    ? "bg-red-500 text-white" 
                    : "bg-slate-50 text-slate-400"
                )}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
