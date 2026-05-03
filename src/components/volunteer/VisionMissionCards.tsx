import React from 'react';
import { motion } from 'motion/react';
import { Target, Heart } from 'lucide-react';

export const VisionMissionCards = () => {
  const cards = [
    {
      title: "Our Vision",
      content: "Building communities that deserve better by fostering a kinder, more equitable world through persistent youth-led change.",
      icon: <Target className="text-mahogany" size={24} />,
      color: "bg-mahogany/5",
      border: "border-mahogany/10"
    },
    {
      title: "Our Mission",
      content: "Empowering individuals through focused programs in Education Excellence, Community Engagement, and Sustainable Health Support.",
      icon: <Heart className="text-terracotta" size={24} />,
      color: "bg-terracotta/5",
      border: "border-terracotta/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1 }}
          className={`${card.color} ${card.border} border p-8 rounded-[2.5rem] shadow-sm`}
        >
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
            {card.icon}
          </div>
          <h3 className="text-xl font-black text-mahogany uppercase italic tracking-tight mb-3">
            {card.title}
          </h3>
          <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
            "{card.content}"
          </p>
        </motion.div>
      ))}
    </div>
  );
};
