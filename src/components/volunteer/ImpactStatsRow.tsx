import React from 'react';
import { motion } from 'motion/react';

export const ImpactStatsRow = () => {
  const stats = [
    { label: "Major Programmes", value: "6+", sub: "Social Impact Hub" },
    { label: "Active Volunteers", value: "230+", sub: "Guardian Network" },
    { label: "Students Reached", value: "2000+", sub: "Direct Lives Impacted" }
  ];

  return (
    <div className="bg-mahogany rounded-[3rem] p-10 shadow-2xl shadow-mahogany/20 mx-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="text-center space-y-2"
          >
            <div className="text-3xl font-black text-white italic tracking-tighter">
              {stat.value}
            </div>
            <div>
               <p className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em]">
                 {stat.label}
               </p>
               <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none">
                 {stat.sub}
               </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
