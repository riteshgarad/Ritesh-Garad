import React, { useState, useEffect, useMemo } from 'react';
import { 
  Megaphone, 
  Users, 
  FileText, 
  Globe, 
  Award, 
  Plus, 
  Mail, 
  Phone,
  Bookmark,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { db } from '../App';
import { AppUser, Project, Donor } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface PRDashboardProps {
  user: AppUser | null;
}

const PublicRelationsDashboard: React.FC<PRDashboardProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [activeTab, setActiveTab] = useState<'releases' | 'outreach' | 'metrics'>('releases');

  useEffect(() => {
    if (!user) return;

    const subProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'projects');
    });

    const subDonors = onSnapshot(
      query(collection(db, 'donors'), orderBy('total_donated', 'desc')), 
      (snapshot) => {
        setDonors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donor)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'donors')
    );

    return () => {
      subProjects();
      subDonors();
    };
  }, [user]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic uppercase text-left">
            Public <span className="text-purple-600">Relations</span>
            <span className="bg-purple-600 text-white text-[10px] not-italic px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black shadow-lg shadow-purple-200">
              Authority View
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2 text-left">
            <Megaphone size={14} className="text-purple-600" /> Building trust, managing reputation, and amplifying impact.
          </p>
        </div>
        
        <div className="flex p-1 bg-white border border-slate-200 rounded-3xl shadow-sm">
          {['releases', 'outreach', 'metrics'].map((tab) => (
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
              {tab === 'releases' ? 'Press Releases' : tab === 'outreach' ? 'Stakeholders' : 'Impact Branding'}
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
        >
          {activeTab === 'releases' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Media Kits: 12</p>
                 <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-200 transition-all hover:scale-105 active:scale-95">
                   <Plus size={14} /> Draft New Release
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[1, 2, 3].map((i) => (
                   <Card key={i} className="p-8 bg-white border-slate-200 text-left hover:border-purple-200 transition-colors cursor-pointer group">
                     <div className="flex justify-between items-start mb-4">
                        <Badge className="bg-purple-50 text-purple-600 border-none font-black text-[8px] uppercase tracking-widest">Official Statement</Badge>
                        <Bookmark size={16} className="text-slate-200 group-hover:text-purple-400 transition-colors" />
                     </div>
                     <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Expansion to Northern Regions: Project Alpha Launch</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Published 2 days ago • Media Outreach Pending</p>
                     <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex gap-2">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Globe size={14} /></div>
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><ExternalLink size={14} /></div>
                        </div>
                        <button className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                           View Full Kit <TrendingUp size={12} />
                        </button>
                     </div>
                   </Card>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'outreach' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm text-left">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Strategic Partnerships & CSR Leads</h3>
                    <div className="space-y-4">
                       {donors.filter(d => d.tier === 'Platinum' || d.tier === 'Gold').map((donor) => (
                         <div key={donor.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-purple-300/30 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                                  <Award size={20} className="text-amber-500" />
                               </div>
                               <div>
                                  <p className="text-xs font-black text-slate-900 uppercase mb-1">{donor.name}</p>
                                  <div className="flex items-center gap-3">
                                     <span className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase"><Mail size={10} /> Contacted</span>
                                     <span className="flex items-center gap-1 text-[8px] font-black text-purple-600 uppercase tracking-tighter"><Award size={10} /> {donor.tier} Partner</span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-2 bg-white rounded-lg text-slate-400 hover:text-purple-600 shadow-sm"><Mail size={14} /></button>
                               <button className="p-2 bg-white rounded-lg text-slate-400 hover:text-purple-600 shadow-sm"><Phone size={14} /></button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
               
               <div className="space-y-6 text-left">
                  <Card className="p-8 bg-slate-900 text-white rounded-[32px] border-none shadow-2xl">
                     <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-6 leading-none">Response Terminal</h4>
                     <p className="text-lg font-black tracking-tight mb-8">New media inquiry received from "The Daily Wire" regarding current rural missions.</p>
                     <div className="space-y-3">
                        <button className="w-full py-4 bg-purple-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-600/20">Acknowledge</button>
                        <button className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">ArchiveRequest</button>
                     </div>
                  </Card>
               </div>
            </div>
          )}

          {activeTab === 'metrics' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Impressions</p>
                   <h3 className="text-3xl font-black text-slate-900 italic">450k+</h3>
                   <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      <TrendingUp size={14} /> +15% Branding lift
                   </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Mentions</p>
                   <h3 className="text-3xl font-black text-slate-900 italic">120</h3>
                   <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      <TrendingUp size={14} /> +8% Sentimental gain
                   </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Trust Quotient</p>
                   <h3 className="text-3xl font-black text-slate-900 italic">9.4</h3>
                   <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Bookmark size={14} /> NGO Benchmark
                   </div>
                </div>
             </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PublicRelationsDashboard;
