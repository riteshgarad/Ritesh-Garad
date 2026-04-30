import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Check, 
  CheckCheck, 
  ArrowLeft,
  MessageCircle,
  Users,
  Shield,
  Search as SearchIcon
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../App';
import { AppUser } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { sendPushNotification } from '../lib/push';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  timestamp: any;
  read: boolean;
}

interface ChatViewProps {
  user: AppUser;
  operators: AppUser[];
}

export function ChatView({ user, operators }: ChatViewProps) {
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('global');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter operators for sidebar
  const contacts = operators.filter(o => o.uid !== user.uid && o.name.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('recipientId', 'in', [selectedRecipientId, user.uid]),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      // Filter for specific conversation if not global
      const filtered = selectedRecipientId === 'global' 
        ? msgs.filter(m => m.recipientId === 'global')
        : msgs.filter(m => 
            (m.senderId === user.uid && m.recipientId === selectedRecipientId) || 
            (m.senderId === selectedRecipientId && m.recipientId === user.uid)
          );

      setMessages(filtered);
    });

    return () => unsubscribe();
  }, [selectedRecipientId, user.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const messageData = {
      text: inputText,
      senderId: user.uid,
      senderName: user.name,
      recipientId: selectedRecipientId,
      timestamp: serverTimestamp(),
      read: false
    };

    setInputText('');

    try {
      await addDoc(collection(db, 'messages'), messageData);
      
      // Trigger Push Notification for the recipient
      if (selectedRecipientId !== 'global') {
        const recipient = operators.find(o => o.uid === selectedRecipientId);
        sendPushNotification({
          title: `Message from ${user.name} 💬`,
          message: inputText.slice(0, 50) + (inputText.length > 50 ? '...' : ''),
          externalIds: [selectedRecipientId]
        });
      } else {
        // Broadcas to everyone? Maybe too much, but for demo let's say "Subscribed Users"
        sendPushNotification({
          title: 'General Ops Message 📡',
          message: `${user.name}: ${inputText.slice(0, 50)}`,
          segment: 'Subscribed Users'
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const selectedContact = contacts.find(c => c.uid === selectedRecipientId);

  return (
    <div className="flex flex-col h-full bg-cream font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-mahogany/5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mahogany rounded-2xl flex items-center justify-center text-white shadow-lg shadow-mahogany/20">
               <MessageCircle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-mahogany uppercase tracking-widest">Mission Comms</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Real-time Signal Node</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
            <MoreVertical size={18} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contacts Sidebar - Hidden on mobile if contact selected */}
        <div className={cn(
          "w-full md:w-80 border-r border-mahogany/5 bg-white transition-all flex flex-col shrink-0",
          selectedRecipientId ? "hidden md:flex" : "flex"
        )}>
           <div className="p-4">
              <div className="relative">
                <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-mahogany/20"
                  placeholder="Search Personnel..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto px-2 pb-6">
              {/* Global Chat Node */}
              <button 
                onClick={() => setSelectedRecipientId('global')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl transition-all mb-1",
                  selectedRecipientId === 'global' ? "bg-mahogany text-white" : "hover:bg-slate-50 text-mahogany"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  selectedRecipientId === 'global' ? "bg-white/20" : "bg-mahogany/5"
                )}>
                  <Users size={18} />
                </div>
                <div className="text-left">
                   <p className="text-[11px] font-black uppercase tracking-tight">General Operations</p>
                   <p className={cn("text-[9px] font-bold uppercase opacity-60", selectedRecipientId === 'global' ? "text-white" : "text-slate-400")}>Global Signal Node</p>
                </div>
              </button>

              <div className="mt-4 mb-2 px-3">
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Active Operatives</p>
              </div>

              {contacts.map(contact => (
                <button 
                  key={contact.uid}
                  onClick={() => setSelectedRecipientId(contact.uid)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all mb-1",
                    selectedRecipientId === contact.uid ? "bg-terracotta text-white" : "hover:bg-slate-50 text-mahogany"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs",
                    selectedRecipientId === contact.uid ? "bg-white/20" : "bg-slate-100 text-slate-400"
                  )}>
                    {contact.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                     <p className="text-[11px] font-black uppercase tracking-tight truncate">{contact.name}</p>
                     <p className={cn("text-[9px] font-bold uppercase opacity-60 truncate", selectedRecipientId === contact.uid ? "text-white" : "text-slate-400")}>
                       {contact.role}
                     </p>
                  </div>
                  {contact.isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />}
                </button>
              ))}
           </div>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
           {selectedRecipientId ? (
             <>
               {/* Chat Header */}
               <div className="bg-white border-b border-mahogany/5 px-6 py-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={() => setSelectedRecipientId('')}
                       className="md:hidden p-2 -ml-2 text-slate-400"
                     >
                       <ArrowLeft size={18} />
                     </button>
                     <div className="w-8 h-8 rounded-lg bg-mahogany/5 flex items-center justify-center text-mahogany text-xs font-black">
                        {selectedRecipientId === 'global' ? <Users size={14} /> : (selectedContact?.name.charAt(0) || '?')}
                     </div>
                     <div>
                        <h3 className="text-[10px] font-black text-mahogany uppercase tracking-widest leading-none">
                          {selectedRecipientId === 'global' ? 'General Ops' : selectedContact?.name}
                        </h3>
                        <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1">
                           Encrypted Node Active
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                     <Shield size={16} />
                  </div>
               </div>

               {/* Messages Area */}
               <div 
                 ref={scrollRef}
                 className="flex-1 overflow-y-auto p-6 space-y-4"
               >
                 <div className="flex flex-col items-center mb-8">
                    <div className="px-4 py-1.5 bg-white rounded-full border border-mahogany/5 shadow-sm">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocol Start: Signal Established</p>
                    </div>
                 </div>

                 {messages.map((message, i) => {
                   const isMe = message.senderId === user.uid;
                   return (
                     <div 
                       key={message.id || i}
                       className={cn(
                         "flex flex-col max-w-[85%]",
                         isMe ? "ml-auto items-end" : "mr-auto items-start"
                       )}
                     >
                        <div className={cn(
                          "px-4 py-3 rounded-2xl shadow-sm text-xs font-medium",
                          isMe 
                            ? "bg-mahogany text-white rounded-tr-none" 
                            : "bg-white text-mahogany rounded-tl-none border border-mahogany/5"
                        )}>
                           {selectedRecipientId === 'global' && !isMe && (
                             <p className="text-[8px] font-black uppercase opacity-60 mb-1">{message.senderName}</p>
                           )}
                           <p className="leading-relaxed">{message.text}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                             {message.timestamp ? new Date(message.timestamp?.toDate ? message.timestamp.toDate() : message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending...'}
                           </p>
                           {isMe && <CheckCheck size={10} className="text-emerald-500" />}
                        </div>
                     </div>
                   );
                 })}
               </div>

               {/* Input Area */}
               <div className="p-6 shrink-0">
                  <form 
                    onSubmit={handleSendMessage}
                    className="flex gap-3"
                  >
                    <input 
                       className="flex-1 bg-white border border-mahogany/10 rounded-2xl px-6 py-4 text-xs font-semibold text-mahogany outline-none focus:border-mahogany/30 shadow-soft"
                       placeholder="Transmit Signal..."
                       value={inputText}
                       onChange={e => setInputText(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="w-12 h-12 bg-mahogany text-white rounded-2xl flex items-center justify-center shadow-lg shadow-mahogany/20 active:scale-95 transition-transform"
                    >
                      <Send size={18} />
                    </button>
                  </form>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                 <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-400 mb-6">
                    <MessageCircle size={32} />
                 </div>
                 <h3 className="text-xs font-black text-mahogany uppercase tracking-[0.2em] mb-2">Comms Offline</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px]">
                    Select a personnel node to establish a mission-critical bridge.
                 </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
