import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, File, Image as ImageIcon, FileText, CheckCircle2, Loader2, MapPin, Hash } from 'lucide-react';
import { DocumentCategory, Project } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../App';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: any) => Promise<void>;
  projects: Project[];
}

export const FileUploadModal = ({ isOpen, onClose, onUpload, projects }: FileUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    description: '',
    category: 'Project_Reports' as DocumentCategory,
    projectId: '',
    location: '',
    expiryDate: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles: 1,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  } as any);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload to Firebase Storage
      const storagePath = `documents/${metadata.category}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // 2. Commit metadata to Firestore via callback
      await onUpload({
        ...metadata,
        fileName: file.name,
        fileURL: downloadURL,
        fileSize: file.size,
        fileType: file.type,
        projectName: projects.find(p => p.id === metadata.projectId)?.name || 'General'
      });
      
      onClose();
      setFile(null);
      setMetadata({
        description: '',
        category: 'Project_Reports',
        projectId: '',
        location: '',
        expiryDate: ''
      });
    } catch (error) {
      console.error("Storage Error:", error);
      alert("Storage error: Please ensure Firebase Storage is enabled in your console and the service account is linked (Error 412).");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden text-left"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Repository Ingestion</h3>
                <p className="text-[10px] text-slate-500 font-medium italic mt-1">Upload critical NFT documentation for immutable storage.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-[2rem] p-10 text-center transition-all cursor-pointer ${
                  isDragActive ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl mb-3">
                      <CheckCircle2 size={32} />
                    </div>
                    <p className="text-xs font-black text-slate-900 uppercase truncate max-w-xs">{file.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="mt-4 text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={32} />
                    </div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Inbound Stream</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">Drag and drop or click to browse</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Archive Segment</label>
                  <select 
                    required
                    value={metadata.category}
                    onChange={e => setMetadata({...metadata, category: e.target.value as DocumentCategory})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-0 focus:border-slate-900 outline-none transition-all"
                  >
                    <option value="Project_Reports">Project Reports</option>
                    <option value="Finance_Records">Finance Records</option>
                    <option value="Legal_NGO">Legal Papers</option>
                    <option value="Volunteer_Docs">Volunteer Docs</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Operation Link</label>
                  <select 
                    value={metadata.projectId}
                    onChange={e => setMetadata({...metadata, projectId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-0 focus:border-slate-900 outline-none transition-all"
                  >
                    <option value="">General (No Project)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contextual Metadata</label>
                <textarea 
                  required
                  placeholder="Describe the significance of this documentation..."
                  value={metadata.description}
                  onChange={e => setMetadata({...metadata, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-medium focus:ring-0 focus:border-slate-900 outline-none transition-all min-h-[80px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text"
                    placeholder="Geo-location"
                    value={metadata.location}
                    onChange={e => setMetadata({...metadata, location: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold focus:ring-0 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                {metadata.category === 'Legal_NGO' && (
                   <input 
                    type="date"
                    value={metadata.expiryDate}
                    onChange={e => setMetadata({...metadata, expiryDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-0 focus:border-slate-900 outline-none transition-all"
                  />
                )}
              </div>

              <button 
                type="submit"
                disabled={!file || uploading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Syncing to Vault...
                  </>
                ) : (
                  <>
                    <Hash size={16} />
                    Commit Archive
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
