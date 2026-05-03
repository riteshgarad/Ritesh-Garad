import React from 'react';
import { motion } from 'motion/react';
import { LifeBuoy, MessageSquare, Phone, Mail, ChevronRight } from 'lucide-react';

export const SupportView = () => {
  return (
    <div className="max-w-xl mx-auto space-y-8 py-10">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-[#A63A1B]/10 rounded-[2.5rem] flex items-center justify-center text-[#A63A1B] mx-auto mb-6 shadow-xl shadow-[#A63A1B]/5">
          <LifeBuoy size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-black text-mahogany uppercase italic tracking-tighter">Mission Support</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
          Need tactical assistance? Our support infrastructure <br /> is active 24/7 for our personnel.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { label: 'Signal Comms (WhatsApp)', value: 'Contact Admin Group', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Voice Intel (Direct Call)', value: '+91 91580 00100', icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Documentary Support (Email)', value: 'info@garadfoundation.org', icon: Mail, color: 'text-terracotta', bg: 'bg-terracotta/5' }
        ].map((method, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className={`w-14 h-14 ${method.bg} ${method.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              <method.icon size={24} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{method.label}</p>
              <p className="text-sm font-black text-mahogany uppercase italic">{method.value}</p>
            </div>
            <ChevronRight size={18} className="text-slate-200 group-hover:text-terracotta transition-colors" />
          </motion.button>
        ))}
      </div>

      <div className="bg-cream p-10 rounded-[3rem] border border-terracotta/10 text-center">
         <p className="text-[11px] font-bold text-mahogany/40 uppercase tracking-widest leading-relaxed">
           "Your dedication is our foundation. <br /> We never leave a volunteer behind."
         </p>
      </div>
    </div>
  );
};
