import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { 
  X, Upload, File, CheckCircle2, AlertCircle, 
  ChevronDown, Folder, Database, Shield, Zap
} from 'lucide-react';
import { Project, DocumentCategory } from '../types';

interface UploadBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, metadata: any) => Promise<void>;
  projects: Project[];
}

export const UploadBottomSheet = ({ isOpen, onClose, onUpload, projects }: UploadBottomSheetProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('Project_Report');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const categories: { id: DocumentCategory; label: string; icon: any }[] = [
    { id: 'Project_Report', label: 'Mission Report', icon: Folder },
    { id: 'Invoice', label: 'Financial Invoice', icon: Database },
    { id: 'KYC', label: 'Identity/KYC', icon: Shield },
    { id: 'Marketing', label: 'Media/Marketing', icon: Zap },
    { id: 'Legal', label: 'Legal Archives', icon: Shield },
  ];

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      await onUpload(file, {
        category,
        projectId: selectedProjectId,
        projectName: selectedProject?.name || 'General',
        description
      });
      setFile(null);
      setDescription('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-[100] p-8 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Document Ingestion</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Upload verified evidence to the vault</p>
              </div>
              <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div 
                  {...getRootProps()} 
                  className={`relative aspect-video rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center cursor-pointer ${
                    isDragActive ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{file.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • READY
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                        <Upload size={32} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Drop evidence here</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                          MAX PAYLOAD: 10MB (PDF, JPG, PNG, XLSX)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta Description</p>
                   <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Briefly describe the contents of this transmission..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-5 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all min-h-[120px]"
                   />
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Classification</p>
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                     {categories.map((cat) => (
                       <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          category === cat.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                       >
                         <cat.icon size={16} />
                         <span className="text-[9px] font-black uppercase tracking-widest leading-none">{cat.label}</span>
                       </button>
                     ))}
                   </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission Association</p>
                  <div className="relative">
                    <select
                      value={selectedProjectId}
                      onChange={e => setSelectedProjectId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest appearance-none outline-none focus:border-slate-900 transition-all"
                    >
                      <option value="">General Archives (NGO Root)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex gap-4">
                  <button
                    disabled={!file || isUploading}
                    onClick={handleUpload}
                    className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Encrypting & Syncing...
                      </>
                    ) : (
                      <>
                        <Zap size={18} /> Seal & Ingest
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
