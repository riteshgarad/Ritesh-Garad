import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Laugh, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface Attachment {
  file: File;
  preview: string;
  isImage: boolean;
}

interface MessageInputProps {
  onSend: (text: string, attachment?: { url: string; name: string; type: string; isImage: boolean }) => void;
  disabled?: boolean;
}

export const MessageInput = ({ onSend, disabled }: MessageInputProps) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText(prev => prev + emojiData.emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 700KB limit for base64 in Firestore (1MB limit total for doc)
      if (file.size > 700 * 1024) {
        alert("File size exceeds 700KB. For larger files, please use the cloud storage link.");
        return;
      }

      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          file,
          preview: reader.result as string,
          isImage
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || attachment) && !disabled) {
      onSend(text, attachment ? {
        url: attachment.preview,
        name: attachment.file.name,
        type: attachment.file.type,
        isImage: attachment.isImage
      } : undefined);
      
      setText('');
      setAttachment(null);
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="p-1 md:p-2 pb-safe shrink-0 bg-cream/80 backdrop-blur-md z-20 border-t border-mahogany/5 relative">
      <AnimatePresence>
        {attachment && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-2 right-2 md:left-4 md:right-auto md:min-w-[300px] mb-2 p-2 bg-white rounded-2xl shadow-2xl border border-mahogany/10 flex items-center gap-3 z-50"
          >
            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
               {attachment.isImage ? (
                 <img src={attachment.preview} alt="preview" className="w-full h-full object-cover" />
               ) : (
                 <FileText className="text-slate-400" size={24} />
               )}
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <p className="text-[11px] font-black text-mahogany truncate uppercase tracking-tight">{attachment.file.name}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{(attachment.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button 
              onClick={() => setAttachment(null)}
              className="absolute top-1 right-1 p-1 text-slate-400 hover:text-terracotta transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmojiPicker && (
            <motion.div 
              ref={pickerRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 md:left-4 md:right-auto mb-2 md:mb-4 z-50 shadow-2xl rounded-t-2xl md:rounded-2xl overflow-hidden border border-mahogany/10"
            >
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              autoFocusSearch={false}
              theme={Theme.LIGHT}
              width="100%"
              height={350}
              skinTonesDisabled
              searchPlaceHolder="Search emojis..."
              previewConfig={{ showPreview: false }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <form 
        onSubmit={handleSubmit}
        className="flex items-end gap-2 max-w-4xl mx-auto px-1"
      >
        <div className="flex-1 bg-white rounded-[24px] shadow-soft border border-mahogany/5 flex items-end px-2 py-1.5 transition-all focus-within:shadow-md">
          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={cn(
              "p-2.5 transition-colors shrink-0 rounded-full",
              showEmojiPicker ? "text-terracotta bg-terracotta/10" : "text-slate-400 hover:text-terracotta"
            )}
          >
            <Laugh size={24} />
          </button>
          
          <textarea
            rows={1}
            className="flex-1 bg-transparent border-none px-1 py-2.5 text-[14px] md:text-[15px] font-medium text-mahogany outline-none resize-none no-scrollbar placeholder:text-slate-300 min-h-[44px] max-h-32"
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
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-2.5 transition-colors rotate-45 rounded-full",
                attachment ? "text-terracotta bg-terracotta/10" : "text-slate-400 hover:text-terracotta"
              )}
            >
              <Paperclip size={22} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          {(text.trim() || attachment) ? (
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
