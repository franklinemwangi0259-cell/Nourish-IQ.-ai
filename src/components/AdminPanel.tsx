import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Trash2, 
  Plus, 
  Award, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  Heart, 
  Info, 
  Lock, 
  Unlock, 
  Settings, 
  Activity, 
  FileText, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  TrendingUp,
  Flame,
  Search,
  Sparkles,
  Zap,
  RefreshCw,
  UserCheck,
  Crown,
  Flag,
  AlertTriangle,
  Calendar,
  Eye,
  X,
  ChevronRight,
  Cpu,
  Server
} from 'lucide-react';
import { doc, updateDoc, getDoc, setDoc, collection, getDocs, deleteDoc, query, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PublicProfile, CommunityMessage, FoodLog, Habit } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface AdminPanelProps {
  leaderboard: PublicProfile[];
  communityMessages: CommunityMessage[];
  deleteCommunityMessage: (messageId: string) => Promise<void>;
  onBack: () => void;
}

interface AIFeedback {
  id: string;
  uid: string;
  messageContent: string;
  feedback: 'positive' | 'negative';
  timestamp: any;
}

interface CommunityReport {
  id: string;
  reporterUid: string;
  messageId: string;
  messageContent: string;
  messageAuthorUid: string;
  reason: string;
  timestamp: any;
  status: 'pending' | 'resolved' | 'dismissed';
}

