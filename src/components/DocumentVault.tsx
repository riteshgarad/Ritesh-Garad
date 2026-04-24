import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, Search, Plus, X, ChevronLeft, 
  LayoutGrid, List, Info, AlertTriangle, 
  ChevronRight, ArrowLeft, Filter, ShieldAlert,
  Clock, CheckCircle, Database
} from 'lucide-react';
import { NGODocument, DocumentCategory, AppUser, Project } from '../types';
import { FileCard } from './FileCard';
import { UploadBottomSheet } from './UploadBottomSheet';
import { Skeleton } from './ui/Skeleton';

interface DocumentVaultProps {
  documents: NGODocument[];
  projects: Project[];
  onUpload: (file: File, metadata: any) => Promise<void>;
  onVerify: (id: string, status: 'verified' | 'rejected', reason?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  user: AppUser;
  isLoading?: boolean;
}

export const DocumentVault = ({ 
  documents, 
  projects, 
  onUpload, 
  onVerify, 
  onDelete, 
  user,
  isLoading 
}: DocumentVaultProps) => {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null); // null = Root, 'queue' = Verification Queue, or projectId
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'All'>('All');

  const isAdmin = user.role === 'Admin' || user.role === 'Finance Head';

  const stats = useMemo(() => {
    return {
      pending: documents.filter(d => d.status === 'pending').length,
      total: documents.length,
      verified: documents.filter(d => d.status === 'verified').length
    };
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;

      // Logic for Folder navigation
      if (searchQuery) return matchesSearch && matchesCategory; // Search across everything

      if (currentFolder === 'queue') {
        return doc.status === 'pending' && matchesCategory;
      }

      if (currentFolder === 'general') {
        return (!doc.projectId || doc.projectId === '') && matchesCategory;
      }

      if (currentFolder) {
        return doc.projectId === currentFolder && matchesCategory;
      }

      return false; // Root view shows folders, not files (unless searching)
    });
  }, [documents, currentFolder, searchQuery, categoryFilter]);

  const folderData = useMemo(() => {
    const folders = projects.map(p => ({
      id: p.id,
      name: p.name,
      count: documents.filter(d => d.projectId === p.id).length,
      department: p.department
    }));

    return [
      { id: 'general', name: 'General Archives', count: documents.filter(d => !d.projectId || d.projectId === '').length, type: 'system' },
      ...folders
    ];
  }, [projects, documents]);

  const handleVerify = async (id: string, status: 'verified' | 'rejected', reason?: string) => {
    await onVerify(id, status, reason);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden text-left relative">
      {/* Header Area */}
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-white z-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {currentFolder && !searchQuery && (
            <button 
              onClick={() => setCurrentFolder(null)}
              className="p-3 bg-slate-50 text-slate-900 rounded-2xl hover:bg-slate-100 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="space-y-1">
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-3">
               {currentFolder ? 'Storage Node' : 'Smart Archive Vault'}
               {currentFolder === 'queue' && <span className="px-3 py-1 bg-amber-500 text-white text-[8px] rounded-full uppercase tracking-widest font-black">Admin Clearance</span>}
             </h2>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               {currentFolder ? (
                 <>
                   Root <ChevronRight size={10} className="text-slate-300" /> 
                   {currentFolder === 'queue' ? 'Verification Queue' : 
                    currentFolder === 'general' ? 'General Archives' : 
                    projects.find(p => p.id === currentFolder)?.name}
                 </>
               ) : 'Distributed Multi-Mission Document Repository'}
             </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search Vault Node..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-[10px] font-black uppercase tracking-widest focus:border-slate-900 outline-none transition-all"
            />
          </div>
          
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Plus size={14} /> New Ingestion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
        
        {/* Root View: Folder Grid */}
        <AnimatePresence mode="wait">
          {!currentFolder && !searchQuery ? (
            <motion.div 
              key="root"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Quick Filters / Special Folders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {isAdmin && (
                   <button 
                    onClick={() => setCurrentFolder('queue')}
                    className="flex flex-col items-start p-6 bg-amber-500 rounded-[2.5rem] text-white shadow-xl shadow-amber-500/20 group hover:scale-[1.02] transition-all relative overflow-hidden"
                   >
                     <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-125 transition-all duration-700">
                        <ShieldAlert size={120} />
                     </div>
                     <div className="p-3 bg-white/20 rounded-2xl mb-4">
                       <Clock size={24} />
                     </div>
                     <h4 className="text-sm font-black uppercase tracking-widest italic">Verification Queue</h4>
                     <p className="text-[10px] font-bold opacity-80 uppercase mt-1">{stats.pending} Payloads Awaiting Clearance</p>
                   </button>
                 )}
                 <div className="flex flex-col items-start p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <Database size={120} />
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl mb-4">
                       <Filter size={24} />
                     </div>
                     <h4 className="text-sm font-black uppercase tracking-widest italic">Data Distribution</h4>
                     <p className="text-[10px] font-bold opacity-80 uppercase mt-1">{stats.total} Total Documents Sealed</p>
                 </div>
                 <div className="flex flex-col items-start p-6 bg-emerald-600 rounded-[2.5rem] text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <CheckCircle size={120} />
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl mb-4">
                       <CheckCircle size={24} />
                     </div>
                     <h4 className="text-sm font-black uppercase tracking-widest italic">Verified Integrity</h4>
                     <p className="text-[10px] font-bold opacity-80 uppercase mt-1">{Math.round((stats.verified / stats.total) * 100) || 0}% Accuracy Rate</p>
                 </div>
              </div>

              {/* Folders List */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4">
                  Mission Segments <div className="h-[2px] bg-slate-100 flex-1" />
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {folderData.map(folder => (
                    <motion.button
                      key={folder.id}
                      onClick={() => setCurrentFolder(folder.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="group flex flex-col items-center p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-slate-300 hover:shadow-xl transition-all"
                    >
                      <div className="relative mb-4">
                        <Folder size={48} className="text-slate-200 group-hover:text-slate-900 transition-colors" strokeWidth={1.5} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 group-hover:text-slate-900">
                          {folder.count}
                        </div>
                      </div>
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest text-center leading-tight">
                        {folder.name}
                      </h5>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Folder Contents View or Search View */
            <motion.div 
              key="folder-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Category Filter Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                 {(['All', 'Invoice', 'Project_Report', 'KYC', 'Marketing', 'Legal'] as const).map(cat => (
                   <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                      categoryFilter === cat ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                    }`}
                   >
                     {cat === 'All' ? 'Everything' : cat.replace('_', ' ')}
                   </button>
                 ))}
              </div>

              {isLoading ? (
                /* Skeleton Loader */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {[1,2,3,4,5,6,7,8].map(i => (
                     <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-6 h-64 animate-pulse">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl mb-4" />
                        <div className="h-4 bg-slate-50 rounded-full w-3/4 mb-2" />
                        <div className="h-3 bg-slate-50 rounded-full w-1/2" />
                     </div>
                   ))}
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center">
                   <div className="p-10 bg-white border border-slate-100 text-slate-200 rounded-[4rem] mb-6">
                      <Folder size={64} strokeWidth={1} />
                   </div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">No Data In this Segment</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 max-w-xs leading-relaxed italic">
                     Adjust your filters or inject new evidence to populate this storage node.
                   </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredDocs.map(doc => (
                    <FileCard 
                      key={doc.id} 
                      doc={doc} 
                      user={user}
                      onSelect={(selected) => {
                        // Handle preview logic here or selection
                        console.log('Selected:', selected);
                      }}
                      onVerify={async (id, status, reason) => {
                        await handleVerify(id, status, reason);
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UploadBottomSheet 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={onUpload}
        projects={projects}
      />
    </div>
  );
};

