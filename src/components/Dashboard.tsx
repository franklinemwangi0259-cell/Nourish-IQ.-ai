import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../lib/utils';
import { FoodLog, Habit, DailyStats, UserProfile } from '../types';
import { calculateUserClass } from '../App';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { format } from 'date-fns';

interface DashboardProps {
  showTrends: boolean;
  setShowTrends: (val: boolean) => void;
  notifications: Array<{ title: string; description: string; icon: string }>;
  currentTrendIndex: number;
  setCurrentTrendIndex: (idx: number) => void;
  profile: UserProfile | null;
  habits: Habit[];
  stats: DailyStats;
  setStats: React.Dispatch<React.SetStateAction<DailyStats>>;
  trendData: Array<{ name: string; calories: number }>;
  foodLogs: FoodLog[];
  setViewingLog: (log: FoodLog | null) => void;
  awardPoints: (pts: number, reason: string) => void;
  setActiveTab: (tab: any) => void;
  startCamera: () => void;
  handleShare: (title: string, desc: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  showTrends,
  setShowTrends,
  notifications,
  currentTrendIndex,
  setCurrentTrendIndex,
  profile,
  habits,
  stats,
  setStats,
  trendData,
  foodLogs,
  setViewingLog,
  awardPoints,
  setActiveTab,
  startCamera,
  handleShare,
}) => {
  const userClassData = calculateUserClass(profile?.points || 0, habits);

  return (
    <motion.div 
      key="dashboard" 
      initial={{ opacity: 0, y: 20, scale: 0.98 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, y: -20, scale: 0.98 }} 
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="space-y-6 py-4"
    >
      {/* NORI AI Daily Insight */}
      <AnimatePresence>
        {showTrends && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="tech-card border-emerald-500/20 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent opacity-40 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[60px] rounded-full -mr-10 -mt-10 group-hover:bg-emerald-500/30 transition-colors duration-700 pointer-events-none" />
            
            <button 
              onClick={() => setShowTrends(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10 bg-slate-900/50 p-1.5 rounded-full backdrop-blur-sm"
            >
              <LucideIcons.X size={14} />
            </button>
            
            <div className="flex gap-4 relative z-10 items-start">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 relative z-10">
                  <LucideIcons.Brain size={22} className="drop-shadow-md" />
                </div>
                <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-40 animate-pulse pointer-events-none" />
              </div>
              
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-white">NORI AI Insight</h3>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Daily Tip</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  <strong className="text-emerald-400">{notifications[currentTrendIndex]?.title}:</strong> {notifications[currentTrendIndex]?.description || "Loading fresh insights..."}
                </p>
                
                <div className="flex gap-1.5 mt-4">
                  {notifications.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setCurrentTrendIndex(i)}
                      className={cn("h-1 rounded-full transition-all duration-500", i === currentTrendIndex ? "w-6 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "w-1.5 bg-slate-700 hover:bg-slate-600")}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Progress Indicator */}
      <section className="tech-card border-white/10 p-4 py-3 flex items-center justify-between group cursor-pointer hover:border-blue-500/30 transition-all bg-slate-900/40" onClick={() => setActiveTab('profile')}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-[1.25rem] flex items-center justify-center relative",
            userClassData.currentClass.bg,
            userClassData.currentClass.color
          )}>
            <div className={cn("absolute inset-0 blur-lg opacity-30 pointer-events-none", userClassData.currentClass.bg)} />
            {(() => {
              const Icon = (LucideIcons[userClassData.currentClass.icon as keyof typeof LucideIcons] || LucideIcons.Star) as React.ElementType;
              return <Icon size={24} className="relative z-10" />;
            })()}
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Current Rank</h3>
            <p className={cn("text-base font-display font-black tracking-tight", userClassData.currentClass.color)}>
              {userClassData.currentClass.name}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
            {userClassData.nextClass ? (
              <><span className="text-white">{userClassData.nextClass.minPoints - (profile?.points || 0)}</span> pts to NEXT LEVEL</>
            ) : (
              "MAX RANK REACHED"
            )}
          </div>
          <div className="w-32 h-1.5 bg-slate-900 rounded-full mt-2 overflow-hidden border border-white/5">
            {userClassData.nextClass && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(((profile?.points || 0) - userClassData.currentClass.minPoints) / (userClassData.nextClass.minPoints - userClassData.currentClass.minPoints) * 100, 100)}%` 
                }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
              />
            )}
          </div>
        </div>
      </section>

      {/* Daily Progress */}
      <section className="tech-card border-white/5 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
        <button 
          onClick={() => handleShare("My Daily Progress on Nourish IQ", `I've consumed ${stats.calories} calories today out of my ${stats.targetCalories} goal!`)}
          className="absolute top-6 right-6 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-emerald-400 transition-all border border-white/5 z-10"
        >
          <LucideIcons.Share2 size={18} />
        </button>
        <div className="flex justify-between items-end mb-6 relative z-10">
          <div>
            <h2 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Daily Calories</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-display font-bold text-white tracking-tight">{stats.calories}</span>
              <span className="text-slate-500 text-sm font-medium">/ {stats.targetCalories} kcal</span>
            </div>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                className="text-slate-800/50"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={175.9}
                initial={{ strokeDashoffset: 175.9 }}
                animate={{ strokeDashoffset: 175.9 - (Math.min(stats.calories / stats.targetCalories, 1) * 175.9) }}
                className="text-emerald-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[11px] font-bold text-emerald-400">
                {Math.round((stats.calories / stats.targetCalories) * 100)}%
              </div>
            </div>
          </div>
        </div>
        <div className="w-full bg-slate-800/50 h-2.5 rounded-full overflow-hidden relative z-10">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${Math.min((stats.calories / stats.targetCalories) * 100, 100)}%` }} 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
          />
        </div>
      </section>

      {/* 7-Day Trend Chart */}
      <section className="tech-card border-white/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <LucideIcons.TrendingUp size={18} />
            </div>
            7-Day Trend
          </h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleShare("My 7-Day Nutrition Trend", `I've been tracking my calories on Nourish IQ. Here's my 7-day trend! Average: ${Math.round(trendData.reduce((s, d) => s + d.calories, 0) / 7)} kcal/day.`)}
              className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition-all border border-white/5"
              title="Share Trend"
            >
              <LucideIcons.Share2 size={14} />
            </button>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/10 shadow-inner">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider">Calories</span>
            </div>
          </div>
        </div>
        <div className="h-52 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <defs>
                <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis 
                dataKey="name" 
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                tickLine={false} 
                tick={{ fill: '#f1f5f9', fontSize: 11, fontWeight: 700 }}
                dy={12}
              />
              <YAxis hide />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', color: '#f8fafc', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                cursor={{ stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="calories" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCal)" 
                animationDuration={1500}
                dot={{ r: 4, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Macros & Water */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="tech-card border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">At-A-Glance Macros</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Track remaining targets & progress</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Live Tracking</span>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { 
                name: 'Protein', 
                value: stats.protein, 
                target: stats.targetProtein || 1, 
                color: 'emerald',
                icon: LucideIcons.Beef,
                gradient: 'from-emerald-500 to-teal-400',
                ringColor: 'text-emerald-500',
                badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              },
              { 
                name: 'Carbs', 
                value: stats.carbs, 
                target: stats.targetCarbs || 1, 
                color: 'blue',
                icon: LucideIcons.Wheat,
                gradient: 'from-blue-500 to-indigo-400',
                ringColor: 'text-blue-500',
                badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              },
              { 
                name: 'Fat', 
                value: stats.fat, 
                target: stats.targetFat || 1, 
                color: 'amber',
                icon: LucideIcons.Flame,
                gradient: 'from-amber-500 to-orange-400',
                ringColor: 'text-amber-500',
                badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              },
            ].map((m) => {
              const pct = Math.min(Math.round((m.value / m.target) * 100), 100);
              const remaining = Math.max(0, m.target - m.value);
              const Icon = m.icon;
              
              return (
                <div key={m.name} className="p-3.5 bg-slate-900/60 rounded-2xl border border-white/5 space-y-2.5 hover:border-white/10 transition-all group/macro">
                  <div className="flex items-center justify-between">
                    {/* Left side: Mini Progress Ring + Icon + Name */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            className="text-slate-800"
                          />
                          <motion.circle
                            cx="18"
                            cy="18"
                            r="14"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={87.96}
                            initial={{ strokeDashoffset: 87.96 }}
                            animate={{ strokeDashoffset: 87.96 - (pct / 100) * 87.96 }}
                            className={m.ringColor}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                          <Icon size={13} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">{m.name}</span>
                          <span className="text-[10px] font-black text-slate-400">({pct}%)</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-300">
                          {m.value}g <span className="text-slate-400 font-medium">/ {m.target}g</span>
                        </p>
                      </div>
                    </div>

                    {/* Right side: Remaining Target Badge */}
                    <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", m.badgeBg)}>
                      {remaining > 0 ? `${remaining}g remaining` : 'Target Met 🎉'}
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className={cn("h-full rounded-full bg-gradient-to-r shadow-sm transition-all duration-500", m.gradient)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="tech-card border-white/5 flex flex-col items-center justify-center min-h-[220px] relative">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest absolute top-6 left-6">Hydration</h3>
          <div className="relative w-24 h-24 flex items-center justify-center mt-4 group/water">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                className="text-slate-800/30"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={263.9}
                initial={{ strokeDashoffset: 263.9 }}
                animate={{ strokeDashoffset: 263.9 - (Math.min(stats.waterIntake / (stats.waterIntakeGoal || 1), 1) * 263.9) }}
                className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform group-hover/water:scale-110 duration-500">
              <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-1">
                <LucideIcons.Droplets size={16} />
              </div>
              <span className="text-xs font-black text-white">{Math.round((stats.waterIntake / stats.waterIntakeGoal) * 100)}%</span>
            </div>
          </div>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-xl font-display font-black text-white">{stats.waterIntake}</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase">/ {stats.waterIntakeGoal} ml</span>
          </div>
          <button 
            onClick={() => {
              setStats(s => ({ ...s, waterIntake: s.waterIntake + 250 }));
              awardPoints(2, "Hydration focus");
            }}
            className="mt-4 w-11/12 py-3 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/10 hover:bg-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LucideIcons.Plus size={14} /> Add 250ml
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <section className="tech-card border-white/5 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recent Activity</h3>
          <button 
            onClick={() => setActiveTab('logs')}
            className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="space-y-4 pt-2">
          {foodLogs.slice(0, 3).map((log) => (
            <div key={log.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => setViewingLog(log)}>
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-white/5">
                {log.imageUrl ? (
                  <img src={log.imageUrl} alt={log.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <LucideIcons.Utensils size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">{log.name}</h4>
                <p className="text-[10px] text-slate-500 font-medium">{format(new Date(log.timestamp), 'MMM d, HH:mm')} • {log.calories} kcal</p>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{log.protein}g</span>
                  <span className="text-[8px] text-slate-600 uppercase font-black">P</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">{log.carbs}g</span>
                  <span className="text-[8px] text-slate-600 uppercase font-black">C</span>
                </div>
              </div>
            </div>
          ))}
          {foodLogs.length === 0 && (
            <div className="py-4 text-center border border-dashed border-white/5 rounded-2xl">
              <p className="text-[10px] text-slate-500 font-medium">No recent activity</p>
            </div>
          )}
        </div>
      </section>

      {/* Weekly Quests */}
      <section className="tech-card border-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400">
              <LucideIcons.Target size={20} />
            </div>
            <div>
              <h3 className="font-display font-medium text-xl text-white tracking-tight">Weekly Quests</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Challenges</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3 relative z-10">
          {[
            { title: "Hydration Master", desc: "Hit your water goal 5 days", progress: 3, total: 5, points: 50, icon: LucideIcons.Droplets, color: "text-blue-400", bg: "bg-blue-500/10" },
            { title: "Consistent Logger", desc: "Log 3 meals today", progress: foodLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length, total: 3, points: 30, icon: LucideIcons.Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { title: "Habit Builder", desc: "Complete all daily habits", progress: habits.filter(h => h.completed).length, total: Math.max(habits.length, 1), points: 40, icon: LucideIcons.CheckCircle2, color: "text-indigo-400", bg: "bg-indigo-500/10" }
          ].map((quest, i) => (
            <div key={i} className="bg-slate-950/30 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", quest.bg, quest.color)}>
                <quest.icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-bold text-white text-sm truncate">{quest.title}</h4>
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">+{quest.points}</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2 truncate">{quest.desc}</p>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((quest.progress / quest.total) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vitamins & Micronutrients */}
      <section className="tech-card border-blue-500/10">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Daily Vitamins & Micronutrients</h3>
        {stats.vitamins && stats.vitamins.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {stats.vitamins.map((v, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={i} 
                className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wide">{v}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-xs text-slate-500 font-medium italic">Log meals to see your daily micronutrient intake</p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-5">
        <button 
          onClick={() => setActiveTab('recipe')}
          className="p-6 tech-card border-emerald-500/10 flex flex-col items-center gap-3 group hover:scale-[1.02] active:scale-95 transition-all text-center"
        >
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-emerald-500/5">
            <LucideIcons.ChefHat size={28} />
          </div>
          <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Analyze Recipe</span>
        </button>
        <button 
          onClick={() => startCamera()}
          className="p-6 tech-card border-blue-500/10 flex flex-col items-center gap-3 group hover:scale-[1.02] active:scale-95 transition-all text-center"
        >
          <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-blue-500/5">
            <LucideIcons.Camera size={28} />
          </div>
          <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Snap Meal</span>
        </button>
      </div>

    </motion.div>
  );
};
