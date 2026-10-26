import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../lib/utils';
import { Habit, UserProfile } from '../types';
import { calculateUserClass, AVATARS, AnimatedAvatar } from '../App';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isBiometricSupported, registerBiometricCredential } from '../lib/webauthn';
import { usePWAInstall, InstallGuideModal } from './InstallButton';
import { KSEFDocumentationModal } from './KSEFDocumentationModal';

interface ProfileProps {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  user: any;
  habits: Habit[];
  setShowClassModal: (val: boolean) => void;
  handleShare: (title: string, desc: string) => void;
  saveProfile: () => void;
  feedback: string;
  setFeedback: (val: string) => void;
  hasRated: boolean;
  setHasRated: (val: boolean) => void;
  rating: number;
  setRating: (val: number) => void;
  hoverRating: number;
  setHoverRating: (val: number) => void;
  logout: () => void;
  handleSignIn: () => void;
  setActiveTab: (val: any) => void;
}

export const Profile: React.FC<ProfileProps> = ({
  profile,
  setProfile,
  user,
  habits,
  setShowClassModal,
  handleShare,
  saveProfile,
  feedback,
  setFeedback,
  hasRated,
  setHasRated,
  rating,
  setRating,
  hoverRating,
  setHoverRating,
  logout,
  handleSignIn,
  setActiveTab,
}) => {
  const userClassData = calculateUserClass(profile?.points || 0, habits);

  const [biometricSupport, setBiometricSupport] = React.useState<boolean>(false);
  const [biometricsList, setBiometricsList] = React.useState<any[]>([]);
  const [isRegisteringBiometric, setIsRegisteringBiometric] = React.useState<boolean>(false);
  const [biometricMsg, setBiometricMsg] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { isInstalled, isInstallable, triggerInstall } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = React.useState(false);
  const [showKSEFModal, setShowKSEFModal] = React.useState(false);

  React.useEffect(() => {
    isBiometricSupported().then(setBiometricSupport);
    if (user?.uid) {
      loadBiometrics();
    }
  }, [user]);

  const loadBiometrics = async () => {
    try {
      const q = collection(db, 'users', user.uid, 'biometrics');
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBiometricsList(list);
    } catch (err) {
      console.error("Error loading biometrics list:", err);
    }
  };

  const handleRegisterBiometric = async () => {
    if (!user) return;
    setIsRegisteringBiometric(true);
    setBiometricMsg(null);
    try {
      const res = await registerBiometricCredential(
        user.uid,
        user.email || '',
        profile?.displayName || user.displayName || 'Nourish IQ User'
      );
      if (res.success) {
        setBiometricMsg({ type: 'success', text: res.message });
        loadBiometrics();
      } else {
        setBiometricMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setBiometricMsg({ type: 'error', text: err.message || "Failed to register biometrics." });
    } finally {
      setIsRegisteringBiometric(false);
    }
  };

  const handleDeleteBiometric = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'biometrics', id));
      loadBiometrics();
      setBiometricMsg({ type: 'success', text: "Biometric credential removed successfully." });
    } catch (err: any) {
      setBiometricMsg({ type: 'error', text: err.message || "Failed to delete credential." });
    }
  };

  return (
    <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8 py-4">
      <div className="flex items-center justify-between px-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group"
        >
          <div className="w-9 h-9 glass-card rounded-xl flex items-center justify-center group-hover:bg-white/5 transition-all">
            <LucideIcons.ArrowLeft size={18} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
        </button>
        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Profile Settings
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-slate-800 shadow-2xl mb-4 relative z-10 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 animate-float">
            {profile?.photoURL ? (
              <AnimatedAvatar src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">
                <LucideIcons.User size={48} />
              </div>
            )}
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">{profile?.displayName}</h2>
          <p className="text-slate-500 text-sm font-medium">{user?.email}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/20 flex items-center gap-2 uppercase tracking-widest">
              <LucideIcons.Zap size={14} className="fill-emerald-500/20" /> {profile?.points || 0} Points
            </div>
            <div className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-2 uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity",
              userClassData.currentClass.bg,
              userClassData.currentClass.color,
              userClassData.currentClass.border
            )} onClick={() => setShowClassModal(true)}>
              {(() => {
                const Icon = (LucideIcons[userClassData.currentClass.icon as keyof typeof LucideIcons] || LucideIcons.Star) as React.ElementType;
                return <Icon size={14} />;
              })()}
              {userClassData.currentClass.name}
            </div>
            <button 
              onClick={() => handleShare("My Progress on Nourish IQ", `I've earned ${profile?.points || 0} points on Nourish IQ! Join me in tracking your nutrition and habits.`)}
              className="w-9 h-9 glass-card rounded-xl text-slate-400 hover:text-emerald-400 transition-all flex items-center justify-center"
            >
              <LucideIcons.Share2 size={16} />
            </button>
          </div>

          {/* Badges Display */}
          {profile?.badges && profile.badges.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {profile.badges.map((badge) => {
                const Icon = (LucideIcons[badge.icon as keyof typeof LucideIcons] || LucideIcons.Award) as React.ElementType;
                return (
                  <motion.div 
                    key={badge.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-slate-900/50 border border-white/5 px-3 py-1 rounded-full flex items-center gap-2"
                    title={badge.description}
                  >
                    <Icon size={12} className="text-amber-400" />
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">{badge.title}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="tech-card border-white/5 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <LucideIcons.Settings size={20} />
          </div>
          <h3 className="font-display font-bold text-lg text-white">Account Settings</h3>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Display Name</label>
            <input 
              type="text" 
              value={profile?.displayName || ''} 
              onChange={(e) => setProfile(p => p ? { ...p, displayName: e.target.value } : null)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Choose Avatar</label>
            <div className="grid grid-cols-6 gap-3">
              {AVATARS.map((avatar, index) => (
                <motion.button
                  key={avatar}
                  initial={{ opacity: 0, scale: 0.8, y: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: [0, -4, 0]
                  }}
                  transition={{ 
                    opacity: { delay: index * 0.05 },
                    scale: { delay: index * 0.05 },
                    y: {
                      repeat: Infinity,
                      duration: 2 + (index % 3) * 0.5,
                      ease: "easeInOut",
                      delay: index * 0.1
                    }
                  }}
                  whileHover={{ scale: 1.15, rotate: [-5, 5, -5, 0] }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setProfile(p => p ? { ...p, photoURL: avatar } : null)}
                  className={cn(
                    "aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300",
                    profile?.photoURL === avatar 
                      ? "border-emerald-500 shadow-lg shadow-emerald-500/20" 
                      : "border-transparent opacity-40 hover:opacity-100"
                  )}
                >
                  <AnimatedAvatar src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Calorie Goal</label>
              <input 
                type="number" 
                value={profile?.targetCalories || ''} 
                onChange={(e) => setProfile(p => p ? { ...p, targetCalories: Number(e.target.value) } : null)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Water Goal (ml)</label>
              <input 
                type="number" 
                value={profile?.waterIntakeGoal || ''} 
                onChange={(e) => setProfile(p => p ? { ...p, waterIntakeGoal: Number(e.target.value) } : null)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <LucideIcons.Target size={14} className="text-emerald-500" /> Daily Macro Goals
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Protein (g)</label>
                <input 
                  type="number" 
                  value={profile?.targetProtein || ''} 
                  onChange={(e) => setProfile(p => p ? { ...p, targetProtein: Number(e.target.value) } : null)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Carbs (g)</label>
                <input 
                  type="number" 
                  value={profile?.targetCarbs || ''} 
                  onChange={(e) => setProfile(p => p ? { ...p, targetCarbs: Number(e.target.value) } : null)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fat (g)</label>
                <input 
                  type="number" 
                  value={profile?.targetFat || ''} 
                  onChange={(e) => setProfile(p => p ? { ...p, targetFat: Number(e.target.value) } : null)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <LucideIcons.Activity size={14} className="text-blue-500" /> Body Metrics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Weight Goal (kg)</label>
                <input 
                  type="number" 
                  value={profile?.targetWeight || ''} 
                  onChange={(e) => setProfile(p => p ? { ...p, targetWeight: Number(e.target.value) } : null)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Body Fat %</label>
                <input 
                  type="number" 
                  value={profile?.targetBodyFat || ''} 
                  onChange={(e) => setProfile(p => p ? { ...p, targetBodyFat: Number(e.target.value) } : null)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <LucideIcons.Brain size={14} className="text-purple-500" /> AI Personality
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'empathetic', label: 'Supportive', icon: LucideIcons.Heart, color: 'text-pink-400' },
                { id: 'strict', label: 'Strict Coach', icon: LucideIcons.ShieldAlert, color: 'text-red-400' },
                { id: 'scientific', label: 'Data Driven', icon: LucideIcons.Activity, color: 'text-blue-400' },
                { id: 'playful', label: 'Fun Buddy', icon: LucideIcons.Zap, color: 'text-amber-400' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProfile(prev => prev ? { ...prev, aiPersonality: p.id as any } : null)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-center gap-3",
                    (profile?.aiPersonality || 'empathetic') === p.id 
                      ? "bg-emerald-500/10 border-emerald-500/50" 
                      : "bg-slate-950/30 border-white/5 hover:border-white/10"
                  )}
                >
                  <p.icon size={18} className={p.color} />
                  <span className="text-xs font-bold text-white">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={saveProfile}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] mt-4"
          >
            <LucideIcons.Save size={20} className="group-hover:scale-110 transition-transform" /> 
            Save Changes
          </button>

          <button 
            onClick={logout}
            className="w-full py-4 bg-slate-900 border border-white/5 text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 mt-4"
          >
            <LucideIcons.LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Feedback Section */}
        <div className="pt-8 border-t border-white/5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Feedback & Suggestions</h3>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Have suggestions or feedback about the website or class system? Let us know!"
            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700 min-h-[100px] resize-none"
          />
          <button
            onClick={() => {
              window.location.href = `mailto:franklinemwangi0259@gmail.com?subject=Feedback about Classes and Website from ${profile?.displayName || 'User'}&body=${encodeURIComponent(feedback)}`;
              setFeedback('');
            }}
            disabled={!feedback.trim()}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
          >
            Send Feedback
          </button>
        </div>

        {/* Security Section */}
        <div className="pt-8 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <LucideIcons.ShieldAlert size={20} />
            </div>
            <h3 className="font-display font-bold text-lg text-white">Security & Privacy</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                  <LucideIcons.CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Firestore Hardening</p>
                  <p className="text-[10px] text-slate-500">Stricter security rules applied</p>
                </div>
              </div>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                  <LucideIcons.ShieldAlert size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">CSP Protection</p>
                  <p className="text-[10px] text-slate-500">Content Security Policy enabled</p>
                </div>
              </div>
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">Active</span>
            </div>
          </div>
        </div>

        {/* Biometrics & Passkeys Section */}
        <div className="pt-8 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <LucideIcons.Fingerprint size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Biometric Login & Passkeys</h3>
              <p className="text-[10px] text-slate-500 font-medium">Register device FaceID, TouchID, or biometric credentials for quick access</p>
            </div>
          </div>

          {/* Biometric Status and Actions */}
          <div className="space-y-3">
            <div className="p-4 bg-slate-950/30 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Biometric Support</p>
                  <p className="text-[10px] text-slate-500 font-medium">Device capability assessment</p>
                </div>
                {biometricSupport ? (
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">Supported</span>
                ) : (
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">Not Available</span>
                )}
              </div>

              {biometricSupport && (
                <button
                  type="button"
                  onClick={handleRegisterBiometric}
                  disabled={isRegisteringBiometric}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  {isRegisteringBiometric ? (
                    <>
                      <LucideIcons.Loader2 size={14} className="animate-spin" />
                      Registering Device...
                    </>
                  ) : (
                    <>
                      <LucideIcons.Fingerprint size={14} />
                      Register Biometric / Passkey
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Notification Messages */}
            <AnimatePresence>
              {biometricMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5",
                    biometricMsg.type === 'success'
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/15 border-red-500/30 text-red-400"
                  )}
                >
                  {biometricMsg.type === 'success' ? (
                    <LucideIcons.CheckCircle size={14} className="shrink-0" />
                  ) : (
                    <LucideIcons.AlertCircle size={14} className="shrink-0" />
                  )}
                  <span>{biometricMsg.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registered Devices List */}
            {biometricsList.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">Registered Biometric Devices</h4>
                <div className="space-y-2">
                  {biometricsList.map((cred) => (
                    <div
                      key={cred.id}
                      className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-white/5 group hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                          <LucideIcons.Fingerprint size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {cred.deviceType === 'platform' ? 'Native Device Authenticator' : 'Security Key'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Registered {cred.createdAt?.toDate ? cred.createdAt.toDate().toLocaleDateString() : 'recently'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBiometric(cred.id)}
                        className="w-8 h-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                        title="Remove Biometric Device"
                      >
                        <LucideIcons.Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Developer</h4>
              <p className="text-sm font-bold text-white">Frankline Mwangi</p>
              <p className="text-[10px] text-slate-500 font-medium">franklinemwangi0259@gmail.com</p>
            </div>
            <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-emerald-500">
              <LucideIcons.Activity size={24} />
            </div>
          </div>

          <div className="space-y-4 bg-slate-950/30 p-5 rounded-[1.5rem] border border-white/5">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <LucideIcons.Star size={14} /> Rate Nourish IQ
            </h4>
            
            {hasRated ? (
              <div className="text-center py-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-2xl mb-2">
                  {rating >= 4 ? '😃' : rating >= 3 ? '🙂' : '😡'}
                </p>
                <p className="text-sm font-bold text-emerald-400">Thank you for your feedback!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => {
                        setRating(star);
                        setHasRated(true);
                      }}
                      className="relative p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <LucideIcons.Star 
                        size={32} 
                        className={cn(
                          "transition-colors duration-200",
                          (hoverRating || rating) >= star 
                            ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" 
                            : "text-slate-600"
                        )} 
                      />
                    </button>
                  ))}
                </div>
                <div className="h-8 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {(hoverRating > 0 || rating > 0) && (
                      <motion.div
                        key={hoverRating || rating}
                        initial={{ opacity: 0, y: 5, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.8 }}
                        className="text-3xl"
                      >
                        {(hoverRating || rating) >= 4 ? '😃' : (hoverRating || rating) >= 3 ? '🙂' : '😡'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* KSEF 2027 Fair Documentation Section */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 rounded-2xl border border-emerald-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                  <LucideIcons.GraduationCap size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-white">KSEF 2027 Documentation</p>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-400 text-slate-950 uppercase">
                      Official
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Kenya Science & Engineering Fair 2027 research report & rubric
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKSEFModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:brightness-110 shadow-md shadow-emerald-500/20 uppercase tracking-wider text-[11px]"
              >
                <LucideIcons.FileText size={13} />
                <span>View Report</span>
              </button>
            </div>
          </div>

          <KSEFDocumentationModal isOpen={showKSEFModal} onClose={() => setShowKSEFModal(false)} />

          {/* App Installation Section */}
          <div className="p-4 bg-slate-950/30 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                  <LucideIcons.Smartphone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">App Installation</p>
                  <p className="text-[10px] text-slate-400">
                    {isInstalled ? "Installed & running standalone" : "Install on Chrome for full-screen & offline use"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (isInstallable) {
                    const res = await triggerInstall();
                    if (res === 'manual_guide') setShowInstallModal(true);
                  } else {
                    setShowInstallModal(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isInstalled
                    ? "bg-slate-800 text-slate-400 border border-slate-700"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                }`}
              >
                <LucideIcons.Download size={13} />
                <span>{isInstalled ? "Guide" : "Install App"}</span>
              </button>
            </div>
          </div>

          <InstallGuideModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={logout}
              className="py-4 glass-card text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
            >
              <LucideIcons.LogOut size={20} /> Sign Out
            </button>
            <button 
              onClick={async () => {
                await logout();
                handleSignIn();
              }}
              className="py-4 glass-card text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all"
            >
              <LucideIcons.User size={20} /> Switch
            </button>
          </div>

          <div className="pt-6 pb-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">&copy; 2026 Nourish IQ</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
