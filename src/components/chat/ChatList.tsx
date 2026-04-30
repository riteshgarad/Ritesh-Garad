import React from 'react';
import { Search, Users } from 'lucide-react';
import { AppUser } from '../../types';
import { cn } from '../../lib/utils';

interface ChatListProps {
  user: AppUser;
  contacts: AppUser[];
  selectedId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ChatList = ({
  user,
  contacts,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange
}: ChatListProps) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Bar */}
      <div className="p-4 pt-safe">
        <div className="relative group">
          <Search 
            size={16} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-terracotta transition-colors" 
          />
          <input 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold outline-none focus:border-terracotta/20 focus:bg-white transition-all shadow-sm"
            placeholder="Search personnel..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto px-2 pb-20">
        {/* Global Node */}
        <button 
          onClick={() => onSelect('global')}
          className={cn(
            "w-full flex items-center gap-4 p-4 rounded-3xl transition-all mb-1",
            selectedId === 'global' ? "bg-terracotta text-white shadow-lg shadow-terracotta/20" : "hover:bg-slate-50 text-slate-900"
          )}
        >
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
            selectedId === 'global' ? "bg-white/20" : "bg-mahogany/5 text-mahogany"
          )}>
            <Users size={24} />
          </div>
          <div className="text-left flex-1 min-w-0">
             <div className="flex justify-between items-baseline mb-0.5">
               <p className="text-[14px] font-black uppercase tracking-tight truncate">General Operations</p>
               <p className={cn("text-[10px] font-bold uppercase", selectedId === 'global' ? "text-white/60" : "text-slate-400")}>Global</p>
             </div>
             <p className={cn("text-[12px] font-medium truncate", selectedId === 'global' ? "text-white/80" : "text-slate-500")}>
               Official mission-wide channel
             </p>
          </div>
        </button>

        <div className="mt-6 mb-3 px-4">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Personnel</p>
        </div>

        {contacts.map(contact => (
          <button 
            key={contact.uid}
            onClick={() => onSelect(contact.uid)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-3xl transition-all mb-1",
              selectedId === contact.uid ? "bg-terracotta text-white shadow-lg shadow-terracotta/20" : "hover:bg-slate-50 text-slate-900"
            )}
          >
            <div className="relative shrink-0">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-colors",
                selectedId === contact.uid ? "bg-white/20" : "bg-slate-100 text-slate-400"
              )}>
                {contact.name.charAt(0)}
              </div>
              {contact.isActive && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
              )}
            </div>
            <div className="text-left flex-1 min-w-0">
               <div className="flex justify-between items-baseline mb-0.5">
                 <p className="text-[14px] font-black uppercase tracking-tight truncate">{contact.name}</p>
                 <p className={cn("text-[10px] font-bold uppercase", selectedId === contact.uid ? "text-white/60" : "text-slate-400")}>
                   {contact.isActive ? 'Active' : 'Offline'}
                 </p>
               </div>
               <p className={cn("text-[12px] font-medium truncate", selectedId === contact.uid ? "text-white/80" : "text-slate-500")}>
                 {contact.role} — {contact.department}
               </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
