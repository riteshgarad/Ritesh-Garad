import React, { useEffect, useRef } from 'react';
import { Shield, ArrowLeft, MoreVertical, CheckCheck, Users } from 'lucide-react';
import { AppUser, ChatMessage } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChatWindowProps {
  user: AppUser;
  recipient: AppUser | { uid: string; name: string; role?: string };
  messages: ChatMessage[];
  onBack: () => void;
}

export const ChatWindow = ({
  user,
  recipient,
  messages,
  onBack
}: ChatWindowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatDateLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] relative overflow-hidden">
      {/* WhatsApp Wallpaper Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#A63A1B 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-mahogany/5 px-4 pt-safe pb-3 flex items-center justify-between shrink-0 z-20 shadow-sm sticky top-0">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-mahogany hover:bg-slate-50 rounded-full transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-mahogany/5 flex items-center justify-center text-mahogany text-base font-black shadow-inner border border-mahogany/10">
              {recipient.uid === 'global' ? <Users size={18} /> : recipient.name.charAt(0)}
            </div>
            {recipient.uid !== 'global' && (
               <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            )}
          </div>
          <div className="flex flex-col truncate ml-1.5">
            <h3 className="text-[15px] font-black text-mahogany tracking-tight leading-tight truncate">
              {recipient.uid === 'global' ? 'General Operations' : recipient.name}
            </h3>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                 {recipient.uid === 'global' ? 'Mission Bridge' : 'Active Now'}
               </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 text-slate-400 shrink-0">
           <button className="p-2.5 hover:bg-slate-50 rounded-full transition-colors"><Shield size={20} className="text-terracotta/60" /></button>
           <button className="p-2.5 hover:bg-slate-50 rounded-full transition-colors"><MoreVertical size={20} /></button>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2 z-10 no-scrollbar pb-10"
      >
        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="px-5 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-mahogany/5 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.22em] text-center">
              Signals are secured with missionary-grade encryption
            </p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((message, i) => {
            const isMe = message.senderId === user.uid;
            const msgDate = message.timestamp ? (message.timestamp.toDate ? message.timestamp.toDate() : new Date(message.timestamp)) : new Date();
            const prevMsg = i > 0 ? messages[i-1] : null;
            const prevDate = prevMsg?.timestamp ? (prevMsg.timestamp.toDate ? prevMsg.timestamp.toDate() : new Date(prevMsg.timestamp)) : null;
            
            const showDateLabel = !prevDate || prevDate.toDateString() !== msgDate.toDateString();
            const isFirstInThread = !prevMsg || prevMsg.senderId !== message.senderId || showDateLabel;

            return (
              <React.Fragment key={message.id || i}>
                {showDateLabel && (
                  <div className="flex justify-center my-6">
                    <div className="px-4 py-1.5 bg-[#E1E8EB]/80 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
                      <p className="text-[10px] font-black text-[#54656F] uppercase tracking-widest">
                        {formatDateLabel(msgDate)}
                      </p>
                    </div>
                  </div>
                )}
                
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  layout
                  className={cn(
                    "flex flex-col group max-w-[85%]",
                    isMe ? "ml-auto items-end" : "mr-auto items-start",
                    isFirstInThread ? "mt-3" : "mt-0.5"
                  )}
                >
                  {recipient.uid === 'global' && !isMe && isFirstInThread && (
                    <p className="text-[10px] font-black text-mahogany/40 uppercase ml-2 mb-1 tracking-widest">{message.senderName}</p>
                  )}
                  
                  <div className={cn(
                    "relative px-3 py-2 rounded-xl text-[14px] font-medium transition-all shadow-sm",
                    isMe 
                      ? "bg-terracotta text-white chat-bubble-right" 
                      : "bg-white text-mahogany chat-bubble-left border border-white",
                    isMe ? (isFirstInThread ? "rounded-tr-none" : "") : (isFirstInThread ? "rounded-tl-none" : "")
                  )}>
                    {message.attachment && (
                      <div className="mb-2 max-w-[240px] rounded-lg overflow-hidden border border-white/10">
                        {message.attachment.isImage ? (
                          <img 
                            src={message.attachment.url} 
                            alt="attachment" 
                            className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className={cn(
                            "flex items-center gap-3 p-3 text-[12px] font-bold uppercase tracking-tight",
                            isMe ? "bg-white/10" : "bg-slate-50"
                          )}>
                            <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center shrink-0">
                               <Shield size={16} />
                            </div>
                            <span className="truncate">{message.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="leading-[1.5] tracking-tight whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                    
                    <div className="flex items-center justify-end gap-1 mt-1 -mb-1 ml-4 h-4">
                      <p className={cn(
                        "text-[9px] font-bold uppercase tracking-tighter",
                        isMe ? "text-white/70" : "text-slate-400"
                      )}>
                        {message.timestamp ? msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                      {isMe && <CheckCheck size={14} className={cn(message.read ? "text-[#34B7F1]" : "text-white/40")} />}
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
        <div className="h-4 w-full shrink-0" />
      </div>
    </div>
  );
};
