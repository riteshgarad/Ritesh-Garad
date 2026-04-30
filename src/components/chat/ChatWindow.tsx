import React, { useEffect, useRef } from 'react';
import { Shield, ArrowLeft, MoreVertical, CheckCheck } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-full bg-cream relative overflow-hidden">
      {/* WhatsApp Wallpaper Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#A63A1B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Header */}
      <header className="bg-white border-b border-mahogany/5 px-4 pt-safe pb-3 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-mahogany transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-mahogany/5 flex items-center justify-center text-mahogany text-sm font-black shadow-sm">
              {recipient.uid === 'global' ? 'G' : recipient.name.charAt(0)}
            </div>
            {recipient.uid !== 'global' && (
               <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </div>
          <div className="flex flex-col">
            <h3 className="text-[13px] font-black text-mahogany uppercase tracking-widest leading-none">
              {recipient.uid === 'global' ? 'General Operations' : recipient.name}
            </h3>
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {recipient.uid === 'global' ? 'System Bridge Active' : 'Secure Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
           <Shield size={18} className="text-terracotta/40" />
           <MoreVertical size={20} className="cursor-pointer hover:text-mahogany transition-colors" />
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-3 z-10 no-scrollbar"
      >
        <div className="flex flex-col items-center mb-10 mt-2">
          <div className="px-5 py-2 bg-white/60 backdrop-blur-sm rounded-2xl border border-mahogany/5 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Signal Bridge Established | E2E Secure</p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((message, i) => {
            const isMe = message.senderId === user.uid;
            const prevMsg = i > 0 ? messages[i-1] : null;
            const isFirstInThread = !prevMsg || prevMsg.senderId !== message.senderId;

            return (
              <motion.div 
                key={message.id || i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={cn(
                  "flex flex-col group max-w-[82%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start",
                  isFirstInThread ? "mt-4" : "mt-0.5"
                )}
              >
                {recipient.uid === 'global' && !isMe && isFirstInThread && (
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-3 mb-1 tracking-widest">{message.senderName}</p>
                )}
                
                <div className={cn(
                  "relative px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all shadow-sm",
                  isMe 
                    ? "bg-terracotta text-white chat-bubble-right" 
                    : "bg-white text-mahogany chat-bubble-left border border-mahogany/5",
                  isMe ? (isFirstInThread ? "rounded-tr-none" : "") : (isFirstInThread ? "rounded-tl-none" : "")
                )}>
                  <p className="leading-relaxed tracking-tight whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                  
                  <div className="flex items-center justify-end gap-1 mt-1 -mr-1">
                    <p className={cn(
                      "text-[9px] font-bold uppercase tracking-tighter opacity-70",
                      isMe ? "text-white/80" : "text-slate-400"
                    )}>
                      {message.timestamp ? (message.timestamp.toDate ? message.timestamp.toDate() : new Date(message.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                    {isMe && <CheckCheck size={12} className={cn(message.read ? "text-blue-300" : "text-white/40")} />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div className="h-4 w-full shrink-0" />
      </div>
    </div>
  );
};
