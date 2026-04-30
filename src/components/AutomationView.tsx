import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Settings,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../App';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { sendEmail } from '../services/emailService';
import { cn } from '../lib/utils';

export default function AutomationView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    checkConnection();
    
    // Listen for automation logs
    const q = query(collection(db, 'automation_logs'), orderBy('timestamp', 'desc'), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    setStatus('checking');
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/health', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const serverHealth = await response.json();
      
      if (response.ok && serverHealth.resendConfigured) {
        setStatus('connected');
      } else {
        setStatus('error');
        if (!serverHealth.resendConfigured) {
          toast.error("RESEND_API_KEY is missing in Server Environment Variables");
        }
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || isSendingTest) return;
    setIsSendingTest(true);
    try {
      await sendEmail({
        requesterEmail: testEmail,
        amount: '1.00',
        status: 'SYSTEM_TEST',
        requesterName: 'Automation Core',
        message: 'System Pulse Normal. This is an automated test signal from your NGO Command Center.'
      });
      toast.success('Test Transmission Cleared');
      setTestEmail('');
    } catch (err: any) {
      toast.error(`Transmission Failed: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-10 text-left animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
            Workflow <span className="text-blue-600">Automata</span>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <Zap size={12} className="text-blue-600 animate-pulse" />
              <span className="text-[10px] font-black text-blue-600 tracking-widest">Active Core</span>
            </div>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">Managing autonomous mission triggers and communication flows.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 border border-slate-200 rounded-[2rem] shadow-sm">
           <div className={cn(
             "px-4 py-2 rounded-2xl flex items-center gap-2",
             status === 'connected' ? "bg-emerald-50 text-emerald-600" : 
             status === 'error' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
           )}>
             {status === 'checking' ? <RefreshCw size={14} className="animate-spin" /> : 
              status === 'connected' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
             <span className="text-[10px] font-black uppercase tracking-widest">
               {status === 'connected' ? 'Resend: Operational' : 
                status === 'error' ? 'Resend: Offline' : 'Verifying Link'}
             </span>
           </div>
           <button 
            onClick={checkConnection}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
           >
             <RefreshCw size={18} className={cn(isChecking && "animate-spin")} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                 <Mail size={80} />
               </div>
               <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Send size={14} className="text-blue-600" />
                 Signal Test
               </h4>
               <p className="text-xs text-slate-500 font-medium mb-6">Verify manual and automated mail dispatch functionality.</p>
               <div className="space-y-4">
                 <input 
                  type="email"
                  placeholder="Target Email Address..."
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                 />
                 <button 
                  onClick={handleSendTest}
                  disabled={!testEmail || isSendingTest}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                 >
                   Send Test Pulse
                 </button>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/20">
               <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Bell size={14} className="text-amber-500" />
                 Active Handlers
               </h4>
               <div className="space-y-3">
                 {[
                   { label: 'Expanse Approval', status: 'Enabled', icon: ShieldCheck, color: 'text-emerald-500' },
                   { label: 'Mission Assignment', status: 'Enabled', icon: ShieldCheck, color: 'text-emerald-500' },
                   { label: 'Work Log Verification', status: 'On Hold', icon: Clock, color: 'text-slate-400' },
                   { label: 'Milestone Alerts', status: 'Beta', icon: Zap, color: 'text-blue-400' }
                 ].map((handler, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-3">
                       <handler.icon size={16} className={handler.color} />
                       <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{handler.label}</span>
                     </div>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{handler.status}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/20">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Pulse History</h3>
            <div className="space-y-4">
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="flex items-center gap-6 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                    log.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {log.status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{log.action}</p>
                    <p className="text-[10px] font-medium text-slate-500 line-clamp-1 italic italic italic">"{log.details || 'Operational record sanitized'}"</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleTimeString() : 'Recent'}
                    </p>
                    <Badge className={log.status === 'success' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}>
                      {log.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <RefreshCw className="text-slate-200 animate-spin" size={40} />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting Initial Pulse Data...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar/Context */}
        <div className="space-y-8">
           <div className="bg-slate-900 p-8 rounded-[40px] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <Settings className="text-blue-500 mb-6" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4 leading-none">Automation Engine v5.0</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium mb-8">
                Autonomous protocols are strictly monitored by the Mission Core. Unauthorized logic bypasses will be flagged and purged.
              </p>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Identity Integrity Checks</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Financial Ledger Sync</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Resend Relay v3.1</span>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm text-left">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Critical Node Status</h3>
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                   <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">Authorization Relay</p>
                   <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">Direct connection established. Signal stability 99.8%.</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                   <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Latency Throttling</p>
                   <p className="text-[10px] text-amber-700 font-medium leading-relaxed">System observing high mission frequency. Batch processing enabled.</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", className)}>
    {children}
  </div>
);