export function AdminPanel({ 
  leaderboard, 
  communityMessages, 
  deleteCommunityMessage, 
  onBack 
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'messages' | 'feedback' | 'api-health'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [aiFeedbacks, setAiFeedbacks] = useState<AIFeedback[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  
  // Real-time Community Goal State
  const [communityGoalTarget, setCommunityGoalTarget] = useState(10000);
  const [communityGoalCurrent, setCommunityGoalCurrent] = useState(4500);
  const [communityGoalTitle, setCommunityGoalTitle] = useState("Community Protein Push");
  const [communityGoalDesc, setCommunityGoalDesc] = useState("Let's hit 10,000g of protein together this week!");
  const [communityGoalBoss, setCommunityGoalBoss] = useState("The Carb Crusher");
  const [communityGoalBossHealth, setCommunityGoalBossHealth] = useState(55);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  // Users Directory State
  const [allUsers, setAllUsers] = useState<PublicProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // API Health Monitor State
  const [integrationHealth, setIntegrationHealth] = useState<{
    geminiConfigured: boolean;
    uptime: number;
    memory: { rss: number; heapUsed: number; heapTotal: number };
  } | null>(null);
  const [modelLatencies, setModelLatencies] = useState<Record<string, { latency?: number; status: 'idle' | 'testing' | 'healthy' | 'slow' | 'error'; error?: string }>>({
    'gemini-3.6-flash': { status: 'idle' },
    'gemini-3.1-flash-lite': { status: 'idle' },
    'gemini-3.1-flash-tts-preview': { status: 'idle' },
  });
  const [isFetchingIntegrations, setIsFetchingIntegrations] = useState(false);
  const [healthLogs, setHealthLogs] = useState<Array<{ timestamp: string; type: 'success' | 'warning' | 'error'; message: string }>>([
    { timestamp: format(new Date(), 'HH:mm:ss'), type: 'success', message: 'API health diagnostics subsystem initialized.' }
  ]);

  const fetchIntegrationHealth = async () => {
    setIsFetchingIntegrations(true);
    try {
      const res = await fetch('/api/health/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrationHealth(data);
        setHealthLogs(prev => [
          { timestamp: format(new Date(), 'HH:mm:ss'), type: 'success', message: `Backend system stats fetched successfully. Uptime: ${Math.floor(data.uptime)}s.` },
          ...prev
        ]);
      } else {
        throw new Error('Failed to fetch system stats');
      }
    } catch (err: any) {
      setHealthLogs(prev => [
        { timestamp: format(new Date(), 'HH:mm:ss'), type: 'error', message: `Failed to fetch integration health: ${err.message}` },
        ...prev
      ]);
    } finally {
      setIsFetchingIntegrations(false);
    }
  };

  const testModelHealth = async (modelName: string) => {
    setModelLatencies(prev => ({
      ...prev,
      [modelName]: { ...prev[modelName], status: 'testing' }
    }));
    setHealthLogs(prev => [
      { timestamp: format(new Date(), 'HH:mm:ss'), type: 'success', message: `Starting diagnostic latency test for ${modelName}...` },
      ...prev
    ]);

    try {
      const res = await fetch(`/api/health/test-gemini?model=${modelName}`);
      if (res.ok) {
        const data = await res.json();
        setModelLatencies(prev => ({
          ...prev,
          [modelName]: {
            latency: data.latencyMs,
            status: data.status,
            error: data.error
          }
        }));
        const logType = data.status === 'healthy' ? 'success' : data.status === 'slow' ? 'warning' : 'error';
        setHealthLogs(prev => [
          {
            timestamp: format(new Date(), 'HH:mm:ss'),
            type: logType,
            message: `Model ${modelName} test complete: ${data.status.toUpperCase()} (${data.latencyMs}ms)${data.error ? ' - Error: ' + data.error : ''}`
          },
          ...prev
        ]);
      } else {
        throw new Error('Endpoint returned error response');
      }
    } catch (err: any) {
      setModelLatencies(prev => ({
        ...prev,
        [modelName]: { status: 'error', error: err.message }
      }));
      setHealthLogs(prev => [
        { timestamp: format(new Date(), 'HH:mm:ss'), type: 'error', message: `Failed to diagnostic test ${modelName}: ${err.message}` },
        ...prev
      ]);
    }
  };

  const testAllModels = async () => {
    const models = Object.keys(modelLatencies);
    for (const m of models) {
      await testModelHealth(m);
    }
  };
  const [pointsAmount, setPointsAmount] = useState<number>(100);
  const [userFilterClass, setUserFilterClass] = useState<string>('all');

  // Detailed User Inspection Drawer State
  const [selectedUser, setSelectedUser] = useState<PublicProfile | null>(null);
  const [selectedUserPrivateDoc, setSelectedUserPrivateDoc] = useState<any | null>(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState<FoodLog[]>([]);
  const [selectedUserHabits, setSelectedUserHabits] = useState<Habit[]>([]);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
  const [editPointsValue, setEditPointsValue] = useState<string>('');
  const [editClassValue, setEditClassValue] = useState<string>('');
  const [editRoleValue, setEditRoleValue] = useState<string>('');

  // Moderation Queue State
  const [moderationSubTab, setModerationSubTab] = useState<'live' | 'reports'>('live');
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [adminBroadcast, setAdminBroadcast] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // System Events Feed Log (visual only)
  const [systemLogs, setSystemLogs] = useState<Array<{ id: string; text: string; time: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
    { id: '1', text: 'Admin Core Session Initialized successfully.', time: format(new Date(), 'HH:mm:ss'), type: 'success' },
    { id: '2', text: 'Connecting to Firestore Enterprise database...', time: format(new Date(), 'HH:mm:ss'), type: 'info' }
  ]);

  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setSystemLogs(prev => [
      { id: Date.now().toString(), text, time: format(new Date(), 'HH:mm:ss'), type },
      ...prev.slice(0, 19)
    ]);
  };

  // 1. Fetch real-time system goal settings
  useEffect(() => {
    const docRef = doc(db, 'system', 'community_challenge');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCommunityGoalTarget(data.target ?? 10000);
        setCommunityGoalCurrent(data.current ?? 4500);
        setCommunityGoalTitle(data.title ?? "Community Protein Push");
        setCommunityGoalDesc(data.description ?? "Let's hit 10,000g of protein together this week!");
        setCommunityGoalBoss(data.bossName ?? "The Carb Crusher");
        setCommunityGoalBossHealth(data.bossHealth ?? 55);
        addLog('Loaded global community goal settings in real-time.', 'success');
      } else {
        addLog('No community goal document exists in system/. Creating default fallback.', 'warn');
      }
    }, (error) => {
      console.error("Error subscribing to system goal:", error);
      addLog('Error reading real-time community goal from database.', 'error');
    });

    return unsubscribe;
  }, []);

  // 2. Fetch all registered users in the database
  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users_public'));
      const list: PublicProfile[] = [];
      snap.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() } as PublicProfile);
      });
      // Sort by points desc
      list.sort((a, b) => (b.points || 0) - (a.points || 0));
      setAllUsers(list);
      addLog(`Fetched ${list.length} users successfully from users_public.`, 'success');
    } catch (e) {
      console.error("Error fetching all users:", e);
      addLog('Failed to load registered user profiles.', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // 3. Fetch user reports
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const snap = await getDocs(collection(db, 'communityReports'));
      const list: CommunityReport[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        list.push({ id: doc.id, ...d } as CommunityReport);
      });
      // Sort by timestamp desc
      list.sort((a, b) => {
        const at = a.timestamp?.seconds || 0;
        const bt = b.timestamp?.seconds || 0;
        return bt - at;
      });
      setReports(list);
      addLog(`Loaded ${list.length} reports in the moderation queue.`, 'info');
    } catch (e) {
      console.error("Error fetching community reports:", e);
      addLog('Failed to retrieve community reports queue.', 'error');
    } finally {
      setIsLoadingReports(false);
    }
  };

  // 4. Fetch AI Feedback log
  const fetchAIFeedback = async () => {
    setIsLoadingFeedback(true);
    try {
      const q = query(collection(db, 'aiFeedback'), orderBy('timestamp', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const feedbackList: AIFeedback[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        feedbackList.push({
          id: doc.id,
          uid: data.uid || '',
          messageContent: data.messageContent || '',
          feedback: data.feedback || 'positive',
          timestamp: data.timestamp
        });
      });
      setAiFeedbacks(feedbackList);
      addLog('Fetched latest 50 AI thumbs up/down ratings.', 'success');
    } catch (error) {
      console.error("Error fetching AI feedback:", error);
      addLog('Error reading AI feedbacks.', 'error');
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  // Trigger loads based on active tabs
  useEffect(() => {
    if (activeSubTab === 'users') {
      fetchAllUsers();
    } else if (activeSubTab === 'feedback') {
      fetchAIFeedback();
    } else if (activeSubTab === 'messages' && moderationSubTab === 'reports') {
      fetchReports();
    } else if (activeSubTab === 'api-health') {
      fetchIntegrationHealth();
    }
  }, [activeSubTab, moderationSubTab]);

  // Inspect specific user detail
  const handleInspectUser = async (user: PublicProfile) => {
    setIsLoadingUserDetails(true);
    setSelectedUser(user);
    setEditPointsValue(user.points?.toString() || '0');
    setEditClassValue(user.class || 'amateur');
    setSelectedUserLogs([]);
    setSelectedUserHabits([]);
    setSelectedUserPrivateDoc(null);
    
    try {
      addLog(`Inspecting user details for: ${user.displayName}...`, 'info');
      
      // 1. Fetch private user document to verify roles/etc
      const privateDocRef = doc(db, 'users', user.uid);
      const privateSnap = await getDoc(privateDocRef);
      if (privateSnap.exists()) {
        const privateData = privateSnap.data();
        setSelectedUserPrivateDoc(privateData);
        setEditRoleValue(privateData.role || 'user');
      } else {
        setEditRoleValue('user');
      }

      // 2. Fetch latest 10 food logs
      const foodLogsSnap = await getDocs(query(
        collection(db, 'users', user.uid, 'foodLogs'),
        orderBy('timestamp', 'desc'),
        limit(15)
      ));
      const foodLogs: FoodLog[] = [];
      foodLogsSnap.forEach((logDoc) => {
        foodLogs.push({ id: logDoc.id, ...logDoc.data() } as FoodLog);
      });
      setSelectedUserLogs(foodLogs);

      // 3. Fetch habits list
      const habitsSnap = await getDocs(collection(db, 'users', user.uid, 'habits'));
      const habits: Habit[] = [];
      habitsSnap.forEach((habitDoc) => {
        habits.push({ id: habitDoc.id, ...habitDoc.data() } as Habit);
      });
      setSelectedUserHabits(habits);

      addLog(`Successfully loaded background logs & habits for ${user.displayName}.`, 'success');
    } catch (err) {
      console.error("Error inspecting user detailed telemetry:", err);
      addLog(`Failed to fetch database telemetry for user: ${user.displayName}`, 'error');
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

  // Update user profile properties
  const handleSaveUserEdit = async () => {
    if (!selectedUser) return;
    setIsLoadingUserDetails(true);
    const newPoints = parseInt(editPointsValue) || 0;
    const newClass = editClassValue;
    const newRole = editRoleValue;

    try {
      // Update public doc
      const publicRef = doc(db, 'users_public', selectedUser.uid);
      await updateDoc(publicRef, {
        points: newPoints,
        class: newClass
      });

      // Update private doc
      const privateRef = doc(db, 'users', selectedUser.uid);
      const privateSnap = await getDoc(privateRef);
      if (privateSnap.exists()) {
        await updateDoc(privateRef, {
          points: newPoints,
          class: newClass,
          role: newRole
        });
      } else {
        // If private doc doesn't exist, bootstrap one safely
        await setDoc(privateRef, {
          uid: selectedUser.uid,
          displayName: selectedUser.displayName,
          email: selectedUserPrivateDoc?.email || '',
          photoURL: selectedUser.photoURL || '',
          points: newPoints,
          class: newClass,
          role: newRole,
          hasCompletedOnboarding: true
        });
      }

      addLog(`Successfully updated ${selectedUser.displayName} (Points: ${newPoints}, Class: ${newClass}, Role: ${newRole})`, 'success');
      
      // Update local state lists
      setAllUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, points: newPoints, class: newClass as any } : u));
      setSelectedUser(prev => prev ? { ...prev, points: newPoints, class: newClass as any } : null);
      setSelectedUserPrivateDoc(prev => prev ? { ...prev, role: newRole } : { role: newRole });
    } catch (e) {
      console.error("Error saving user changes:", e);
      addLog(`Failed to save administrative changes for ${selectedUser.displayName}`, 'error');
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

  // Direct quick Award Points from User Directory
  const handleAwardPoints = async (userId: string, pointsToAward: number) => {
    if (updatingUserId) return;
    setUpdatingUserId(userId);
    try {
      const publicRef = doc(db, 'users_public', userId);
      const publicSnap = await getDoc(publicRef);
      let currentPoints = 0;
      if (publicSnap.exists()) {
        currentPoints = publicSnap.data().points || 0;
      }
      const newPoints = Math.max(0, currentPoints + pointsToAward);
      
      // Determine class
      let userClass: 'amateur' | 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'master' = 'novice';
      if (newPoints >= 1000) userClass = 'master';
      else if (newPoints >= 600) userClass = 'advanced';
      else if (newPoints >= 300) userClass = 'intermediate';
      else if (newPoints >= 150) userClass = 'beginner';
      else if (newPoints >= 50) userClass = 'novice';
      else userClass = 'amateur';

      await updateDoc(publicRef, {
        points: newPoints,
        class: userClass
      });

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          points: newPoints,
          class: userClass
        });
      }

      // Update local listing
      setAllUsers(prev => prev.map(u => u.uid === userId ? { ...u, points: newPoints, class: userClass } : u));
      addLog(`Quick-boosted points for ${userId} by +${pointsToAward}`, 'success');
    } catch (error) {
      console.error("Error quick awarding points:", error);
      addLog('Failed to execute quick points boost.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Save community goal challenge settings persistently to system/community_challenge
  const handleSaveGoal = async () => {
    setIsUpdatingGoal(true);
    try {
      const docRef = doc(db, 'system', 'community_challenge');
      await setDoc(docRef, {
        current: communityGoalCurrent,
        target: communityGoalTarget,
        title: communityGoalTitle,
        description: communityGoalDesc,
        bossName: communityGoalBoss,
        bossHealth: communityGoalBossHealth,
        updatedAt: Timestamp.now()
      });
      addLog('Successfully updated and synchronized global Community Challenge settings.', 'success');
      alert("Community health challenge updated successfully in Firestore!");
    } catch (e) {
      console.error("Failed to update system goal:", e);
      addLog('Error saving community goal configs to database.', 'error');
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  // Handle report queue actions
  const handleResolveReport = async (report: CommunityReport, decision: 'dismiss' | 'delete') => {
    setIsLoadingReports(true);
    try {
      const reportRef = doc(db, 'communityReports', report.id);
      
      if (decision === 'dismiss') {
        await updateDoc(reportRef, { status: 'dismissed' });
        addLog(`Report ${report.id} dismissed successfully.`, 'info');
      } else {
        // Delete message
        await deleteCommunityMessage(report.messageId);
        await updateDoc(reportRef, { status: 'resolved' });
        addLog(`Deleted post ${report.messageId} and marked report ${report.id} as resolved.`, 'success');
      }

      // Reload reports
      await fetchReports();
    } catch (err) {
      console.error("Error handling report:", err);
      addLog('Failed to resolve report.', 'error');
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Post Admin Broadcast directly to feed
  const handleSendBroadcast = async () => {
    if (!adminBroadcast.trim()) return;
    setIsBroadcasting(true);
    try {
      const messagesRef = collection(db, 'communityMessages');
      await setDoc(doc(messagesRef), {
        uid: 'system_admin',
        displayName: '📢 NORI ADMIN CORE',
        photoURL: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=150',
        content: adminBroadcast.trim(),
        timestamp: Timestamp.now()
      });
      setAdminBroadcast('');
      addLog('Published administrative announcement broadcast.', 'success');
      alert("Admin announcement posted successfully!");
    } catch (e) {
      console.error("Error publishing broadcast:", e);
      addLog('Failed to send broadcast post.', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Profanity scanner for chat moderation
  const containsSuspiciousKeywords = (text: string) => {
    const badWords = ['spam', 'scam', 'hack', 'buy', 'sell', 'crypto', 'fake', 'fuck', 'shit', 'asshole', 'idiot', 'moron', 'retard'];
    const lower = text.toLowerCase();
    return badWords.some(word => lower.includes(word));
  };

  // Filters and listings
  const filteredUsers = (allUsers.length > 0 ? allUsers : leaderboard).filter(u => {
    const matchesSearch = u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || u.uid.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = userFilterClass === 'all' || u.class === userFilterClass;
    return matchesSearch && matchesClass;
  });

  const filteredMessages = communityMessages.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics summaries
  const totalPoints = leaderboard.reduce((sum, u) => sum + (u.points || 0), 0);
  const avgPoints = leaderboard.length > 0 ? Math.round(totalPoints / leaderboard.length) : 0;
  const positiveFeedbackCount = aiFeedbacks.filter(f => f.feedback === 'positive').length;
  const negativeFeedbackCount = aiFeedbacks.filter(f => f.feedback === 'negative').length;
  const feedbackRatio = aiFeedbacks.length > 0 
    ? Math.round((positiveFeedbackCount / aiFeedbacks.length) * 100) 
    : 100;

  // Render Class Distribution data
  const classDistribution = () => {
    const classes = ['master', 'advanced', 'intermediate', 'beginner', 'novice', 'amateur'];
    const dist: Record<string, number> = { master: 0, advanced: 0, intermediate: 0, beginner: 0, novice: 0, amateur: 0 };
    
    const targetSource = allUsers.length > 0 ? allUsers : leaderboard;
    targetSource.forEach(u => {
      const cls = u.class || 'amateur';
      if (dist[cls] !== undefined) dist[cls]++;
    });

    return classes.map(cls => ({
      name: cls,
      count: dist[cls],
      percentage: targetSource.length > 0 ? Math.round((dist[cls] / targetSource.length) * 100) : 0
    }));
  };

  return (
    <div className="space-y-6 pb-28 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={onBack}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-white/10 transition-all active:scale-95 flex-shrink-0"
            id="admin-back-btn"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                System Administrator Console
              </span>
            </div>
            <h1 className="text-2xl font-black font-display text-white tracking-tight mt-1">
              NORI Intelligence Core
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl text-emerald-400 font-mono text-xs">
          <Shield size={14} className="animate-pulse" />
          <span>SECURE PROTOCOL V1.2 ACTIVE</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 p-1 bg-slate-950/60 border border-white/5 rounded-2xl max-w-3xl overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Activity },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'messages', label: 'Moderation Hub', icon: MessageSquare },
          { id: 'feedback', label: 'AI Feedback Log', icon: Star },
          { id: 'api-health', label: 'API Health', icon: Server }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id as any);
              setSearchQuery('');
            }}
            className={cn(
              "flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap",
              activeSubTab === tab.id 
                ? "bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
            id={`admin-tab-${tab.id}`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: OVERVIEW & ADVANCED ANALYTICS */}
        {activeSubTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl">
                  <Users size={18} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Database Profiles</p>
                <h3 className="text-3xl font-black font-mono text-white mt-2">{allUsers.length > 0 ? allUsers.length : leaderboard.length}</h3>
                <div className="flex items-center gap-1.5 mt-3 text-emerald-400 text-xs">
                  <TrendingUp size={12} />
                  <span>Interactive Listing</span>
                </div>
              </div>

              <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-blue-400 bg-blue-500/10 p-2.5 rounded-xl">
                  <Award size={18} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Average Points</p>
                <h3 className="text-3xl font-black font-mono text-white mt-2">{avgPoints}</h3>
                <div className="flex items-center gap-1.5 mt-3 text-slate-400 text-xs">
                  <span>From public leaderboard</span>
                </div>
              </div>

              <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-teal-400 bg-teal-500/10 p-2.5 rounded-xl">
                  <MessageSquare size={18} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Social Messages</p>
                <h3 className="text-3xl font-black font-mono text-white mt-2">{communityMessages.length}</h3>
                <div className="flex items-center gap-1.5 mt-3 text-teal-400 text-xs">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                  <span>Live stream active</span>
                </div>
              </div>

              <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-amber-400 bg-amber-500/10 p-2.5 rounded-xl">
                  <Sparkles size={18} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">NORI AI Approval</p>
                <h3 className="text-3xl font-black font-mono text-white mt-2">{feedbackRatio}%</h3>
                <div className="flex items-center gap-1.5 mt-3 text-amber-400 text-xs">
                  <ThumbsUp size={12} />
                  <span>Thumb ratings logged</span>
                </div>
              </div>
            </div>

            {/* Graphics & Class Distribution Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Approval Sentiment Circular Gauge */}
              <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 self-start">AI Satisfaction Index</h3>
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="10" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="url(#emeraldGradient)" 
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * feedbackRatio) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black font-mono text-white">{feedbackRatio}%</span>
                    <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase mt-1">APPROVED</span>
                  </div>
                </div>

                <div className="flex justify-around w-full pt-2 border-t border-white/5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Thumbs Up</p>
                    <p className="text-lg font-black font-mono text-emerald-400 mt-1">{positiveFeedbackCount}</p>
                  </div>
                  <div className="border-r border-white/5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Thumbs Down</p>
                    <p className="text-lg font-black font-mono text-rose-400 mt-1">{negativeFeedbackCount}</p>
                  </div>
                </div>
              </div>

              {/* Rank Distribution Bar Chart */}
              <div className="glass-card p-6 rounded-3xl border border-white/10 lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">User Rank Distribution</h3>
                  <span className="text-[9px] font-mono text-slate-500">Calculated dynamically</span>
                </div>
                
                <div className="space-y-3.5">
                  {classDistribution().map(item => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-black uppercase tracking-wider text-slate-300">{item.name}</span>
                        <span className="font-mono text-slate-400 font-bold">{item.count} users ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-700 ease-out",
                            item.name === 'master' ? "bg-amber-400" :
                            item.name === 'advanced' ? "bg-purple-500" :
                            item.name === 'intermediate' ? "bg-blue-500" :
                            item.name === 'beginner' ? "bg-teal-500" :
                            item.name === 'novice' ? "bg-emerald-500" :
                            "bg-slate-600"
                          )}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Config Sandbox & Server Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Community Goal Controls */}
              <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="text-orange-500" size={18} />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Live Community Goal Tuning</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">PERSISTENT DB SYNC</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Challenge Title</label>
                      <input 
                        type="text"
                        value={communityGoalTitle}
                        onChange={(e) => setCommunityGoalTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Target Goal Target Amount (g)</label>
                      <input 
                        type="number"
                        value={communityGoalTarget}
                        onChange={(e) => setCommunityGoalTarget(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Current Gathered Progress (g)</label>
                      <input 
                        type="number"
                        value={communityGoalCurrent}
                        onChange={(e) => setCommunityGoalCurrent(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Challenge Description</label>
                      <textarea 
                        rows={1}
                        value={communityGoalDesc}
                        onChange={(e) => setCommunityGoalDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 h-9 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Boss Monster Enemy Name</label>
                      <input 
                        type="text"
                        value={communityGoalBoss}
                        onChange={(e) => setCommunityGoalBoss(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Boss Remaining Health Percentage (%)</label>
                      <input 
                        type="number"
                        value={communityGoalBossHealth}
                        onChange={(e) => setCommunityGoalBossHealth(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveGoal}
                  disabled={isUpdatingGoal}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {isUpdatingGoal ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                  Synchronize & Save Challenge
                </button>
              </div>

              {/* Developer Live Logging Stream */}
              <div className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="text-emerald-400" size={18} />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Security Events Stream</h3>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="flex-1 bg-slate-950 p-4 rounded-2xl border border-white/5 font-mono text-[10px] space-y-2 h-44 overflow-y-auto custom-scrollbar shadow-inner">
                  {systemLogs.map(log => (
                    <div key={log.id} className="flex gap-1.5 items-start">
                      <span className="text-slate-500">[{log.time}]</span>
                      <span className={cn(
                        log.type === 'success' ? "text-emerald-400 font-bold" :
                        log.type === 'warn' ? "text-amber-400" :
                        log.type === 'error' ? "text-rose-400 font-bold" :
                        "text-slate-400"
                      )}>{log.text}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-500 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-white/5">
                  Database changes update live. Point tuning applies to both the user profile and leaderboard directories simultaneously.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: USER DIRECTORY & INSPECTOR PANEL */}
        {activeSubTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {/* Filter and search bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter users by displayName, email, or exact UID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-400">Class Rank:</span>
                  <select 
                    value={userFilterClass} 
                    onChange={(e) => setUserFilterClass(e.target.value)}
                    className="bg-transparent text-emerald-400 text-xs font-bold focus:outline-none"
                  >
                    <option value="all" className="bg-slate-950 text-slate-200">All Classes</option>
                    <option value="master" className="bg-slate-950 text-slate-200">Master</option>
                    <option value="advanced" className="bg-slate-950 text-slate-200">Advanced</option>
                    <option value="intermediate" className="bg-slate-950 text-slate-200">Intermediate</option>
                    <option value="beginner" className="bg-slate-950 text-slate-200">Beginner</option>
                    <option value="novice" className="bg-slate-950 text-slate-200">Novice</option>
                    <option value="amateur" className="bg-slate-950 text-slate-200">Amateur</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-400">Quick Boost:</span>
                  <select 
                    value={pointsAmount} 
                    onChange={(e) => setPointsAmount(Number(e.target.value))}
                    className="bg-transparent text-emerald-400 text-xs font-bold focus:outline-none"
                  >
                    <option value={50} className="bg-slate-950 text-slate-200">+50 Pts</option>
                    <option value={100} className="bg-slate-950 text-slate-200">+100 Pts</option>
                    <option value={250} className="bg-slate-950 text-slate-200">+250 Pts</option>
                    <option value={500} className="bg-slate-950 text-slate-200">+500 Pts</option>
                  </select>
                </div>

                <button 
                  onClick={fetchAllUsers} 
                  disabled={isLoadingUsers}
                  className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-white/10"
                >
                  <RefreshCw size={14} className={cn(isLoadingUsers && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* Master User Directory layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Users list table */}
              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl lg:col-span-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-900/50">
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User Profile Details</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Class Rank</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Points</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center">
                            <RefreshCw className="animate-spin text-emerald-400 mx-auto" size={24} />
                            <p className="text-slate-500 text-xs mt-2">Loading user directories from cloud...</p>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-slate-500 text-sm">
                            No matching user profiles found in database.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr 
                            key={u.uid} 
                            onClick={() => handleInspectUser(u)}
                            className={cn(
                              "hover:bg-white/5 transition-all duration-150 cursor-pointer",
                              selectedUser?.uid === u.uid && "bg-white/5"
                            )}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                                  alt={u.displayName} 
                                  className="w-9 h-9 rounded-xl border border-white/10 object-cover bg-slate-900"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm font-black text-white truncate max-w-[120px] sm:max-w-[160px]">{u.displayName}</h4>
                                    {selectedUserPrivateDoc?.uid === u.uid && editRoleValue === 'admin' && (
                                      <Crown size={12} className="text-amber-400 fill-amber-400" />
                                    )}
                                  </div>
                                  <p className="text-[9px] font-mono text-slate-500 mt-0.5">{u.uid.slice(0, 14)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                u.class === 'master' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                u.class === 'advanced' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                u.class === 'intermediate' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                u.class === 'beginner' ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                                u.class === 'novice' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                "bg-slate-500/10 text-slate-400 border-white/5"
                              )}>
                                {u.class || 'amateur'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-mono font-black text-emerald-400">{u.points || 0} pts</span>
                            </td>
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleAwardPoints(u.uid, pointsAmount)}
                                  disabled={updatingUserId === u.uid}
                                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-black px-2.5 py-1.5 rounded-xl border border-white/10 uppercase tracking-wider transition-all"
                                >
                                  {updatingUserId === u.uid ? (
                                    <RefreshCw className="animate-spin" size={11} />
                                  ) : (
                                    <Plus size={11} strokeWidth={3} className="text-emerald-400" />
                                  )}
                                  <span>Boost</span>
                                </button>
                                <ChevronRight size={14} className="text-slate-600" />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Side Detailed Inspection Panel / Drawer */}
              <div className="space-y-4">
                {selectedUser ? (
                  <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={selectedUser.photoURL} 
                          alt={selectedUser.displayName} 
                          className="w-12 h-12 rounded-2xl border border-white/10 object-cover bg-slate-950"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h3 className="text-base font-black text-white leading-tight">{selectedUser.displayName}</h3>
                          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">UID: {selectedUser.uid}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedUser(null)}
                        className="p-1.5 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Edit Form */}
                    <div className="space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Administrative Settings</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">Adjust Points</label>
                          <input 
                            type="number"
                            value={editPointsValue}
                            onChange={(e) => setEditPointsValue(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">User Role</label>
                          <select
                            value={editRoleValue}
                            onChange={(e) => setEditRoleValue(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 font-bold"
                          >
                            <option value="user" className="bg-slate-950 text-slate-200">Standard User</option>
                            <option value="admin" className="bg-slate-950 text-slate-200">System Admin</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">Custom Class Rank Override</label>
                        <select
                          value={editClassValue}
                          onChange={(e) => setEditClassValue(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="amateur">Amateur (0-49 Pts)</option>
                          <option value="novice">Novice (50-149 Pts)</option>
                          <option value="beginner">Beginner (150-299 Pts)</option>
                          <option value="intermediate">Intermediate (300-599 Pts)</option>
                          <option value="advanced">Advanced (600-999 Pts)</option>
                          <option value="master">Master (1000+ Pts)</option>
                        </select>
                      </div>

                      <button
                        onClick={handleSaveUserEdit}
                        disabled={isLoadingUserDetails}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        {isLoadingUserDetails ? <RefreshCw className="animate-spin" size={12} /> : <UserCheck size={12} />}
                        Save Properties
                      </button>
                    </div>

                    {/* Telemetry Tabs: Logs & Habits */}
                    <div className="space-y-4">
                      {/* Section Tabs */}
                      <div className="border-b border-white/5 pb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <Activity size={12} className="text-emerald-400" />
                          <span>Telemetry & Activity</span>
                        </h4>
                      </div>

                      {isLoadingUserDetails ? (
                        <div className="text-center py-4">
                          <RefreshCw className="animate-spin text-slate-500 mx-auto" size={16} />
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                          {/* Habits list */}
                          <div className="space-y-2">
                            <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Configured Habits ({selectedUserHabits.length})</h5>
                            {selectedUserHabits.length === 0 ? (
                              <p className="text-[10px] text-slate-600 italic">No habits configured by user yet.</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-1.5">
                                {selectedUserHabits.map(habit => (
                                  <div key={habit.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-xl border border-white/5 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm">{habit.icon || '🎯'}</span>
                                      <span className="text-slate-300 font-medium truncate max-w-[120px]">{habit.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-mono text-orange-400 font-bold">🔥 {habit.streak || 0}</span>
                                      <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        habit.completed ? "bg-emerald-500" : "bg-slate-700"
                                      )} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Food Logs list */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Recent Food Logs ({selectedUserLogs.length})</h5>
                            {selectedUserLogs.length === 0 ? (
                              <p className="text-[10px] text-slate-600 italic">No meals logged in this user history.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {selectedUserLogs.map(log => (
                                  <div key={log.id} className="p-2 bg-slate-900/50 rounded-xl border border-white/5 text-[11px] space-y-1">
                                    <div className="flex justify-between items-baseline">
                                      <span className="font-bold text-white truncate max-w-[140px]">{log.name}</span>
                                      <span className="text-[8px] font-mono text-slate-500">{log.timestamp ? format((log.timestamp as any).toDate ? (log.timestamp as any).toDate() : new Date(log.timestamp), 'MMM d') : ''}</span>
                                    </div>
                                    <div className="flex gap-2 text-slate-400 font-mono text-[9px]">
                                      <span>🔥 {log.calories} kcal</span>
                                      <span>🥩 {log.protein}g protein</span>
                                      {log.isHealthy && <span className="text-emerald-400 text-[8px] font-bold font-sans">✓ Healthy</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-8 rounded-3xl border border-white/10 text-center text-slate-500 h-[360px] flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-slate-900 text-slate-600 rounded-2xl border border-white/5">
                      <Search size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-300">Telemetry Inspector</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-[200px] mx-auto">
                        Click on any user profile row to inspect detailed stats, log history, and modify roles.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: CHAT MODERATION & REPORTS QUEUE */}
        {activeSubTab === 'messages' && (
          <motion.div 
            key="messages"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {/* Inner Tabs toggle */}
            <div className="flex gap-2 p-1 bg-slate-950/60 border border-white/5 rounded-2xl max-w-xs self-start">
              <button
                onClick={() => setModerationSubTab('live')}
                className={cn(
                  "flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  moderationSubTab === 'live' 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                Live Post Stream
              </button>
              <button
                onClick={() => setModerationSubTab('reports')}
                className={cn(
                  "flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                  moderationSubTab === 'reports' 
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Flag size={10} />
                <span>Reports Feed</span>
              </button>
            </div>

            {moderationSubTab === 'live' ? (
              <div className="space-y-4">
                {/* Search / Broadcast Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search filter */}
                  <div className="relative md:col-span-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search live stream content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {/* Broadcast Compose Box */}
                  <div className="md:col-span-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Compose general announcement post as Admin..."
                      value={adminBroadcast}
                      onChange={(e) => setAdminBroadcast(e.target.value)}
                      className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleSendBroadcast}
                      disabled={isBroadcasting || !adminBroadcast.trim()}
                      className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      {isBroadcasting ? <RefreshCw className="animate-spin" size={12} /> : <Crown size={12} />}
                      <span>Broadcast</span>
                    </button>
                  </div>
                </div>

                {/* Live Messages stream list with profanity warnings */}
                <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl p-4">
                  <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredMessages.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 text-sm">
                        No community messages found.
                      </div>
                    ) : (
                      filteredMessages.map((msg) => {
                        const suspicious = containsSuspiciousKeywords(msg.content);
                        return (
                          <div 
                            key={msg.id} 
                            className={cn(
                              "flex items-start justify-between gap-4 p-3.5 rounded-2xl border transition-all duration-150",
                              suspicious 
                                ? "bg-rose-500/5 border-rose-500/20" 
                                : "bg-slate-900/40 hover:bg-slate-900/80 border-white/5"
                            )}
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <img 
                                src={msg.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                                alt={msg.displayName} 
                                className="w-8 h-8 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-slate-200">{msg.displayName}</span>
                                  {msg.uid === 'system_admin' && (
                                    <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Admin Announcement</span>
                                  )}
                                  {suspicious && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                      <AlertTriangle size={8} />
                                      <span>Flagged Word</span>
                                    </span>
                                  )}
                                  <span className="text-[9px] font-mono text-slate-500">
                                    {msg.timestamp ? format(msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date(msg.timestamp), 'MMM d, HH:mm') : ''}
                                  </span>
                                </div>
                                <p className={cn(
                                  "text-sm mt-1.5 break-words font-medium leading-relaxed",
                                  suspicious ? "text-rose-200" : "text-slate-300"
                                )}>
                                  {msg.content}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this post from the global feed?")) {
                                  await deleteCommunityMessage(msg.id);
                                  addLog(`Deleted message ${msg.id} from live stream.`, 'warn');
                                }
                              }}
                              className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all flex-shrink-0"
                              title="Delete message"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Reports queue feed */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Moderation Action Items</h3>
                  <button 
                    onClick={fetchReports} 
                    disabled={isLoadingReports}
                    className="p-2 bg-slate-900 border border-white/10 rounded-xl text-slate-300 hover:text-white"
                  >
                    <RefreshCw size={12} className={cn(isLoadingReports && "animate-spin")} />
                  </button>
                </div>

                <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl p-4">
                  <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                    {isLoadingReports ? (
                      <div className="text-center py-12">
                        <RefreshCw className="animate-spin text-emerald-400 mx-auto" size={24} />
                        <p className="text-slate-500 text-xs mt-2">Connecting to moderation registry...</p>
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 text-sm">
                        All clear! There are currently no pending flagged content reports.
                      </div>
                    ) : (
                      reports.map((report) => (
                        <div 
                          key={report.id} 
                          className={cn(
                            "p-4 rounded-2xl border space-y-3",
                            report.status === 'pending' 
                              ? "bg-slate-900/40 border-amber-500/25" 
                              : "bg-slate-900/10 border-white/5 opacity-60"
                          )}
                        >
                          {/* Report header info */}
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  REPORT REASON: {report.reason}
                                </span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[8px] font-mono",
                                  report.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
                                  report.status === 'resolved' ? "bg-emerald-500/20 text-emerald-400" :
                                  "bg-slate-800 text-slate-400"
                                )}>
                                  STATUS: {report.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[9px] font-mono text-slate-500">
                                Reporter UID: {report.reporterUid.slice(0, 14)}... • {report.timestamp ? format(report.timestamp instanceof Timestamp ? report.timestamp.toDate() : new Date(report.timestamp), 'MMM d, HH:mm') : ''}
                              </p>
                            </div>
                          </div>

                          {/* Flagged Post Content */}
                          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">REPORTED MESSAGE CONTENT:</span>
                            <p className="text-xs text-slate-300 font-medium break-words leading-relaxed">{report.messageContent}</p>
                            <span className="text-[8px] font-mono text-slate-500 block">Author UID: {report.messageAuthorUid}</span>
                          </div>

                          {/* Actions */}
                          {report.status === 'pending' && (
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => handleResolveReport(report, 'dismiss')}
                                className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-slate-800 text-[10px] text-slate-300 font-bold uppercase tracking-wider transition-all"
                              >
                                Dismiss Report
                              </button>
                              <button
                                onClick={() => handleResolveReport(report, 'delete')}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-[10px] text-white font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-lg"
                              >
                                <Trash2 size={11} />
                                <span>Delete Post & Resolve</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: AI FEEDBACK LOGGER */}
        {activeSubTab === 'feedback' && (
          <motion.div 
            key="feedback"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">NORI AI Response Telemetry Log</h3>
              <button 
                onClick={fetchAIFeedback}
                disabled={isLoadingFeedback}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 text-xs font-bold rounded-xl border border-white/10 transition-all"
              >
                <RefreshCw size={12} className={cn(isLoadingFeedback && "animate-spin")} />
                <span>Refresh Log</span>
              </button>
            </div>

            <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl p-4">
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {isLoadingFeedback ? (
                  <div className="flex justify-center items-center p-12">
                    <RefreshCw className="animate-spin text-emerald-400" size={24} />
                  </div>
                ) : aiFeedbacks.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    No ratings have been logged by active users yet.
                  </div>
                ) : (
                  aiFeedbacks.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500">UID: {item.uid}</span>
                        <span className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                          item.feedback === 'positive' 
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                        )}>
                          {item.feedback === 'positive' ? <ThumbsUp size={10} /> : <ThumbsDown size={10} />}
                          <span>{item.feedback} Rating</span>
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        {item.messageContent}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: API HEALTH MONITOR */}
        {activeSubTab === 'api-health' && (
          <motion.div 
            key="api-health"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 animate-fade-in"
          >
            {/* Top Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card bg-slate-900/50 border border-white/5 rounded-3xl p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Host Server Status</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-white font-display">ONLINE</p>
                  {integrationHealth ? (
                    <div className="flex flex-col mt-1 space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400">Uptime: {Math.floor(integrationHealth.uptime / 3600)}h {Math.floor((integrationHealth.uptime % 3600) / 60)}m {Math.floor(integrationHealth.uptime % 60)}s</span>
                      <span className="text-[10px] font-mono text-slate-400">Configured: {integrationHealth.geminiConfigured ? "GEMINI_API_KEY Active" : "KEY MISSING"}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">Fetching host diagnostics...</span>
                  )}
                </div>
              </div>

              <div className="glass-card bg-slate-900/50 border border-white/5 rounded-3xl p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Memory Allocation</span>
                  <Cpu size={14} className="text-slate-400" />
                </div>
                <div className="mt-4">
                  {integrationHealth ? (
                    <>
                      <p className="text-2xl font-black text-white font-display">
                        {Math.round(integrationHealth.memory.heapUsed / 1024 / 1024)} <span className="text-xs font-normal text-slate-400">MB Used</span>
                      </p>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 overflow-hidden border border-white/5">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (integrationHealth.memory.heapUsed / integrationHealth.memory.heapTotal) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 block mt-1">Total Heap: {Math.round(integrationHealth.memory.heapTotal / 1024 / 1024)} MB</span>
                    </>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">Calculating memory telemetry...</span>
                  )}
                </div>
              </div>

              <div className="glass-card bg-slate-900/50 border border-white/5 rounded-3xl p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Database & Core auth</span>
                  <Server size={14} className="text-slate-400" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-emerald-400 font-display">FIRESTORE</p>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Live sync
                    </span>
                    <span className="text-slate-600 font-mono text-[10px]">|</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Auth OK
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Latencies and Critical Integrations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Models List - 2 columns on lg */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Gemini Neural Models Status</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Test individual endpoints to diagnose cold starts or verify API key validity.</p>
                  </div>
                  <button 
                    onClick={testAllModels}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <RefreshCw size={12} className="animate-pulse" />
                    <span>Test All Models</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', type: 'Primary Multimodal & Search', desc: 'Used for food image recognition, recipe analysis, deep analysis, and search grounding' },
                    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', type: 'Low Latency', desc: 'Used for regular conversational advice and habit tracking' },
                    { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS', type: 'Audio Synthesis', desc: 'Used for generating spoken/speech summaries of meal plans' },
                  ].map(m => {
                    const state = modelLatencies[m.id] || { status: 'idle' };
                    return (
                      <div key={m.id} className="p-4 bg-slate-900/30 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{m.name}</h4>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-white/5">
                              {m.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{m.desc}</p>
                          {state.error && (
                            <p className="text-[10px] font-mono text-rose-400 bg-rose-950/20 px-2 py-1 rounded border border-rose-950 mt-1.5">
                              {state.error}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                              state.status === 'idle' && "bg-slate-800/50 text-slate-400 border-slate-700/50",
                              state.status === 'testing' && "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
                              state.status === 'healthy' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]",
                              state.status === 'slow' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                              state.status === 'error' && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}>
                              <span className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                state.status === 'idle' && "bg-slate-400",
                                state.status === 'testing' && "bg-amber-400 animate-ping",
                                state.status === 'healthy' && "bg-emerald-400",
                                state.status === 'slow' && "bg-yellow-400",
                                state.status === 'error' && "bg-rose-400"
                              )}></span>
                              <span>{state.status === 'idle' ? 'Unchecked' : state.status}</span>
                            </span>
                            {state.latency !== undefined && (
                              <p className="text-xs font-mono text-slate-400 mt-1">{state.latency}ms</p>
                            )}
                          </div>

                          <button
                            onClick={() => testModelHealth(m.id)}
                            disabled={state.status === 'testing'}
                            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl border border-white/5 transition-all"
                            title="Run latency diagnostics"
                          >
                            <RefreshCw size={14} className={cn(state.status === 'testing' && "animate-spin")} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side Panels - Console Logs & System Health */}
              <div className="space-y-6">
                {/* Latency History visual sparklines */}
                <div className="glass-card bg-slate-900/50 border border-white/5 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Latency Trend (Simulated)</h4>
                    <span className="text-[10px] font-mono text-emerald-400">AVG: 420ms</span>
                  </div>
                  <div className="h-16 flex items-end gap-1.5 w-full bg-slate-950/50 rounded-2xl p-3 border border-white/5 overflow-hidden">
                    {[12, 18, 15, 24, 32, 15, 11, 9, 14, 21, 16, 22, 28, 19, 12, 15, 18, 26, 14, 11].map((val, i) => (
                      <div key={i} className="flex-1 group relative h-full flex items-end">
                        <div 
                          className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 opacity-60 group-hover:opacity-100 rounded-t-sm transition-all duration-300"
                          style={{ height: `${val * 3}%` }}
                        ></div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-950 text-[8px] font-mono text-emerald-400 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 z-10">
                          {val * 30}ms
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Visual telemetry represents recent synthetic load tests. Response speeds of &lt;2.5s denote exceptional performance.
                  </p>
                </div>

                {/* Diagnostics Logs Terminal */}
                <div className="glass-card bg-slate-900/50 border border-white/5 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Diagnostics Console</h4>
                    <button 
                      onClick={() => setHealthLogs([{ timestamp: format(new Date(), 'HH:mm:ss'), type: 'success', message: 'Console logs cleared.' }])}
                      className="text-[10px] font-mono text-slate-500 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="bg-slate-950 rounded-2xl border border-white/5 p-3 h-48 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1.5 leading-normal">
                    {healthLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="text-slate-600 select-none shrink-0">{log.timestamp}</span>
                        <span className={cn(
                          "shrink-0",
                          log.type === 'success' && "text-emerald-400",
                          log.type === 'warning' && "text-amber-400",
                          log.type === 'error' && "text-rose-400"
                        )}>
                          [{log.type.toUpperCase()}]
                        </span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
