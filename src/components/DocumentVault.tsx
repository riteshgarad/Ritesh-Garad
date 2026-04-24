import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, File, Image as ImageIcon, FileText, Search, Plus, X,
  MoreVertical, Download, Trash2, Calendar, User, LayoutGrid, 
  List, Info, AlertTriangle, ShieldCheck, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { NGODocument, DocumentCategory, AppUser, Transaction } from '../types';
import { format } from 'date-fns';
import { exportTransactionsToExcel } from '../lib/exportService';

interface DocumentVaultProps {
  documents: NGODocument[];
  onUpload: () => void;
  onDelete: (id: string) => Promise<void>;
  user: AppUser;
  transactions: Transaction[];
}

export const DocumentVault = ({ documents, onUpload, onDelete, user, transactions }: DocumentVaultProps) => {
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<NGODocument | null>(null);

  const handleExportFinance = () => {
    const financeTransactions = transactions.filter(t => t.type === 'expense' || t.category === 'Donation' || t.type === 'income');
    exportTransactionsToExcel(financeTransactions);
  };

  const categories: { id: DocumentCategory; icon: any; color: string; label: string }[] = [
    { id: 'Project_Reports', icon: FileText, color: 'text-blue-500', label: 'Project Reports' },
    { id: 'Finance_Records', icon: ShieldCheck, color: 'text-emerald-500', label: 'Finance Records' },
    { id: 'Legal_NGO', icon: ShieldCheck, color: 'text-amber-500', label: 'Legal Archives' },
    { id: 'Volunteer_Docs', icon: User, color: 'text-purple-500', label: 'Volunteer Docs' }
  ];

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchCategory = activeCategory === 'All' || doc.category === activeCategory;
      const matchSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        doc.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Permission filtering
      if (user.role === 'Admin') return matchCategory && matchSearch;
      if (user.role === 'Finance Head' && doc.category !== 'Finance_Records') return false;
      
      return matchCategory && matchSearch;
    });
  }, [documents, activeCategory, searchQuery, user]);

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon size={24} className="text-blue-500" />;
    if (type.includes('pdf')) return <FileText size={24} className="text-red-500" />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <File size={24} className="text-emerald-500" />;
    return <File size={24} className="text-slate-400" />;
  };

  return (
    <div className="flex h-full bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden text-left">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-slate-100 p-6 flex flex-col gap-6 bg-slate-50/30">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Data Segments</h3>
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveCategory('All')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white'
              }`}
            >
              <LayoutGrid size={14} /> Global View
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white'
                }`}
              >
                <cat.icon size={14} className={activeCategory === cat.id ? 'text-white' : cat.color} />
                {cat.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Info size={14} />
            </div>
            <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Storage Status</p>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div className="w-1/3 h-full bg-blue-500" />
          </div>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">14.2 GB / 50 GB Used</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header/Search Area */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name, project or metadata..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold focus:ring-0 focus:border-slate-900 outline-none transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List size={14} />
                </button>
             </div>
             <button 
               onClick={onUpload}
               className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
             >
               <Plus size={14} /> Ingest File
             </button>
             {(user.role === 'Admin' || user.role === 'Finance Head') && (
               <button 
                 onClick={handleExportFinance}
                 className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
               >
                 <FileSpreadsheet size={14} /> Auditor Export
               </button>
             )}
          </div>
        </div>

        {/* Browser Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {filteredDocs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="p-6 bg-slate-50 text-slate-300 rounded-[3rem] mb-6">
                <Folder size={64} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No Records Located</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-2 max-w-xs leading-relaxed italic">
                Adjust your filters or initiate a manual ingestion to populate this segment of the repository.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocs.map(doc => (
                <motion.div 
                  layout
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`group relative bg-white border rounded-[2rem] p-5 transition-all cursor-pointer ${
                    selectedDoc?.id === doc.id ? 'border-slate-900 shadow-xl' : 'border-slate-100 hover:border-slate-200 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-4 rounded-2xl transition-all ${selectedDoc?.id === doc.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900 group-hover:scale-110'}`}>
                      {getFileIcon(doc.fileType)}
                    </div>
                    <button className="p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 transition-all">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <h4 className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight mb-1">{doc.fileName}</h4>
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <span className="flex items-center gap-1"><Folder size={10} strokeWidth={3} /> {doc.projectName || 'General'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-50">
                    <span className="flex items-center gap-1"><User size={10} /> {doc.uploadedBy.split(' ')[0]}</span>
                    <span>{doc.uploadDate?.toDate ? format(doc.uploadDate.toDate(), 'PP') : 'Recent'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
             <div className="space-y-2">
                {filteredDocs.map(doc => (
                  <div 
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`flex items-center gap-6 p-4 rounded-2xl transition-all cursor-pointer group border ${
                      selectedDoc?.id === doc.id ? 'bg-slate-50 border-slate-200' : 'bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-3 bg-slate-50 text-slate-900 rounded-xl">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{doc.fileName}</h4>
                      <p className="text-[9px] text-slate-500 font-medium truncate">{doc.description}</p>
                    </div>
                    <div className="hidden md:block w-32">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doc.category.replace('_', ' ')}</p>
                    </div>
                    <div className="hidden lg:block w-32">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doc.projectName || 'N/A'}</p>
                    </div>
                    <div className="w-24 text-right">
                         <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{doc.uploadDate?.toDate ? format(doc.uploadDate.toDate(), 'PP') : 'Just now'}</p>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </div>
      </div>

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-80 border-l border-slate-100 bg-white p-8 flex flex-col gap-8 shadow-2xl z-10 overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Vault Detail</h3>
              <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-8 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100">
                {getFileIcon(selectedDoc.fileType)}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Inbound File</h4>
                  <p className="text-xs font-black text-slate-900 uppercase leading-relaxed break-all">{selectedDoc.fileName}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Meta Description</h4>
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">{selectedDoc.description}</p>
                </div>
                {selectedDoc.location && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Geo-Tag</h4>
                    <p className="text-[10px] text-slate-900 font-bold uppercase">{selectedDoc.location}</p>
                  </div>
                )}
                {selectedDoc.expiryDate && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <div>
                      <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Expiration Warning</p>
                      <p className="text-[8px] text-amber-700 font-bold">{format(new Date(selectedDoc.expiryDate), 'PPP')}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => window.open(selectedDoc.fileURL, '_blank')}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200"
                >
                  <Download size={14} /> Download Content
                </button>
                {user.role === 'Admin' && (
                  <button 
                    onClick={() => { onDelete(selectedDoc.id); setSelectedDoc(null); }}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} /> Expunge Record
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
