import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Mail, 
  ChevronDown, 
  Star, 
  Award,
  Calendar,
  History,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Donor, Donation } from '../types';
import { cn } from '../lib/utils';
import { exportDonorsToExcel } from '../lib/exportService';

interface DonorCRMProps {
  donors: Donor[];
  donations: Donation[];
}

const DonorCRM: React.FC<DonorCRMProps> = ({ donors, donations }) => {
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);

  const filtered = donors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase());
    const matchesTier = selectedTier === 'all' || d.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'Gold': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Silver': return 'text-slate-500 bg-slate-50 border-slate-100';
      case 'Bronze': return 'text-orange-700 bg-orange-50 border-orange-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Platinum': return <Award size={14} />;
      case 'Gold': return <Star size={14} />;
      default: return <Heart size={14} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Search & Global Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search donor neural net by name or email..."
              className="w-full bg-transparent border-b border-slate-200 rounded-none pl-12 pr-4 py-3.5 text-sm font-medium focus:border-blue-500 transition-all outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportDonorsToExcel(filtered)}
            className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} /> Export CRM Data
          </button>
          
          <div className="flex p-1 bg-transparent border-none rounded-2xl">
            {['all', 'Gold', 'Silver', 'Bronze'].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                  selectedTier === tier 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Donor List Area */}
        <div className="lg:col-span-12 xl:col-span-8 bg-transparent overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Donative Identity</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lifecycle Tier</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lifetime Alpha</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Frequency</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((donor) => (
                  <tr 
                    key={donor.id} 
                    onClick={() => setSelectedDonor(donor)}
                    className={cn(
                      "group hover:bg-slate-50 transition-all cursor-pointer",
                      selectedDonor?.id === donor.id && "bg-blue-50/50"
                    )}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">
                          {donor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 tracking-tight">{donor.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{donor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        getTierColor(donor.tier)
                      )}>
                        {getTierIcon(donor.tier)} {donor.tier}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-emerald-600 tracking-tighter">₹{donor.total_donated.toLocaleString()}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Gross Inflow</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                        {donor.frequency}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <button className="p-2 text-slate-400 group-hover:text-blue-600 transition-all group-hover:translate-x-1">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Donor Context Card */}
        <AnimatePresence mode="wait">
          {selectedDonor && (
            <motion.div 
              key={selectedDonor.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-12 xl:col-span-4 space-y-6"
            >
              <div className="bg-transparent p-0 overflow-hidden text-left">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-lg">
                    {selectedDonor.name[0]}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                      <Mail size={18} />
                    </button>
                    <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all border border-slate-100">
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedDonor.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Donor Lifecycle: {selectedDonor.tier} Member</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Engagement</p>
                    <p className="text-xs font-black text-slate-900 uppercase">1.2 Years</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Recurrence</p>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-emerald-500" />
                      <p className="text-xs font-black text-slate-900 uppercase">Steady</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <History size={14} className="text-blue-600" /> Transactional Origin
                  </h4>
                  <div className="space-y-3">
                    {donations.filter(don => don.donor_id === selectedDonor.id).slice(0, 3).map(don => (
                      <div key={don.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                        <div>
                          <p className="text-[10px] font-black text-slate-900">₹{don.amount.toLocaleString()}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">CAPTURED</p>
                        </div>
                        <p className="text-[8px] font-black text-slate-400 uppercase opacity-40">24.04.26</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline transition-all">
                    Access Historical Node Data
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[40px] shadow-xl shadow-blue-600/30 text-left relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-10">
                  <Heart size={150} className="text-white" />
                </div>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2 leading-none relative z-10">Impact Estimation</p>
                <h4 className="text-lg font-black text-white tracking-tight leading-tight mb-4 relative z-10">
                  This donor has enabled 12 mission-critical educational deployments.
                </h4>
                <div className="flex items-center gap-2 relative z-10">
                   <div className="px-3 py-1 bg-white/20 rounded-lg text-[9px] font-black text-white uppercase tracking-widest backdrop-blur-md">
                     High Utility
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DonorCRM;
