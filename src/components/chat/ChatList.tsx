import React from 'react';
import { Search, Users, Plus, MoreVertical, MessageSquare } from 'lucide-react';
import { AppUser } from '../../types';
import { cn } from '../../lib/utils';

interface ChatListProps {
  user: AppUser;
  contacts: AppUser[];
  selectedId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  unreadCounts?: Record<string, number>;
}

export const ChatList = ({
  user,
  contacts,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  unreadCounts = {}
}: ChatListProps) => {
  const [filter, setFilter] = React.useState('All');
  const filters = ['All', 'Missions', 'Departments', 'Private'];

  const filteredContacts = contacts.filter(contact => {
    if (filter === 'All') return true;
    if (filter === 'Departments') return !!contact.department;
    if (filter === 'Missions') return contact.role?.toLowerCase().includes('mission') || contact.role?.toLowerCase().includes('lead');
    if (filter === 'Private') return contact.role?.toLowerCase().includes('admin');
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Safe Area Header */}
      <div className="pt-safe px-5 pb-3 border-b border-mahogany/5 sticky top-0 bg-white z-20">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mahogany rounded-xl flex items-center justify-center text-white shadow-lg shadow-mahogany/20">
              <MessageSquare size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-black text-mahogany tracking-tight">COMMS</h1>
          </div>
          <div className="flex gap-1">
            <button className="p-2 text-slate-400 hover:text-mahogany transition-colors bg-slate-50 rounded-full">
              <Plus size={20} strokeWidth={2.5} />
            </button>
            <button className="p-2 text-slate-400 hover:text-mahogany transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group mb-4">
          <Search 
            size={16} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-terracotta transition-colors" 
          />
          <input 
            className="w-full bg-slate-100 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-mahogany outline-none focus:bg-white focus:ring-2 focus:ring-terracotta/10 transition-all shadow-inner"
            placeholder="Search signals..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                filter === f 
                  ? "bg-terracotta text-white shadow-lg shadow-terracotta/20 scale-105" 
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto pt-2 no-scrollbar">
        {/* Pull to refresh placeholder */}
        <div className="h-0 overflow-hidden flex justify-center items-center text-slate-300">
           <div className="animate-spin rounded-full h-5 w-5 border-2 border-terracotta border-t-transparent" />
        </div>

        {/* Global Node - Always at top if filter is All or Missions */}
        {(filter === 'All' || filter === 'Missions') && (
          <button 
            onClick={() => onSelect('global')}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-3 transition-all relative",
              selectedId === 'global' ? "bg-terracotta/5" : "hover:bg-slate-50"
            )}
          >
            {selectedId === 'global' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-terracotta" />}
            <div className="w-14 h-14 rounded-full bg-mahogany/5 flex items-center justify-center text-mahogany shrink-0 border border-mahogany/10 shadow-sm">
              <Users size={26} strokeWidth={2.2} />
            </div>
            <div className="flex-1 border-b border-slate-50 pb-3 h-full overflow-hidden">
              <div className="flex justify-between items-baseline pt-1">
                <h4 className="text-[16px] font-black text-mahogany tracking-tight truncate">General Operations</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter shrink-0 ml-2">12:45 PM</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-[13px] text-slate-500 truncate font-medium">Official mission-wide bridge active</p>
                {unreadCounts['global'] > 0 && (
                  <div className="bg-terracotta text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-sm shadow-terracotta/20">
                    {unreadCounts['global']}
                  </div>
                )}
              </div>
            </div>
          </button>
        )}

        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center opacity-30 mt-10">
            <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center text-terracotta mb-6 border-2 border-dashed border-terracotta/20">
              <MessageSquare size={36} />
            </div>
            <p className="text-xs font-black text-mahogany uppercase tracking-widest max-w-[200px] leading-loose">Initialize missionary signal bridge</p>
            <button className="mt-6 px-8 py-3 bg-terracotta text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-terracotta/20 hover:scale-105 active:scale-95 transition-all">
              Broadcast
            </button>
          </div>
        ) : (
          filteredContacts.map(contact => (
            <button 
              key={contact.uid}
              onClick={() => onSelect(contact.uid)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-3 transition-all relative group",
                selectedId === contact.uid ? "bg-terracotta/5" : "hover:bg-slate-50"
              )}
            >
              {selectedId === contact.uid && <div className="absolute left-0 top-0 bottom-0 w-1 bg-terracotta" />}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xl border border-slate-200 overflow-hidden shadow-sm">
                   {contact.name.charAt(0)}
                </div>
                {contact.isActive && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-md" />
                )}
              </div>
              <div className="flex-1 border-b border-slate-50 pb-3 h-full overflow-hidden">
                <div className="flex justify-between items-baseline pt-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-[16px] font-black text-mahogany tracking-tight truncate leading-tight">{contact.name}</h4>
                    {contact.department && (
                      <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/50 uppercase tracking-widest shrink-0">
                        {contact.department}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter shrink-0 ml-2">10:30 AM</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[13px] text-slate-500 truncate font-medium max-w-[200px]">
                    {contact.role} — Mission active...
                  </p>
                  {unreadCounts[contact.uid] > 0 && (
                    <div className="bg-terracotta text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-sm shadow-terracotta/20">
                      {unreadCounts[contact.uid]}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
