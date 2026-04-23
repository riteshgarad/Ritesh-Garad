import React, { useState, useEffect } from 'react';
import { Plus, Trash2, IndianRupee } from 'lucide-react';
import { BudgetItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface BudgetPlannerProps {
  items: BudgetItem[];
  onChange: (items: BudgetItem[]) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ items, onChange }) => {
  const addItem = () => {
    onChange([...items, { item: '', cost: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const updateItem = (index: number, field: keyof BudgetItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'cost' ? Number(value) : value
    };
    onChange(newItems);
  };

  const total = items.reduce((acc, curr) => acc + Number(curr.cost), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Itemized Budget Planner</label>
        <button 
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
        >
          <Plus size={12} /> Add Line Item
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 group"
            >
              <div className="flex-1">
                <input 
                  required
                  placeholder="e.g. Food & Logistics"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={item.item}
                  onChange={e => updateItem(index, 'item', e.target.value)}
                />
              </div>
              <div className="w-32 relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input 
                  required
                  type="number"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={item.cost || ''}
                  onChange={e => updateItem(index, 'cost', e.target.value)}
                />
              </div>
              <button 
                type="button"
                onClick={() => removeItem(index)}
                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl border border-transparent hover:border-red-100"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No budget lines defined.</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between p-4 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50">
        <div className="text-left">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Fiscal Clearance Required</p>
          <p className="text-xs font-black text-white uppercase tracking-tight">Total Projected CapEx</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-black text-white tracking-tighter">₹{total.toLocaleString()}</h2>
        </div>
      </div>
    </div>
  );
};
