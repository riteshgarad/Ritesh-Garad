import React, { useState } from 'react';
import { Send, Plus, Laugh, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const MessageInput = ({ onSend, disabled }: MessageInputProps) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="p-2 pb-safe shrink-0 bg-cream/80 backdrop-blur-md z-20 border-t border-mahogany/5">
      <form 
        onSubmit={handleSubmit}
        className="flex items-end gap-2 max-w-4xl mx-auto px-1"
      >
        <div className="flex-1 bg-white rounded-[24px] shadow-soft border border-mahogany/5 flex items-end px-2 py-1.5 transition-all focus-within:shadow-md">
          <button type="button" className="p-2.5 text-slate-400 hover:text-terracotta transition-colors shrink-0">
            <Laugh size={24} />
          </button>
          
          <textarea
            rows={1}
            className="flex-1 bg-transparent border-none px-1 py-2.5 text-[15px] font-medium text-mahogany outline-none resize-none no-scrollbar placeholder:text-slate-300 min-h-[44px] max-h-32"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          <div className="flex items-center shrink-0">
            <button type="button" className="p-2.5 text-slate-400 hover:text-terracotta transition-colors rotate-45">
              <Paperclip size={22} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          {text.trim() ? (
            <motion.button
              key="send"
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 45 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              type="submit"
              className="w-12 h-12 bg-terracotta text-white rounded-full flex items-center justify-center shadow-lg shadow-terracotta/25 shrink-0 mb-0.5"
            >
              <Send size={20} className="ml-1" fill="currentColor" />
            </motion.button>
          ) : (
             <motion.button
              key="mic"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              type="button"
              className="w-12 h-12 bg-mahogany text-white rounded-full flex items-center justify-center shadow-lg shadow-mahogany/20 shrink-0 mb-0.5"
            >
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                 <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};
