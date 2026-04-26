import React, { useState, useEffect, useMemo } from 'react';
import { 
  Share2, 
  Camera, 
  Instagram, 
  Twitter, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Image as ImageIcon,
  MoreVertical,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../App';
import { NGODocument, Project, Campaign, AppUser } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface SocialMediaDashboardProps {
  user: AppUser | null;
}

const SocialMediaDashboard: React.FC<SocialMediaDashboardProps> = ({ user }) => {
  const [pendingDocs, setPendingDocs] = useState<NGODocument[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'campaigns' | 'missions'>('queue');

  useEffect(() => {
    if (!user) return;

    // Load documentation photos/videos for content queue
    const subDocs = onSnapshot(
      query(collection(db, 'documents'), where('status', '==', 'verified'), orderBy('metadata.uploadedAt', 'desc')),
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NGODocument));
        // Filter for images/videos in code ideally, or use categories
        setPendingDocs(docs.filter(d => d.category === 'Mission_Report' || d.category === 'Marketing'));
      }
    );

    const subCampaigns = onSnapshot(
      query(collection(db, 'campaigns'), where('status', '==', 'active')),
      (snapshot) => {
        setActiveCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)));
      }
    );

    const subProjects = onSnapshot(
      collection(db, 'projects'),
      (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      }
    );

    return () => {
      subDocs();
      subCampaigns();
      subProjects();
    };
  }, [user]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic uppercase">
            Social <span className="text-pink-500">Media</span>
            <span className="bg-pink-500 text-white text-[10px] not-italic px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black shadow-lg shadow-pink-200">
              Content Hub
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2 text-left">
            <Camera size={14} className="text-pink-500" /> Shaping the narrative and engaging the digital community.
          </p>
        </div>
        
        <div className="flex p-1 bg-white border border-slate-200 rounded-3xl shadow-sm">
          {['queue', 'campaigns', 'missions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {tab === 'queue' ? 'Content Queue' : tab === 'campaigns' ? 'Live Campaigns' : 'Project Coverage'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'queue' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pendingDocs.map((doc) => (
                <Card key={doc.id} className="overflow-hidden bg-white border-slate-200 group text-left">
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    <img 
                      src={doc.fileURL} 
                      alt={doc.fileName} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2">
                       <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 border-none font-black text-[8px] uppercase tracking-widest">
                         {doc.projectName}
                       </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source: {doc.uploadedBy}</p>
                    <h3 className="text-sm font-black text-slate-900 mb-4 line-clamp-1">{doc.description || doc.fileName}</h3>
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 bg-pink-50 text-pink-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-pink-100 transition-colors flex items-center justify-center gap-2">
                        <Instagram size={12} /> Post to IG
                      </button>
                      <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 transition-colors">
                         <Send size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
              {pendingDocs.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                  <Camera size={40} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Zero Content Artifacts Synchronized</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {activeCampaigns.map((campaign) => (
                 <Card key={campaign.id} className="p-8 bg-white border-slate-200 text-left">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                        <Badge className="bg-pink-100 text-pink-600 mb-2 border-none">Active Campaign</Badge>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{campaign.title}</h3>
                      </div>
                      <TrendingUp className="text-pink-500" size={24} />
                   </div>
                   
                   <p className="text-xs font-medium text-slate-500 mb-8">{campaign.description}</p>

                   <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Reach</p>
                           <p className="text-lg font-black text-slate-900">12.5k</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Engagement</p>
                           <p className="text-lg font-black text-slate-900">8.2%</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Shares</p>
                           <p className="text-lg font-black text-slate-900">450</p>
                        </div>
                      </div>
                   </div>
                 </Card>
               ))}
            </div>
          )}

          {activeTab === 'missions' && (
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm text-left">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Ongoing Mission Coverage Req</h3>
                 <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                              <Share2 size={16} className="text-pink-500" />
                           </div>
                           <div>
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{project.name}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Phase {project.phase} Deployment</p>
                           </div>
                        </div>
                        <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                           Assign Media Team
                        </button>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SocialMediaDashboard;
