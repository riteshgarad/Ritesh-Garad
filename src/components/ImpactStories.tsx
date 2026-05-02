import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Image as ImageIcon, 
  Share2, 
  Heart, 
  Users, 
  Target,
  Megaphone,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { Project, Campaign } from '../types';
import { cn } from '../lib/utils';

interface ImpactStoriesProps {
  projects: Project[];
  campaigns: Campaign[];
}

const ImpactStories: React.FC<ImpactStoriesProps> = ({ projects, campaigns }) => {
  const completedProjects = projects.filter(p => p.status === 'completed');

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Narrative Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10 px-4 md:px-0">
        <div className="max-w-2xl text-left">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">
            Impact <span className="text-blue-600">Story</span> Forge
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
            Convert operational success into donor-ready narrative assets. 
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Deployment Yield</p>
            <p className="text-base font-black text-slate-900">{completedProjects.length} Success Signals</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left px-4 md:px-0">
        {completedProjects.map((project) => (
          <motion.div 
            whileHover={{ y: -4 }}
            key={project.id} 
            className="bg-transparent overflow-hidden flex flex-col group transition-all"
          >
            <div className="flex flex-col md:flex-row">
              {/* Visual Placeholder */}
              <div className="w-full md:w-1/3 aspect-[16/9] md:aspect-square bg-slate-100/50 rounded-3xl relative overflow-hidden flex items-center justify-center border border-slate-100 md:mr-6 shrink-0">
                <ImageIcon size={40} className="text-slate-300 group-hover:text-blue-200 transition-colors" />
                <div className="absolute top-4 left-4">
                  <span className="bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-lg shadow-emerald-500/20">
                    Completed
                  </span>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 py-6 md:py-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">
                    {project.tag}
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none italic">MISSION: {project.id}</p>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors mb-3">
                  {project.name}
                </h3>
                
                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 md:line-clamp-3 mb-6">
                  {project.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-slate-400" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Impacted</p>
                      <p className="text-xs font-black text-slate-900 leading-none">420+ Souls</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target size={16} className="text-slate-400" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Efficiency</p>
                      <p className="text-xs font-black text-slate-900 leading-none">High Alpha</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10">
                    <Megaphone size={14} /> Forge Story
                  </button>
                  <button className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {completedProjects.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] opacity-40">
            <Zap size={64} className="text-slate-300 mb-6" />
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-[0.2em] italic">No Completed Mission Loops</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.1em] mt-2">Ready to forge impact as projects clear final review.</p>
          </div>
        )}
      </div>

      {/* Global Asset Search */}
      <div className="bg-slate-900 p-10 rounded-[40px] text-left relative overflow-hidden shadow-2xl shadow-blue-900/20">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
          <Heart size={200} className="text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-4">Unified Impact Repository</h3>
          <p className="text-sm text-white/60 font-medium leading-relaxed mb-8">
            Access every verified asset, image, and data point from across the Garad Foundation ecosystem. 
            Direct integration with field operations ensures full narrative integrity.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all flex items-center gap-2">
              Access Strategic Assets <ArrowRight size={14} />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/20 transition-all backdrop-blur-md">
              Review Media Protocol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactStories;
