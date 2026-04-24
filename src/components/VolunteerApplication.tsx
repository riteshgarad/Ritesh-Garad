import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Star, Clock, Heart, FileText, Send, CheckCircle2, ChevronRight, Layout } from 'lucide-react';

interface VolunteerApplicationProps {
  onSubmit: (application: any) => Promise<void>;
  isLoading: boolean;
}

export const VolunteerApplicationForm = ({ onSubmit, isLoading }: VolunteerApplicationProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: [] as string[],
    availability: '',
    interests: '',
    idProofURL: 'https://placehold.co/600x400?text=ID+Proof' // Placeholder for now
  });

  const [submitted, setSubmitted] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');

  const availableSkills = ['Teaching', 'Marketing', 'First Aid', 'Social Media', 'Data Entry', 'Event Planning', 'Content Writing', 'Fundraising', 'Design'];

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl shadow-indigo-100 text-center"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-emerald-500" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Application Received</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Thank you for your interest! Our HR team will verify your details and get back to you within 48 hours.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-6 font-sans">
      <div className="max-w-4xl w-full">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider mb-4">
            <Star size={12} fill="currentColor" /> Join the Mission
          </div>
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">
            Volunteer <span className="text-indigo-600">Onboarding</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Become a part of our global impact. Complete the form to start your journey with Hope NGO.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-500" /> Process
              </h3>
              <ul className="space-y-4">
                {[
                  { title: 'Apply', desc: 'Fill your profile' },
                  { title: 'Verification', desc: 'HR reviews documents' },
                  { title: 'Assignment', desc: 'Matched with projects' }
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400">0{i+1}</div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{step.title}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-medium">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Form Area */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl shadow-indigo-50 border border-slate-100">
              <div className="space-y-10">
                {/* section: Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" 
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <input 
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" 
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* section: Skills */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Your Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.skills.includes(skill)
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* section: Insights */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weekly Availability</label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <textarea 
                        required
                        rows={2}
                        value={formData.availability}
                        onChange={e => setFormData({...formData, availability: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none resize-none" 
                        placeholder="e.g. Weekends, 4-6 hours"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Why do you want to join?</label>
                    <div className="relative group">
                      <Heart className="absolute left-4 top-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <textarea 
                        required
                        rows={3}
                        value={formData.interests}
                        onChange={e => setFormData({...formData, interests: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none resize-none" 
                        placeholder="Tell us about your motivation..."
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-6">
                  <button 
                    disabled={isLoading}
                    className="w-full py-5 bg-slate-900 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-200"
                  >
                    {isLoading ? 'Processing...' : (
                      <>Submit Application <ChevronRight size={18} /></>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
