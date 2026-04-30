import React from 'react';
import { Users } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PersonnelScrollProps {
  personnel: any[];
}

export const PersonnelScroll = ({ personnel }: PersonnelScrollProps) => {
  if (!personnel || personnel.length === 0) return (
    <div className="p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center">
      <Users size={24} className="text-slate-300 mb-2" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Units</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Personnel</h3>
        <span className="text-[10px] font-black text-terracotta uppercase tracking-tighter">{personnel.length} Units</span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {personnel.map((person, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center p-1 group-active:scale-95 transition-transform overflow-hidden">
               {person.photoURL ? (
                 <img src={person.photoURL} alt={person.name} className="w-full h-full object-cover rounded-[1.2rem]" />
               ) : (
                 <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold uppercase text-xl rounded-[1.2rem]">
                   {person.name?.[0] || 'U'}
                 </div>
               )}
            </div>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight text-center max-w-[64px] truncate">
              {person.name?.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
