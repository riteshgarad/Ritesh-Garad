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
      <div className="pt-safe px-6 pb-2 border-b border-mahogany/5">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-black text-mahogany tracking-tighter">COMMS</h1>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-mahogany transition-colors">
              <Plus size={20} />
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
            className="w-full bg-slate-100 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-terracotta/10 transition-all"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all shrink-0",
                filter === f 
                  ? "bg-terracotta text-white shadow-md shadow-terracotta/20" 
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto pt-2">
        {/* Global Node - Always at top if filter is All or Missions */}
        {(filter === 'All' || filter === 'Missions') && (
          <button 
            onClick={() => onSelect('global')}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 transition-all relative",
              selectedId === 'global' ? "bg-terracotta/5" : "hover:bg-slate-50"
            )}
          >
            {selectedId === 'global' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-terracotta" />}
            <div className="w-14 h-14 rounded-full bg-mahogany/5 flex items-center justify-center text-mahogany shrink-0 border border-mahogany/10">
              <Users size={24} />
            </div>
            <div className="flex-1 border-b border-slate-50 pb-4 h-full">
              <div className="flex justify-between items-baseline">
                <h4 className="text-[15px] font-black text-mahogany leading-tight">General Operations</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Global</span>
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <p className="text-[13px] text-slate-500 truncate">Official mission-wide signal bridge</p>
                {unreadCounts['global'] > 0 && (
                  <div className="bg-terracotta text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center">
                    {unreadCounts['global']}
                  </div>
                )}
              </div>
            </div>
          </button>
        )}

        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-cream rounded-3xl flex items-center justify-center text-terracotta/20 mb-4">
              <MessageSquare size={32} />
            </div>
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No active chats found</p>
            <button className="mt-4 px-6 py-2 bg-terracotta text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-terracotta/20 hover:scale-105 active:scale-95 transition-all">
              Start Conversation
            </button>
          </div>
        ) : (
          filteredContacts.map(contact => (
            <button 
              key={contact.uid}
              onClick={() => onSelect(contact.uid)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 transition-all relative group",
                selectedId === contact.uid ? "bg-terracotta/5" : "hover:bg-slate-50"
              )}
            >
              {selectedId === contact.uid && <div className="absolute left-0 top-0 bottom-0 w-1 bg-terracotta" />}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg border border-slate-200 overflow-hidden">
                   {contact.name.charAt(0)}
                </div>
                {contact.isActive && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                )}
              </div>
              <div className="flex-1 border-b border-slate-50 pb-4 h-full">
                <div className="flex justify-between items-baseline overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-black text-mahogany leading-tight truncate">{contact.name}</h4>
                    {contact.department && (
                      <span className="text-[8px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-widest">
                        {contact.department}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">10:30 AM</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-[13px] text-slate-500 truncate max-w-[180px]">
                    Status: {contact.role} — Securing node...
                  </p>
                  {unreadCounts[contact.uid] > 0 && (
                    <div className="bg-terracotta text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center">
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
