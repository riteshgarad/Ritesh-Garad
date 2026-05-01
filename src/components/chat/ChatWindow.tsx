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
        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="px-4 py-1.5 bg-mahogany/5 backdrop-blur-sm rounded-lg border border-mahogany/10">
            <div className="flex items-center gap-2">
              <Shield size={10} className="text-mahogany/40" />
              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                Missionary-grade absolute encryption active
              </p>
            </div>
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
                  <div className="flex justify-center my-4">
                    <div className="px-3 py-1 bg-slate-200/50 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
                      <p className="text-[9px] font-black text-[#54656F] uppercase tracking-[0.15em]">
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
                    "flex flex-col group max-w-[92%] md:max-w-[85%]",
                    isMe ? "ml-auto items-end" : "mr-auto items-start",
                    isFirstInThread ? "mt-4" : "mt-1"
                  )}
                >
                  {recipient.uid === 'global' && !isMe && isFirstInThread && (
                    <p className="text-[10px] font-black text-mahogany/50 uppercase ml-3 mb-1 tracking-widest">{message.senderName}</p>
                  )}
                  
                  <div className={cn(
                    "relative px-4 py-2.5 rounded-2xl text-[14px] md:text-[15px] font-medium transition-all shadow-sm",
                    isMe 
                      ? "bg-terracotta text-white chat-bubble-right" 
                      : "bg-white text-mahogany chat-bubble-left border border-slate-100",
                    isMe ? (isFirstInThread ? "rounded-tr-none" : "") : (isFirstInThread ? "rounded-tl-none" : "")
                  )}>
                    {message.attachment && (
                      <div className="mb-3 max-w-[280px] rounded-xl overflow-hidden border border-black/5 shadow-inner">
                        {message.attachment.isImage ? (
                          <img 
                            src={message.attachment.url} 
                            alt="attachment" 
                            className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity max-h-[300px]"
                          />
                        ) : (
                          <div className={cn(
                            "flex items-center gap-3 p-4 text-[12px] font-bold uppercase tracking-tight",
                            isMe ? "bg-black/10" : "bg-slate-50"
                          )}>
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
                               <Shield size={20} />
                            </div>
                            <span className="truncate flex-1">{message.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="leading-[1.4] tracking-tight whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                    
                    <div className="flex items-center justify-end gap-1 mt-1.5 -mb-0.5 ml-8 h-4 opacity-70">
                      <p className={cn(
                        "text-[9px] font-black uppercase tracking-tighter",
                        isMe ? "text-white/90" : "text-slate-400"
                      )}>
                        {message.timestamp ? msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                      {isMe && <CheckCheck size={13} className={cn(message.read ? "text-[#34B7F1]" : "text-white/60")} />}
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
