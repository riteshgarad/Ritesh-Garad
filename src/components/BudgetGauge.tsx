import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Project, Transaction } from '../types';
import { IndianRupee, Target } from 'lucide-react';

interface BudgetGaugeProps {
  projects: Project[];
  transactions: Transaction[];
}

export const BudgetGauge: React.FC<BudgetGaugeProps> = ({ projects, transactions }) => {
  const missionData = useMemo(() => {
    return projects.map(project => {
      const spent = transactions
        .filter(t => t.projectID === project.id && t.type === 'expense' && (t.status === 'approved' || t.status === 'cleared'))
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalBudget = project.budget || 100000; // Fallback
      const percentage = Math.min((spent / totalBudget) * 100, 100);
      
      return {
        name: project.name,
        spent,
        totalBudget,
        remaining: Math.max(totalBudget - spent, 0),
        percentage: percentage.toFixed(1),
        data: [
          { name: 'Spent', value: spent },
          { name: 'Remaining', value: Math.max(totalBudget - spent, 0) }
        ]
      };
    });
  }, [projects, transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {missionData.map((mission, idx) => (
        <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-[#4A1412] uppercase tracking-tight">{mission.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mission Deployment Allocation</p>
            </div>
            <div className="w-10 h-10 bg-[#FAF7F2] rounded-xl flex items-center justify-center text-[#A63A1B]">
              <Target size={20} />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mission.data}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#A63A1B" />
                    <Cell fill="#FAF7F2" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Status</p>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-[#4A1412]">{mission.percentage}%</span>
                  <span className="text-[10px] font-bold text-slate-400 pb-1 lowercase">utilized</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                  <span className="text-slate-400">Deployed</span>
                  <span className="text-[#4A1412]">₹{mission.spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                  <span className="text-slate-400">Reserve</span>
                  <span className="text-[#A63A1B]">₹{mission.remaining.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
