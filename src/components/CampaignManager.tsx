import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Megaphone,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../App';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { Campaign, AppUser, CampaignStatus } from '../types';
import { cn } from '../lib/utils';

interface CampaignManagerProps {
  campaigns: Campaign[];
  user: AppUser | null;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ campaigns, user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = campaigns.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAction = async (campaignId: string, nextStatus: CampaignStatus, reason?: string) => {
    try {
      const data: any = { 
        status: nextStatus,
        updated_at: serverTimestamp()
      };
      if (reason) data.rejection_reason = reason;
      
      await updateDoc(doc(db, 'campaigns', campaignId), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `campaigns/${campaignId}`);
    }
  };

  const isMarketingHead = user?.role === 'Marketing Head';
  const isAdmin = user?.role === 'Admin';
  const isVolunteer = user?.role === 'Volunteer' || user?.department === 'Marketing & Donations';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search campaigns..."
            className="w-full bg-transparent border-b border-slate-200 rounded-none pl-12 pr-4 py-3 text-sm font-medium focus:border-blue-500 transition-all outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Stages</option>
            <option value="draft">Drafts</option>
            <option value="pending_head">Awaiting Head Review</option>
            <option value="pending_admin">Awaiting Admin Final</option>
            <option value="active">Live Now</option>
            <option value="completed">Archive</option>
          </select>
          
          {isVolunteer && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
            >
              <Plus size={14} /> Design Campaign
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filtered.map((campaign) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={campaign.id}
              className="bg-transparent overflow-hidden flex flex-col group transition-all text-left"
            >
              {/* Card Header & Status */}
              <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border",
                    campaign.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    campaign.status === 'draft' ? "bg-slate-50 text-slate-500 border-slate-100" :
                    "bg-blue-50 text-blue-600 border-blue-100"
                  )}>
                    {campaign.status.replace('_', ' ')}
                  </span>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                  {campaign.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-2">
                  {campaign.description}
                </p>
              </div>

              {/* Progress Tracker */}
              <div className="px-8 py-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Raised: ₹{campaign.current_raised.toLocaleString()}</span>
                    <span className="text-blue-600">{Math.round((campaign.current_raised / campaign.goal_amount) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((campaign.current_raised / campaign.goal_amount) * 100, 100)}%` }}
                      className="h-full bg-blue-600"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 pt-1">
                    <span>Target: ₹{campaign.goal_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Zone */}
              <div className="mt-auto p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                {/* Volunteer -> Head */}
                {campaign.status === 'draft' && isVolunteer && (
                  <button 
                    onClick={() => handleAction(campaign.id, 'pending_head')}
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    Send for Review <ArrowRight size={14} />
                  </button>
                )}

                {/* Head -> Admin */}
                {campaign.status === 'pending_head' && isMarketingHead && (
                  <>
                    <button 
                      onClick={() => handleAction(campaign.id, 'pending_admin')}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={14} /> Recommend
                    </button>
                    <button 
                      onClick={() => handleAction(campaign.id, 'draft', 'Creative revision requested')}
                      className="p-3 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 transition-all"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                )}

                {/* Admin -> Active */}
                {campaign.status === 'pending_admin' && isAdmin && (
                  <>
                    <button 
                      onClick={() => handleAction(campaign.id, 'active')}
                      className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Megaphone size={14} /> Set Live
                    </button>
                    <button 
                      onClick={() => handleAction(campaign.id, 'draft', 'Budgetary constraints')}
                      className="p-3 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 transition-all"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                )}

                {/* Active Status Info */}
                {campaign.status === 'active' && (
                  <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={14} /> Campaign is Live
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isModalOpen && (
        <CampaignForm 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          user={user} 
        />
      )}
    </div>
  );
};

const CampaignForm = ({ isOpen, onClose, user }: any) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    category: 'Education'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'campaigns'), {
        ...formData,
        goal_amount: parseFloat(formData.goal_amount) || 0,
        current_raised: 0,
        status: 'draft',
        created_at: serverTimestamp(),
        created_by: auth.currentUser?.uid || '',
        media_urls: [],
      });
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'campaigns');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 italic uppercase">Draft Campaign</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Marketing Creative Brief</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Moniker</label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g., Global Health Summit 2026"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Narrative Context</label>
            <textarea 
              required
              rows={3}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Draft the impact story here..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Funding Alpha Target (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  required
                  type="number"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="500000"
                  value={formData.goal_amount}
                  onChange={e => setFormData({ ...formData, goal_amount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector Category</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium outline-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option>Education</option>
                <option>Health</option>
                <option>Environment</option>
                <option>Disaster Relief</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
            <AlertCircle size={20} className="text-blue-600 mt-1" />
            <div>
              <p className="text-[10px] font-black text-blue-900 uppercase">Approval Protocol</p>
              <p className="text-[10px] font-medium text-blue-700 leading-relaxed mt-1 italic">
                Your draft will undergo multi-stage review. Ensure media assets are attached to increase approval probability.
              </p>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
            >
              Discard
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
            >
              Initialize Campaign
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CampaignManager;
