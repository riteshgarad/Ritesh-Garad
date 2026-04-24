import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Heart, 
  Target, 
  Plus, 
  Filter, 
  Download, 
  Search,
  ChevronDown,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Megaphone,
  ArrowRight,
  ExternalLink,
  Image as ImageIcon,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { db, auth } from '../App';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  updateDoc, 
  doc, 
  addDoc, 
  serverTimestamp,
  increment,
  where
} from 'firebase/firestore';
import { Campaign, Donor, Donation, Transaction, Project, AppUser, NGODocument } from '../types';
import DonorCRM from './DonorCRM';
import CampaignManager from './CampaignManager';
import ImpactStories from './ImpactStories';

interface MarketingDashboardProps {
  user: AppUser | null;
}

const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'donors' | 'impact'>('overview');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [marketingMedia, setMarketingMedia] = useState<NGODocument[]>([]);

  useEffect(() => {
    if (!user) return;

    // Real-time subscriptions
    const subCampaigns = onSnapshot(
      query(collection(db, 'campaigns'), orderBy('created_at', 'desc')), 
      (snapshot) => {
        setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)));
      },
      (error) => console.error("Campaign listener error:", error)
    );

    const subMarketingMedia = onSnapshot(
      query(collection(db, 'documents'), where('category', '==', 'Marketing'), where('status', '==', 'verified')),
      (snapshot) => {
        setMarketingMedia(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NGODocument)));
      }
    );

    // Only Admin or Marketing Heads can see donor/donation details
    const canSeeDonorData = user.role === 'Admin' || user.role === 'Marketing Head';
    
    let subDonors = () => {};
    let subDonations = () => {};

    if (canSeeDonorData) {
      subDonors = onSnapshot(
        query(collection(db, 'donors'), orderBy('total_donated', 'desc')), 
        (snapshot) => {
          setDonors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donor)));
        },
        (error) => console.error("Donor listener error:", error)
      );

      subDonations = onSnapshot(
        query(collection(db, 'donations'), orderBy('timestamp', 'desc')), 
        (snapshot) => {
          setDonations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation)));
        },
        (error) => console.error("Donation listener error:", error)
      );
    }

    const subProjects = onSnapshot(
      collection(db, 'projects'), 
      (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      },
      (error) => console.error("Project listener error:", error)
    );

    return () => {
      subCampaigns();
      subDonors();
      subDonations();
      subProjects();
      subMarketingMedia();
    };
  }, [user]);

  const stats = useMemo(() => {
    const totalRaised = donors.reduce((sum, d) => sum + d.total_donated, 0);
    const goldDonors = donors.filter(d => d.tier === 'Gold' || d.tier === 'Platinum').length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const monthlyDonations = donations.filter(d => {
      const date = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
      return date.getMonth() === new Date().getMonth();
    }).reduce((sum, d) => sum + d.amount, 0);

    return { totalRaised, goldDonors, activeCampaigns, monthlyDonations };
  }, [donors, campaigns, donations]);

  const donationTrendData = useMemo(() => {
    // Simplified trend data for charts
    return [
      { name: 'Mon', amount: 4500 },
      { name: 'Tue', amount: 5200 },
      { name: 'Wed', amount: 4800 },
      { name: 'Thu', amount: 6100 },
      { name: 'Fri', amount: 5900 },
      { name: 'Sat', amount: 7200 },
      { name: 'Sun', amount: 6800 },
    ];
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic uppercase">
            Marketing <span className="text-blue-600">&</span> Donations
            <span className="bg-blue-600 text-white text-[10px] not-italic px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black shadow-lg shadow-blue-200">
              Nexus v2
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
            <Target size={14} className="text-blue-500" /> Connecting community generosity to project reality.
          </p>
        </div>
        
        <div className="flex p-1 bg-white border border-slate-200 rounded-3xl shadow-sm">
          {['overview', 'campaigns', 'donors', 'impact'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              label="Total Altruism" 
              value={`₹${(stats.totalRaised / 100000).toFixed(1)}L`} 
              subValue="+12% growth" 
              icon={Heart} 
              color="text-rose-500"
              bg="bg-rose-50"
            />
            <MetricCard 
              label="Active Missions" 
              value={stats.activeCampaigns} 
              subValue="Live campaigns" 
              icon={Megaphone} 
              color="text-blue-500"
              bg="bg-blue-50"
            />
            <MetricCard 
              label="High-Tier Donors" 
              value={stats.goldDonors} 
              subValue="Gold & Platinum" 
              icon={Users} 
              color="text-amber-500"
              bg="bg-amber-50"
            />
            <MetricCard 
              label="Monthly Velocity" 
              value={`₹${(stats.monthlyDonations / 1000).toFixed(1)}k`} 
              subValue="Current month" 
              icon={TrendingUp} 
              color="text-emerald-500"
              bg="bg-emerald-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm text-left">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Donation Velocity</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">7-Day Transactional Pulse</p>
                  </div>
                  <select className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                  </select>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={donationTrendData}>
                      <defs>
                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                        tickFormatter={(val) => `₹${val/1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '16px', 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontWeight: 900,
                          fontSize: '11px',
                          textTransform: 'uppercase'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#3b82f6" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorAmt)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity Mini-Feed */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm text-left">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  Live Contribution Feed
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                </h3>
                <div className="space-y-4">
                  {donations.slice(0, 5).map((donation) => {
                    const donor = donors.find(d => d.id === donation.donor_id);
                    return (
                      <div key={donation.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-500/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <Heart size={16} className="text-rose-500" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase">
                              {donation.donor_visibility === 'anonymous' ? 'Anonymous Donor' : donor?.name || 'Supporter'}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                              Contribution toward {campaigns.find(c => c.id === donation.campaign_id)?.title || 'Mission'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">+₹{donation.amount.toLocaleString()}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Captured</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Side - Impact Preview */}
            <div className="space-y-6">
              <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group min-h-[300px] flex flex-col justify-end">
                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:scale-125 transition-transform">
                  <Megaphone size={140} className="text-white" />
                </div>
                <div className="relative">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3 leading-none">Campaign Spotlight</p>
                  <h4 className="text-2xl font-black text-white tracking-tighter leading-tight mb-4">
                    Clean Water Initiative: Phase 2
                  </h4>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Deployment Status</p>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">78% Complete</p>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '78%' }}
                        className="h-full bg-blue-500" 
                      />
                    </div>
                  </div>
                  <button className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                    Inject Deployment Data <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm text-left">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex justify-between items-center">
                  Impact Assets
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] tracking-widest font-black uppercase">Verified Node</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {marketingMedia.length === 0 ? (
                    [1, 2, 3, 4].map(i => (
                      <div key={i} className="aspect-square bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
                    ))
                  ) : (
                    marketingMedia.slice(0, 4).map(doc => (
                      <div 
                        key={doc.id} 
                        onClick={() => window.open(doc.fileURL, '_blank')}
                        className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative group cursor-pointer border border-slate-200"
                      >
                        <img 
                          src={doc.fileURL} 
                          alt="Impact" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center">
                          <ImageIcon className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all" size={24} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-4 tracking-widest text-center">
                  {marketingMedia.length} Media Points Synchronized
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'donors' && <DonorCRM donors={donors} donations={donations} />}
      {activeTab === 'campaigns' && <CampaignManager campaigns={campaigns} user={user} />}
      {activeTab === 'impact' && <ImpactStories projects={projects} campaigns={campaigns} />}
    </div>
  );
};

const MetricCard = ({ label, value, subValue, icon: Icon, color, bg }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group text-left"
  >
    <div className={`p-4 ${bg} ${color} w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
    <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">{value}</h2>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subValue}</p>
  </motion.div>
);

export default MarketingDashboard;
