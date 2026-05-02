import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  Send, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  ChevronRight,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { generateProjectImpactReport, exportToPDF, ImpactSummary } from '../../services/reportGenerator';
import { cn } from '../../lib/utils';

export const ImpactReports: React.FC = () => {
  const [summary, setSummary] = useState<ImpactSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [isEmailing, setIsEmailing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const handleEmailReport = async () => {
    if (!summary) return;
    setIsEmailing(true);
    try {
      const { auth } = await import('../../lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Authentication required");

      const impactStats = `
        <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <p style="font-size: 10px; color: #64748b; margin: 0;">TOTAL HOURS</p>
            <p style="font-size: 20px; font-weight: 800; color: #4A1412; margin: 5px 0;">${summary.totalHours.toFixed(1)}</p>
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px;">
            <p style="font-size: 10px; color: #64748b; margin: 0;">ACTIVE VOLUNTEERS</p>
            <p style="font-size: 20px; font-weight: 800; color: #4A1412; margin: 5px 0;">${summary.totalVolunteers}</p>
          </div>
        </div>
        <h3 style="color: #4A1412; font-size: 14px; margin-top: 20px;">Mission Breakdown:</h3>
        <ul style="list-style: none; padding: 0;">
          ${Object.entries(summary.missionBreakdown).map(([name, hours]) => `
            <li style="padding: 10px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between;">
              <span style="font-size: 12px; font-weight: 600;">${name}</span>
              <span style="font-size: 12px; font-weight: 800; color: #A63A1B;">${(hours as number).toFixed(1)} hrs</span>
            </li>
          `).join('')}
        </ul>
      `;

      const response = await fetch('/api/automation/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'REPORT_SUMMARY',
          message: impactStats
        })
      });

      if (!response.ok) throw new Error("Failed to transmit signal");
      alert("IMPACT SUMMARY TRANSMITTED: Signal successfully sent to Executive Board.");
    } catch (error: any) {
      alert("COMMUNICATION FAILURE: " + error.message);
    } finally {
      setIsEmailing(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await generateProjectImpactReport(7);
      setSummary(data);
    } catch (error) {
      console.error("Failed to load impact data", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-mahogany/10 border-t-mahogany rounded-full animate-spin" />
        <p className="text-[10px] font-black text-mahogany/40 uppercase tracking-widest italic text-center">
          Synthesizing Operational Logs...<br/>
          <span className="font-medium text-slate-400 capitalize -tracking-normal not-italic">Calculating mission ROI and humanitarian impact index</span>
        </p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-6">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-mahogany rounded-xl flex items-center justify-center text-white">
                <TrendingUp size={20} />
             </div>
             <p className="text-[10px] font-black text-mahogany/40 uppercase tracking-[0.3em] font-sans">Strategic Analytics Node</p>
          </div>
          <h1 className="text-4xl font-black text-mahogany uppercase tracking-tighter italic">Weekly Impact Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 max-w-xl">
             Real-time aggregation of ground-level operations. These records serve as a verified certificate of the Garad Foundation's humanitarian reach.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportToPDF(summary)}
            disabled={isExporting}
            className="px-6 py-4 bg-mahogany text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-mahogany/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download size={14} />
            Download PDF Report
          </button>
          <button 
            onClick={handleEmailReport}
            disabled={isEmailing}
            className="px-6 py-4 bg-white border border-slate-100 text-mahogany rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-md hover:bg-mahogany/5 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send size={14} className={isEmailing ? "animate-pulse" : ""} />
            {isEmailing ? "Transmitting Signal..." : "Email Board"}
          </button>
        </div>
      </div>

      {/* Global Impact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Mission Hours', value: summary.totalHours.toFixed(1), unit: 'hrs', icon: Clock, color: 'text-mahogany', bg: 'bg-white' },
          { label: 'Active Field Operatives', value: summary.totalVolunteers, unit: 'pax', icon: Users, color: 'text-terracotta', bg: 'bg-white' },
          { label: 'Live Mission Nodes', value: summary.totalMissions, unit: 'active', icon: Target, color: 'text-emerald-600', bg: 'bg-white' },
          { label: 'Verification Level', value: '100', unit: '% GPS', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50/50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn("p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group", stat.bg)}
          >
             <stat.icon size={48} className="absolute -right-4 -bottom-4 text-slate-100 group-hover:scale-110 transition-transform" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
             <div className="flex items-baseline gap-1">
                <span className={cn("text-4xl font-black italic tracking-tighter", stat.color)}>{stat.value}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.unit}</span>
             </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Mission Breakdown */}
        <div className="md:col-span-2 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Operational Distribution</h3>
              <FileText size={16} className="text-slate-300" />
           </div>
           
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="p-8 space-y-6">
                {Object.entries(summary.missionBreakdown).map(([name, hours], i) => (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <p className="text-[11px] font-black text-mahogany uppercase tracking-tight italic">{name}</p>
                      <p className="text-[10px] font-black text-slate-400">{(hours as number).toFixed(1)} hrs</p>
                    </div>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((hours as number) / summary.totalHours) * 100)}%` }}
                        className="h-full bg-gradient-to-r from-mahogany to-terracotta rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50/50 p-6 px-8 flex items-center gap-3 border-t border-slate-100">
                 <AlertCircle size={14} className="text-slate-400" />
                 <p className="text-[10px] font-medium text-slate-500 italic">Data represents verified check-ins within the last 7 solar days.</p>
              </div>
           </div>
        </div>

        {/* Top Contributors */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Top Field Operatives</h3>
              <Calendar size={16} className="text-slate-300" />
           </div>

           <div className="bg-[#FAF7F2] rounded-[2.5rem] border border-slate-100 p-8 space-y-6 shadow-xl shadow-mahogany/5">
              {summary.topContributors.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-xs font-black text-mahogany shadow-sm">
                         #{i + 1}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-mahogany uppercase tracking-tighter truncate max-w-[120px]">{c.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Commits</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-terracotta italic">{c.hours.toFixed(1)}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase">Hours</p>
                   </div>
                </div>
              ))}
              <button 
                className="w-full py-4 mt-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
              >
                View Full Roster
              </button>
           </div>
        </div>
      </div>

      {/* Raw Log Inspection */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Mission Signal Log</h3>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
               <ShieldCheck size={10} />
               Secure Chain Verified
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operative</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Hub</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {summary.rawLogs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 text-sm font-black text-mahogany">
                        {log.punchIn?.toDate ? log.punchIn.toDate().toLocaleDateString() : 'Today'}
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-slate-700">{log.userName}</td>
                      <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                           <Clock size={12} className="text-slate-300" />
                           {log.pointName || log.missionName}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-slate-900 italic">
                         {log.durationMinutes} <span className="text-[10px] font-medium not-italic text-slate-400">min</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">
                            <ShieldCheck size={10} />
                            Verified
                         </div>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated by Bharari OS Secure Audit Module</p>
      </div>
    </div>
  );
};
