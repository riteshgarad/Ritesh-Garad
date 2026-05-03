import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Lightbulb, 
  BookOpen, 
  Users, 
  Shield, 
  ArrowRight,
  Info,
  Maximize2
} from 'lucide-react';
import { VisionMissionCards } from './VisionMissionCards';
import { ImpactStatsRow } from './ImpactStatsRow';
import { cn } from '../../lib/utils';

export const VolunteerHomeHub = ({ onNavigate }: { onNavigate: (page: any) => void }) => {
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  const milestones = [
    { url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800", title: "Mission Bharari" },
    { url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800", title: "Shikshanchi Gudhi" },
    { url: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=800", title: "Abhivyakta" },
    { url: "https://images.unsplash.com/photo-1454165833767-027ffea9e41b?q=80&w=800", title: "Garad Granthalay" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] pb-32">
      {/* A. Hero Branding Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[450px] lg:h-[600px] w-full overflow-hidden"
      >
        <img 
          src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=2000" 
          className="absolute inset-0 w-full h-full object-cover"
          alt="Mission"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-mahogany/80 via-mahogany/40 to-[#FAF7F2]" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 flex items-center justify-center p-4">
               <Shield className="text-white fill-current animate-pulse" size={48} />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white text-4xl lg:text-6xl font-black uppercase italic tracking-tighter leading-none mb-4"
          >
            The Garad Foundation
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-terracotta text-lg lg:text-2xl font-black uppercase tracking-[0.4em] italic drop-shadow-lg mb-2"
          >
            Garv Manusakicha (गौरव माणुसकीचा)
          </motion.p>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] italic"
          >
            Trying to Make the World a Kinder Place
          </motion.p>
        </div>
      </motion.div>

      {/* B. Vision & Mission */}
      <div className="relative -mt-16 z-10 space-y-12">
        <VisionMissionCards />
        
        {/* C. Our Story Section */}
        <section className="px-6 space-y-8">
           <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-50 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta/5 rounded-full -mr-16 -mt-16 blur-2xl" />
             
             <div className="flex items-center gap-4 mb-6">
               <div className="w-10 h-10 bg-mahogany rounded-xl flex items-center justify-center text-white">
                 <BookOpen size={18} />
               </div>
               <h2 className="text-xs font-black text-mahogany uppercase tracking-[0.3em] italic">About Garad</h2>
             </div>

             <div className={cn(
               "text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-wide transition-all duration-700 overflow-hidden",
               !isAboutExpanded ? "max-h-[120px]" : "max-h-[1500px]"
             )}>
               Garad Foundation is a registered youth organisation, committed to communities that deserve better. 
               What started as a small idea in Thane has grown into a movement touching thousands of lives. 
               We are a group of young people with a shared purpose: to empower through Education Excellence, Community Engagement, and Social Awareness. 
               From tribal villages in Palghar to urban schools, we have bridged the gap for 2000+ students with the support of 230+ dedicated volunteers. 
               Our work is built on four pillars: Integrity, Innovation, Empowerment, and Sustainability. 
               Through programs like Mission Bharari (Educational Kits) and Abhivyakta (Student Expression), we continue the "Glory of Humanity."
             </div>
             
             <button 
               onClick={() => setIsAboutExpanded(!isAboutExpanded)}
               className="mt-6 flex items-center gap-2 text-[10px] font-black text-terracotta uppercase tracking-[0.2em] hover:text-mahogany transition-colors"
             >
               {isAboutExpanded ? "Close Archive" : "Read Full Narrative"} 
               <ChevronRight size={14} className={cn("transition-transform", isAboutExpanded && "rotate-90")} />
             </button>

             {/* Horizontal Scroll Gallery */}
             <div className="mt-10 flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                {milestones.map((img, i) => (
                  <div key={i} className="min-w-[280px] h-48 rounded-[2rem] overflow-hidden relative group">
                    <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={img.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-mahogany/80 to-transparent" />
                    <div className="absolute bottom-6 left-6">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest italic">{img.title}</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </section>

        {/* D. Impact Stats */}
        <ImpactStatsRow />

        {/* E. Engagement: Idea Hub CTA */}
        <div className="px-6">
          <motion.button
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('ideas')}
            className="w-full bg-white rounded-[3rem] p-10 border-2 border-dashed border-terracotta/20 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-terracotta transition-all"
          >
            <div className="flex items-center gap-8 text-center md:text-left">
              <div className="w-20 h-20 bg-terracotta rounded-full flex items-center justify-center text-white shadow-xl shadow-terracotta/20 shrink-0 group-hover:rotate-12 transition-transform">
                <Lightbulb size={36} className="fill-current" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-mahogany uppercase italic tracking-tighter leading-tight">Your Voice Matters</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Share your innovative ideas to improve our society</p>
              </div>
            </div>
            
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-mahogany group-hover:bg-mahogany group-hover:text-white transition-all">
              <ArrowRight size={24} />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
