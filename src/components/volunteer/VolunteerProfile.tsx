import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Settings, 
  Camera, 
  ChevronRight, 
  Heart, 
  Download, 
  Globe, 
  MapPin, 
  CreditCard, 
  Trash2, 
  History, 
  LogOut,
  X,
  Check,
  User,
  Mail,
  Phone,
  AtSign,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppUser } from '../../types';
import { auth, db, storage } from '../../lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface ProfileProps {
  user: AppUser | null;
  onBack: () => void;
}

export const VolunteerProfile: React.FC<ProfileProps> = ({ user, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: '',
    phone: '',
    department: user?.department || '',
  });
  
  const [profileData, setProfileData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfileData(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          username: data.username || '',
          phone: data.phone || '',
          department: data.department || '',
        });
      }
    });
    return () => unsub();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: url
      });
      toast.success('Profile image updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date()
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const MenuItem = ({ icon: Icon, label, onClick, danger }: any) => (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 hover:bg-white transition-all group",
        danger ? "text-red-500 border-red-50" : "text-slate-600"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
          danger ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400 group-hover:bg-mahogany group-hover:text-white"
        )}>
          <Icon size={18} />
        </div>
        <span className="text-sm font-bold uppercase tracking-widest italic">{label}</span>
      </div>
      <ChevronRight size={16} className={cn(danger ? "text-red-300" : "text-slate-300")} />
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] pb-32">
      {/* Header */}
      <header className="shrink-0 pt-[calc(env(safe-area-inset-top,24px)+24px)] pb-6 px-6 flex items-center justify-between z-40 bg-white/50 backdrop-blur-md border-b border-white">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-mahogany transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.3em] italic text-mahogany">
          {isEditing ? 'Editing Profile' : 'My Identity'}
        </h1>
        <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-mahogany transition-colors">
          <Settings size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pt-8 px-6 space-y-8">
        {/* Profile Identity Card */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl shadow-mahogany/10 ring-1 ring-slate-100 overflow-hidden">
              {profileData?.profileImage ? (
                <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover rounded-[2rem]" />
              ) : (
                <div className="w-full h-full bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300">
                  <User size={48} />
                </div>
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 bg-mahogany text-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-white translate-x-1/4 translate-y-1/4 hover:scale-110 active:scale-95 transition-all z-10"
            >
              <Camera size={18} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-mahogany">
              {profileData?.name || user?.name}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <Shield size={10} className="text-terracotta fill-current" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                @{profileData?.username || 'guardian_operative'} • {profileData?.department || 'Mission Frontline'}
              </p>
            </div>
          </div>

          {!isEditing && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="px-8 py-3 bg-terracotta text-white rounded-2xl shadow-xl shadow-terracotta/20 text-[10px] font-black uppercase tracking-[0.2em] italic"
            >
              Configure Identity
            </motion.button>
          )}
        </div>

        {/* Impact Summary Strip */}
        {!isEditing && (
          <div className="grid grid-cols-3 gap-4 bg-white/50 backdrop-blur-sm rounded-[2rem] p-4 border border-white">
            <div className="text-center space-y-1">
              <p className="text-lg font-black text-mahogany italic tabular-nums leading-none">{profileData?.hours || 0}</p>
              <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Service</p>
            </div>
            <div className="text-center space-y-1 border-x border-slate-100">
              <p className="text-lg font-black text-mahogany italic tabular-nums leading-none">{profileData?.impactPoints || 0}</p>
              <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Impact</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-black text-mahogany italic tabular-nums leading-none">{profileData?.badges?.length || 0}</p>
              <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Awards</p>
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div 
              key="editing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 space-y-6"
            >
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Guardian Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-mahogany uppercase outline-none focus:ring-2 ring-terracotta/10 transition-all font-mono"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Email Terminal (Protected)</label>
                  <div className="relative opacity-50">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="email" 
                      value={formData.email}
                      disabled
                      className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-mahogany uppercase outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Unique Alias (Handle)</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-mahogany uppercase outline-none focus:ring-2 ring-terracotta/10 transition-all font-mono"
                      placeholder="Username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Secure Contact Protocol</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-mahogany uppercase outline-none focus:ring-2 ring-terracotta/10 transition-all font-mono"
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-14 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
                >
                  <X size={16} /> ABORT
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 h-14 bg-mahogany text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl shadow-mahogany/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'SYNCING...' : (<><Check size={16} /> SYNC IDENTITY</>)}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic ml-4">Preferences</p>
                <MenuItem icon={Heart} label="Mission Favourites" />
                <MenuItem icon={Download} label="Training Assets" />
                <MenuItem icon={Globe} label="Language Interface" />
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic ml-4">Advanced</p>
                <MenuItem icon={MapPin} label="Deployment Zone" />
                <MenuItem icon={CreditCard} label="NGO Perks Card" />
                <MenuItem icon={History} label="System Log" />
              </div>
              
              <div className="pt-4 space-y-3">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic ml-4">Danger Zone</p>
                <MenuItem icon={Trash2} label="Purge Local Cache" danger />
                <MenuItem icon={LogOut} label="Log Out Terminal" onClick={handleLogout} danger />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
