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
    <div className="p-4 pb-safe shrink-0 bg-cream/50 backdrop-blur-sm z-20">
      <form 
        onSubmit={handleSubmit}
        className="flex items-center gap-3"
      >
        <div className="flex-1 bg-white rounded-3xl shadow-soft border border-mahogany/10 flex items-center px-4 py-1 transition-all focus-within:border-terracotta/30 focus-within:ring-2 focus-within:ring-terracotta/5">
          <button type="button" className="p-2 text-slate-400 hover:text-terracotta transition-colors">
            <Laugh size={20} />
          </button>
          
          <textarea
            rows={1}
            className="flex-1 bg-transparent border-none px-2 py-3 text-[14px] font-medium text-mahogany outline-none resize-none no-scrollbar placeholder:text-slate-300"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          <button type="button" className="p-2 text-slate-400 hover:text-terracotta transition-colors rotate-45">
            <Paperclip size={20} />
          </button>
        </div>

        <AnimatePresence mode="popLayout">
          {text.trim() ? (
            <motion.button
              key="send"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              type="submit"
              className="w-12 h-12 bg-terracotta text-white rounded-full flex items-center justify-center shadow-lg shadow-terracotta/20 shrink-0"
            >
              <Send size={20} className="ml-0.5" />
            </motion.button>
          ) : (
             <motion.button
              key="plus"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              type="button"
              className="w-12 h-12 bg-mahogany/5 text-mahogany rounded-full flex items-center justify-center shrink-0 border border-mahogany/10"
            >
              <Plus size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};
