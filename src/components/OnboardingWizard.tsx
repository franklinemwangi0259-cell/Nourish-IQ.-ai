import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowRight, Activity, Droplets, Brain, Heart, ShieldAlert, Zap, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface OnboardingWizardProps {
  profile: UserProfile;
  user: any;
}

export function OnboardingWizard({ profile, user }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [targetCalories, setTargetCalories] = useState(profile.targetCalories || 2000);
  const [waterIntakeGoal, setWaterIntakeGoal] = useState(profile.waterIntakeGoal || 2000);
  const [aiPersonality, setAiPersonality] = useState<'empathetic' | 'strict' | 'scientific' | 'playful'>(profile.aiPersonality || 'empathetic');
  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Calculate default macro goals based on calorie target
      // Standard split: 30% Protein, 40% Carbs, 30% Fat
      const targetProtein = Math.round((targetCalories * 0.3) / 4);
      const targetCarbs = Math.round((targetCalories * 0.4) / 4);
      const targetFat = Math.round((targetCalories * 0.3) / 9);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        waterIntakeGoal,
        aiPersonality,
        hasCompletedOnboarding: true
      });
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-slate-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-md relative z-10 tech-card border-white/10 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-colors pointer-events-none" />
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-6">
                  <Activity size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight">Welcome to Nourish <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">IQ</span></h1>
                <p className="text-slate-400 font-medium">Your baseline goals to personalize the experience.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={16} className="text-emerald-400" /> Daily Calorie Goal
                  </label>
                  <input
                    type="number"
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(Number(e.target.value))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Droplets size={16} className="text-blue-400" /> Daily Water Goal (ml)
                  </label>
                  <input
                    type="number"
                    value={waterIntakeGoal}
                    onChange={(e) => setWaterIntakeGoal(Number(e.target.value))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                Next Step <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-purple-500/20 mb-6">
                  <Brain size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">AI</span></h2>
                <p className="text-slate-400 font-medium">How should NORI interact with you?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'empathetic', label: 'Supportive', icon: Heart, color: 'text-pink-400', desc: 'Gentle & encouraging' },
                  { id: 'strict', label: 'Strict Coach', icon: ShieldAlert, color: 'text-red-400', desc: 'Tough love & discipline' },
                  { id: 'scientific', label: 'Data Driven', icon: Activity, color: 'text-blue-400', desc: 'Facts & analytics' },
                  { id: 'playful', label: 'Fun Buddy', icon: Zap, color: 'text-amber-400', desc: 'Jokes & gamification' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAiPersonality(p.id as any)}
                    className={cn(
                      "p-4 rounded-3xl border text-left transition-all flex flex-col gap-2 relative overflow-hidden group/personality",
                      aiPersonality === p.id
                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20"
                        : "bg-slate-950/30 border-white/5 hover:border-white/20"
                    )}
                  >
                    {aiPersonality === p.id && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-2xl rounded-full" />
                    )}
                    <p.icon size={24} className={cn("transition-all", aiPersonality === p.id ? p.color : "text-slate-500")} />
                    <div>
                      <h3 className="font-bold text-white">{p.label}</h3>
                      <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Complete Setup"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          <div className={cn("w-2 h-2 rounded-full transition-all", step === 1 ? "bg-emerald-500 w-6" : "bg-slate-700")} />
          <div className={cn("w-2 h-2 rounded-full transition-all", step === 2 ? "bg-emerald-500 w-6" : "bg-slate-700")} />
        </div>
      </div>
    </div>
  );
}
