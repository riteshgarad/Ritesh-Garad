import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Mail, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { secondaryAuth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export const BatchOnboarding = () => {
  const [emailsText, setEmailsText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ email: string; status: 'pending' | 'success' | 'error'; message?: string }[]>([]);
  const [progress, setProgress] = useState(0);

  const defaultPassword = 'Bharari@2025';

  const processOnboarding = async () => {
    const emailList = emailsText
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.includes('@'));

    if (emailList.length === 0) {
      toast.error("Enter at least one valid email");
      return;
    }

    setIsProcessing(true);
    const initialResults = emailList.map(email => ({ email, status: 'pending' as const }));
    setResults(initialResults);
    setProgress(0);

    for (let i = 0; i < emailList.length; i++) {
        const email = emailList[i];
        try {
            // 1. Create Auth Account using secondary auth to prevent current user logout
            const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, defaultPassword);
            const uid = userCred.user.uid;

            // 2. Create Firestore Profile
            await setDoc(doc(db, 'users', uid), {
                uid,
                email,
                name: email.split('@')[0], // Template name
                role: 'new_volunteer',
                department: 'General',
                isActive: true,
                createdAt: serverTimestamp(),
                mustChangePassword: true 
            });

            // 3. Significance of secondaryAuth: we must sign out the secondary app immediately 
            // so we can create the next user in the loop
            await signOut(secondaryAuth);

            setResults(prev => prev.map(r => r.email === email ? { ...r, status: 'success' } : r));
        } catch (error: any) {
            console.error(`Error onboarding ${email}:`, error);
            setResults(prev => prev.map(r => r.email === email ? { ...r, status: 'error', message: error.message } : r));
        }
        setProgress(((i + 1) / emailList.length) * 100);
    }

    setIsProcessing(false);
    toast.success("Batch Processing Complete");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-10 items-center">
        <div className="w-24 h-24 bg-terracotta/10 rounded-[2.5rem] flex items-center justify-center text-terracotta shrink-0 shadow-lg shadow-terracotta/5">
          <Zap size={40} className="fill-current" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-3xl font-black text-mahogany uppercase italic tracking-tighter">Batch Onboarding Terminal</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-md">
            Rapid deployment protocol for new volunteer units. Accounts will be initialized with role: <span className="text-terracotta">new_volunteer</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Card */}
        <div className={cn(
            "bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 space-y-6 transition-all",
            isProcessing && "opacity-50 pointer-events-none grayscale"
        )}>
          <div className="flex items-center gap-3 px-2">
            <Mail className="text-slate-300" size={18} />
            <h3 className="text-xs font-black text-mahogany uppercase tracking-widest italic">Email Manifest</h3>
          </div>
          <textarea
            className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-terracotta/5 focus:border-terracotta outline-none transition-all resize-none min-h-[300px]"
            placeholder="Paste emails here (one per line)&#10;ameygarad04@gmail.com&#10;gauravgarad1998@gmail.com..."
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
          />
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-700">
             <AlertCircle size={18} className="shrink-0" />
             <p className="text-[10px] font-bold uppercase tracking-wide leading-tight">
               Default Password: <span className="font-black underline">{defaultPassword}</span>. Users will be prompted to change this on first mission.
             </p>
          </div>
          <button
            onClick={processOnboarding}
            disabled={isProcessing || !emailsText.trim()}
            className="w-full py-5 bg-terracotta text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl shadow-terracotta/20 hover:bg-mahogany active:scale-95 disabled:opacity-50 transition-all"
          >
            <ShieldCheck size={20} />
            Initialize Batch Creation
          </button>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 space-y-6 flex flex-col">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
              <Users className="text-slate-300" size={18} />
              <h3 className="text-xs font-black text-mahogany uppercase tracking-widest italic">Deployment Status</h3>
            </div>
            {isProcessing && (
              <span className="text-[10px] font-black text-terracotta animate-pulse uppercase tracking-[0.2em]">Executing...</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-3 no-scrollbar">
            {results.length > 0 ? (
               results.map((res, i) => (
                 <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={res.email} 
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                 >
                   <div className="flex items-center gap-3 truncate">
                     <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        res.status === 'success' ? "bg-emerald-100 text-emerald-600" : 
                        res.status === 'error' ? "bg-rose-100 text-rose-600" :
                        "bg-slate-100 text-slate-400 rotate-spin"
                     )}>
                       {res.status === 'success' ? <CheckCircle2 size={16} /> : 
                        res.status === 'error' ? <AlertCircle size={16} /> :
                        <Loader2 size={16} className="animate-spin" />}
                     </div>
                     <span className="text-xs font-bold text-mahogany truncate">{res.email}</span>
                   </div>
                   {res.message && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest ml-2 truncate max-w-[80px]">{res.message}</span>}
                 </motion.div>
               ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-30 py-20 italic">
                <Users size={48} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Data Input</p>
              </div>
            )}
          </div>

          {isProcessing && (
             <div className="space-y-2">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-terracotta" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">
                  Progress: {Math.round(progress)}%
                </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
