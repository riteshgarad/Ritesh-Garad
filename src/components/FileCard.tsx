import React from 'react';
import { motion } from 'motion/react';
import { 
  File, Image as ImageIcon, FileText, MoreVertical, 
  Download, Trash2, CheckCircle2, XCircle, Clock, User, 
  MessageSquare, ExternalLink
} from 'lucide-react';
import { NGODocument, AppUser } from '../types';
import { format } from 'date-fns';

interface FileCardProps {
  doc: NGODocument;
  onSelect: (doc: NGODocument) => void;
  onVerify?: (id: string, status: 'verified' | 'rejected', reason?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  user: AppUser;
  isSelected?: boolean;
}

export const FileCard = ({ doc, onSelect, onVerify, onDelete, user, isSelected }: FileCardProps) => {
  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon size={20} className="text-blue-500" />;
    if (type.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <File size={20} className="text-emerald-500" />;
    return <File size={20} className="text-slate-400" />;
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending' },
    verified: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Verified' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
  };

  const config = statusConfig[doc.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      layout
      onClick={() => onSelect(doc)}
      className={`group relative bg-white border rounded-[2rem] p-5 cursor-pointer transition-all duration-300 ${
        isSelected ? 'border-slate-900 shadow-xl ring-1 ring-slate-900' : 'border-slate-100 hover:border-slate-200 hover:shadow-lg'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-4 rounded-2xl transition-all ${isSelected ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-900'}`}>
          {getFileIcon(doc.metadata.type)}
        </div>
        
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg}`}>
          <StatusIcon size={12} className={config.color} />
          <span className={`text-[8px] font-black uppercase tracking-widest ${config.color}`}>{config.label}</span>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <h4 className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight leading-tight">
          {doc.fileName}
        </h4>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          {doc.category.replace('_', ' ')} • {doc.metadata.size}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">
            {doc.uploadedBy.charAt(0)}
          </div>
          <div className="flex flex-col">
             <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">{doc.uploadedBy.split(' ')[0]}</span>
             <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">
               {doc.uploadDate?.toDate ? format(doc.uploadDate.toDate(), 'dd MMM') : 'Recently'}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); window.open(doc.fileURL, '_blank'); }}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
          >
            <Download size={14} />
          </button>
          
          {user.role === 'Admin' && doc.status === 'pending' && (
            <div className="flex items-center gap-1 ml-1 border-l border-slate-100 pl-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onVerify?.(doc.id, 'verified'); }}
                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                title="Approve Node"
              >
                <CheckCircle2 size={14} />
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const reason = window.prompt('Encryption Failure Reason:');
                  if (reason) onVerify?.(doc.id, 'rejected', reason);
                }}
                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                title="Reject Node"
              >
                <XCircle size={14} />
              </button>
            </div>
          )}
          
          {user.role === 'Admin' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete?.(doc.id); }}
              className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"
              title="Expunge Record"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {doc.status === 'rejected' && doc.rejectionReason && (
        <div className="mt-3 p-3 bg-red-50 rounded-xl flex gap-2 items-start border border-red-100">
           <MessageSquare size={12} className="text-red-500 shrink-0 mt-0.5" />
           <p className="text-[8px] text-red-600 font-bold leading-relaxed">
             {doc.rejectionReason}
           </p>
        </div>
      )}
    </motion.div>
  );
};
