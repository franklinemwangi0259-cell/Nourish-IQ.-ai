import { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Activity, 
  Plus, 
  Camera, 
  MessageSquare, 
  CheckCircle2, 
  Utensils, 
  Droplets, 
  TrendingUp,
  History,
  Settings,
  X,
  Send,
  Loader2,
  ChevronRight,
  User,
  Zap,
  LogOut,
  ChefHat,
  Save,
  ArrowLeft,
  Coffee,
  Mail,
  Lock,
  Brain,
  Search,
  Volume2,
  Mic,
  MicOff,
  Users,
  Trophy,
  ShieldAlert,
  Bell,
  SkipForward,
  Info,
  TrendingDown,
  Share2,
  Leaf,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Smile,
  Check,
  Flag,
  Heart,
  RefreshCw,
  Upload,
  Eye,
  Star,
  Shield,
  Swords,
  Crown,
  Flame,
  Target,
  GripVertical,
  Refrigerator,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { format, subDays } from 'date-fns';
import Markdown from 'react-markdown';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  addDoc,
  Timestamp,
  getDocFromServer,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { cn } from './lib/utils';
import { 
  analyzeFoodImage, 
  getNutritionAdvice, 
  analyzeRecipe, 
  getComplexNutritionAdvice, 
  searchNutritionInfo, 
  generateSpeech,
  generateNotifications,
  generateRecipeFromIngredients,
  remixMeal
} from './lib/gemini';
import { auth, signInWithGoogle, logout, db, createUserWithEmailAndPassword, signInWithEmailAndPassword } from './lib/firebase';
import type { FoodLog, Habit, ChatMessage, DailyStats, UserProfile, PublicProfile, CommunityMessage, Achievement, PrivateChat, PrivateMessage, FriendRequest } from './types';
import React from 'react';

const INITIAL_HABITS: Habit[] = [
  { id: '1', name: 'Drink 2L Water', completed: false, streak: 5, icon: 'Droplets', uid: '', order: 0 },
  { id: '2', name: 'Eat 3 Servings of Veggies', completed: false, streak: 3, icon: 'Utensils', uid: '', order: 1 },
  { id: '3', name: 'No Processed Sugar', completed: false, streak: 12, icon: 'Zap', uid: '', order: 2 },
  { id: '4', name: '10,000 Steps', completed: false, streak: 7, icon: 'Footprints', uid: '', order: 3 },
  { id: '5', name: '8 Hours Sleep', completed: false, streak: 4, icon: 'Moon', uid: '', order: 4 },
  { id: '6', name: '15 Min Meditation', completed: false, streak: 2, icon: 'Brain', uid: '', order: 5 },
  { id: '7', name: 'Read 10 Pages', completed: false, streak: 1, icon: 'BookOpen', uid: '', order: 6 },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_log', title: 'First Bite', description: 'Log your first food item', icon: 'Utensils', requirement: 'first_log', points: 20 },
  { id: 'first_habit', title: 'Getting Started', description: 'Create your first habit', icon: 'Plus', requirement: 'first_habit', points: 20 },
  { id: 'first_social', title: 'Say Hello', description: 'Send your first community message', icon: 'MessageSquare', requirement: 'first_social', points: 20 },
  { id: 'water_7', title: 'Hydration Hero', description: '7-day water intake streak', icon: 'Droplets', requirement: 'water_streak_7', points: 50 },
  { id: 'water_20', title: 'Hydration Master', description: '20-day water intake streak', icon: 'Droplets', requirement: 'water_streak_20', points: 150 },
  { id: 'cal_30', title: 'Calorie King', description: 'Consistently hitting calorie goals for a month', icon: 'Zap', requirement: 'cal_goal_30', points: 250 },
  { id: 'perfect_day', title: 'Perfect Day', description: 'Complete all habits in a single day', icon: 'Star', requirement: 'perfect_day', points: 50 },
  { id: 'habit_7', title: 'Habit Starter', description: 'Complete 7 habits in a row', icon: 'CheckCircle2', requirement: 'habit_streak_7', points: 50 },
  { id: 'habit_10', title: 'Habit Master', description: 'Complete 10 habits in a row', icon: 'CheckCircle2', requirement: 'habit_streak_10', points: 100 },
  { id: 'habit_30', title: 'Habit Legend', description: 'Complete 30 habits in a row', icon: 'CheckCircle2', requirement: 'habit_streak_30', points: 300 },
  { id: 'social_10', title: 'Social Butterfly', description: 'Send 10 community messages', icon: 'Users', requirement: 'social_10', points: 50 },
  { id: 'social_50', title: 'Community Pillar', description: 'Send 50 community messages', icon: 'Users', requirement: 'social_50', points: 150 },
  { id: 'log_50', title: 'Log Master', description: 'Log 50 food items', icon: 'History', requirement: 'log_50', points: 100 },
  { id: 'log_100', title: 'Nutrition Expert', description: 'Log 100 food items', icon: 'History', requirement: 'log_100', points: 250 },
  { id: 'points_1000', title: 'Point Collector', description: 'Reach 1000 points', icon: 'Trophy', requirement: 'points_1000', points: 200 },
  { id: 'points_5000', title: 'Point Master', description: 'Reach 5000 points', icon: 'Crown', requirement: 'points_5000', points: 500 },
];

export const USER_CLASSES = [
  { id: 'novice', name: 'Novice Class', minPoints: 0, minStreak: 0, icon: 'Star', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
  { id: 'amateur', name: 'Amateur Class', minPoints: 100, minStreak: 1, icon: 'User', color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  { id: 'beginner', name: 'Beginner Class', minPoints: 300, minStreak: 3, icon: 'Shield', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { id: 'intermediate', name: 'Intermediate Class', minPoints: 800, minStreak: 7, icon: 'Swords', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  { id: 'advanced', name: 'Advanced Class', minPoints: 2000, minStreak: 15, icon: 'Crown', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { id: 'master', name: 'Master Class', minPoints: 5000, minStreak: 30, icon: 'Flame', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
];

export const calculateUserClass = (points: number, habits: Habit[]) => {
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  let currentClass = USER_CLASSES[0];
  for (let i = USER_CLASSES.length - 1; i >= 0; i--) {
    if (points >= USER_CLASSES[i].minPoints && maxStreak >= USER_CLASSES[i].minStreak) {
      currentClass = USER_CLASSES[i];
      break;
    }
  }
  
  const currentIndex = USER_CLASSES.findIndex(c => c.id === currentClass.id);
  const nextClass = currentIndex < USER_CLASSES.length - 1 ? USER_CLASSES[currentIndex + 1] : null;
  
  return { currentClass, nextClass, maxStreak };
};

const NUTRITION_TRENDS = [
  { id: 1, title: "Superfood Alert: Blueberries", description: "Rich in antioxidants, blueberries can improve heart health and brain function.", icon: "ChefHat" },
  { id: 2, title: "Hydration Tip", description: "Drinking water before meals can help with weight management and digestion.", icon: "Droplets" },
  { id: 3, title: "Protein Power", description: "Adding Greek yogurt to your breakfast can keep you full longer.", icon: "Zap" },
];

const VULGAR_WORDS = ['badword1', 'badword2', 'vulgar']; // Replace with a more comprehensive list if needed
const HABIT_ICONS = ['CheckCircle2', 'Droplets', 'Zap', 'Coffee', 'Leaf', 'Flame', 'Activity', 'Book', 'Moon', 'Sun'];

const filterProfanity = (text: string) => {
  let filtered = text;
  VULGAR_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
};

const DEFAULT_STATS: DailyStats = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  vitamins: [],
  waterIntake: 0,
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFat: 70,
  waterIntakeGoal: 2000,
};

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot3',
  'https://api.dicebear.com/7.x/micah/svg?seed=Micah1',
  'https://api.dicebear.com/7.x/micah/svg?seed=Micah2',
  'https://api.dicebear.com/7.x/micah/svg?seed=Micah3',
];

const AnimatedAvatar = ({ src, alt, className }: { src?: string | null, alt: string, className?: string }) => {
  const [expression, setExpression] = useState('');

  useEffect(() => {
    if (!src || !src.includes('dicebear.com/7.x/avataaars')) return;

    let isMounted = true;
    const expressions = [
      '',
      '&mouth=smile&eyes=happy',
      '&mouth=sad&eyes=cry',
      '&mouth=twinkle&eyes=wink',
      '&mouth=default&eyes=surprised',
      '&mouth=smile&eyes=hearts',
      '&mouth=grimace&eyes=squint'
    ];

    // Preload images to prevent flickering
    expressions.forEach(exp => {
      const img = new Image();
      img.src = `${src}${exp}`;
    });

    const animate = () => {
      if (!isMounted) return;
      const randomExp = expressions[Math.floor(Math.random() * expressions.length)];
      setExpression(randomExp);
      setTimeout(animate, 2000 + Math.random() * 4000);
    };

    const timeout = setTimeout(animate, 1000 + Math.random() * 2000);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [src]);

  const finalSrc = src ? (src.includes('dicebear.com/7.x/avataaars') ? `${src}${expression}` : src) : '';

  if (!finalSrc) return null;

  return <img src={finalSrc} alt={alt} className={className} referrerPolicy="no-referrer" />;
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
  }
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "{}");
        if (parsed.error) errorMessage = `Firestore Error: ${parsed.error}`;
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
            <X size={32} />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Oops!</h2>
          <p className="text-slate-500 mb-8 max-w-xs">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check if it's an offline error
  if (errorMessage.includes('client is offline') || errorMessage.includes('Could not reach Cloud Firestore backend')) {
    console.warn('Firestore offline:', errorMessage);
    return; // Don't throw, just log and continue
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

import { OnboardingWizard } from './components/OnboardingWizard';

const sendWelcomeEmail = async (email: string, name: string) => {
  if (!email) return;
  try {
    // NOTE: This requires the "Trigger Email" Firebase Extension to be installed
    // and configured to listen to the 'mail' collection.
    // https://extensions.dev/extensions/firebase/firestore-send-email
    const mailRef = collection(db, 'mail');
    await addDoc(mailRef, {
      to: email,
      message: {
        subject: "Welcome to Nourish IQ! 🎉 Your Journey Begins Here",
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #10b981; margin: 0;">Nourish IQ</h1>
            </div>
            <h2 style="color: #0f172a;">Congratulations on joining Nourish IQ, ${name}! 🎉</h2>
            <p style="line-height: 1.6;">We are absolutely thrilled to have you on board. You've just taken a massive step towards a healthier, smarter, and more vibrant lifestyle.</p>
            
            <h3 style="color: #10b981; margin-top: 30px;">What to Expect from Nourish IQ 🌟</h3>
            <p style="line-height: 1.6;">Nourish IQ isn't just another calorie tracker; it's your personal AI nutrition companion. Expect personalized insights, effortless meal logging via AI vision, and a gamified experience that makes hitting your health goals actually fun.</p>
            
            <h3 style="color: #10b981; margin-top: 30px;">Changes You Will Experience 🦋</h3>
            <ul style="line-height: 1.6;">
              <li><strong>Clarity:</strong> No more guessing what's in your food. Our AI breaks down macros and micronutrients instantly.</li>
              <li><strong>Consistency:</strong> With Daily Habits and Weekly Quests, you'll build routines that stick.</li>
              <li><strong>Vitality:</strong> By hitting your hydration and nutrition targets, expect more energy and better focus.</li>
            </ul>
            
            <h3 style="color: #10b981; margin-top: 30px;">How to Use Nourish IQ 🚀</h3>
            <ul style="line-height: 1.6;">
              <li>📸 <strong>Scan Meals:</strong> Tap the Camera icon to snap a picture of your food. NORI AI will analyze it and log it automatically!</li>
              <li>💬 <strong>Chat with NORI:</strong> Ask your AI companion for recipe ideas, nutrition facts, or just some motivation.</li>
              <li>💧 <strong>Track Habits:</strong> Log your water intake and complete your daily habits to earn points and maintain streaks.</li>
              <li>🏆 <strong>Compete & Connect:</strong> Join the Live Chat, add friends, and climb the Leaderboard.</li>
            </ul>
            
            <p style="line-height: 1.6; margin-top: 30px;">Ready to get started? Head back to the app and complete your first Weekly Quest!</p>
            <p style="line-height: 1.6; color: #64748b;">Stay healthy,<br/><strong>The Nourish IQ Team</strong></p>
          </div>
        `
      }
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};

export default function App() {
  return (
    <ErrorBoundary>
      <NourishIQ />
    </ErrorBoundary>
  );
}

function NourishIQ() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const isAdmin = user?.email === 'franklinemwangi0259@gmail.com';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'habits' | 'chat' | 'profile' | 'recipe' | 'community' | 'achievements'>('dashboard');
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([]);
  const [communityInput, setCommunityInput] = useState('');
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [stats, setStats] = useState<DailyStats>(DEFAULT_STATS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello! I'm NORI AI. How can I help you with your nutrition today?", timestamp: new Date() }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [recipeInput, setRecipeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [shouldSpeakResponse, setShouldSpeakResponse] = useState(false);
  const [showTrends, setShowTrends] = useState(true);
  const [currentTrendIndex, setCurrentTrendIndex] = useState(0);
  const [notifications, setNotifications] = useState(NUTRITION_TRENDS);
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>([]);
  const [activeChat, setActiveChat] = useState<PrivateChat | null>(null);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [communityTab, setCommunityTab] = useState<'chat' | 'messages' | 'friends' | 'leagues'>('chat');
  const [privateInput, setPrivateInput] = useState('');
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<PublicProfile[]>([]);
  const [feedback, setFeedback] = useState('');
  const [showClassModal, setShowClassModal] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [userLogCount, setUserLogCount] = useState(0);
  const [skippingHabit, setSkippingHabit] = useState<Habit | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [settingReminder, setSettingReminder] = useState<Habit | null>(null);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('CheckCircle2');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<PublicProfile | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<PublicProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<CommunityMessage | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [pointsToast, setPointsToast] = useState<{points: number, reason: string} | null>(null);
  const [shareContent, setShareContent] = useState<{title: string, text: string} | null>(null);
  const [viewingLog, setViewingLog] = useState<FoodLog | null>(null);
  
  // New Features State
  const [fridgeIngredients, setFridgeIngredients] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState<{title: string, description: string, ingredients: string[], instructions: string[], estimatedTime: string} | null>(null);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [remixedMealData, setRemixedMealData] = useState<{remixedName: string, description: string, calorieSaving: number, keyImprovement: string} | null>(null);
  const [leaderboard, setLeaderboard] = useState<PublicProfile[]>([]);
  const [communityGoal, setCommunityGoal] = useState({ current: 4500, target: 10000, title: "Community Protein Push", description: "Let's hit 10,000g of protein together this week!", bossName: "The Carb Crusher", bossHealth: 55 });
  const [isProactiveInsightLoading, setIsProactiveInsightLoading] = useState(false);
  const [proactiveInsight, setProactiveInsight] = useState<string | null>(null);
  const [recipeTab, setRecipeTab] = useState<'analyze' | 'fridge'>('analyze');

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const userClassData = calculateUserClass(profile?.points || 0, habits);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateNotifications = async () => {
      const lastUpdate = localStorage.getItem('last_notification_update');
      const now = Date.now();
      const threeHours = 3 * 60 * 60 * 1000;

      if (!lastUpdate || now - parseInt(lastUpdate) > threeHours) {
        try {
          const newNotifications = await generateNotifications();
          if (newNotifications && newNotifications.length > 0) {
            setNotifications(newNotifications);
            localStorage.setItem('notifications_content', JSON.stringify(newNotifications));
            localStorage.setItem('last_notification_update', now.toString());
          }
        } catch (error) {
          console.error("Failed to update notifications:", error);
        }
      } else {
        const savedNotifications = localStorage.getItem('notifications_content');
        if (savedNotifications) {
          setNotifications(JSON.parse(savedNotifications));
        }
      }
    };

    updateNotifications();
    const interval = setInterval(updateNotifications, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate trend index every 8 seconds
  useEffect(() => {
    if (notifications.length <= 1) return;
    
    const rotationInterval = setInterval(() => {
      setCurrentTrendIndex(prev => (prev + 1) % notifications.length);
    }, 8000);

    return () => clearInterval(rotationInterval);
  }, [notifications.length]);

  const getTrendData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    return last7Days.map(date => {
      const dayLogs = foodLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === date.getTime();
      });

      return {
        name: format(date, 'EEE'),
        calories: dayLogs.reduce((sum, log) => sum + log.calories, 0),
      };
    });
  };

  const trendData = getTrendData();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setChatInput(transcript);
        
        // If final result, we could auto-send, but let's keep it manual for now
        // to avoid accidental sends. However, we set shouldSpeakResponse to true
        // so that when they DO send, it speaks back.
        setShouldSpeakResponse(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        setChatInput(''); // Clear input for new voice command
        setShouldSpeakResponse(true); // Auto-enable voice output for voice commands
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
  }, []);

  // Online/Offline Listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync User Profile
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || AVATARS[0],
          targetCalories: 2000,
          targetProtein: 150,
          targetCarbs: 200,
          targetFat: 70,
          targetWeight: 70,
          targetBodyFat: 20,
          waterIntakeGoal: 2000,
          points: 0,
          achievements: [],
          badges: [],
          class: 'novice',
          aiPersonality: 'empathetic',
          hasCompletedOnboarding: false
        };
        setDoc(userRef, newProfile).then(() => {
          sendWelcomeEmail(user.email || '', user.displayName || 'User');
          syncPublicProfile(newProfile);
          
          // Add a welcome message to the AI chat
          const messagesRef = collection(db, 'users', user.uid, 'aiChatMessages');
          addDoc(messagesRef, {
            content: `Hi ${user.displayName || 'there'}! 👋 I'm NORI, your personal AI nutrition companion. I'm here to help you track your meals, build healthy habits, and reach your goals. Try tapping the Camera icon to scan your first meal, or ask me for a healthy recipe!`,
            role: 'model',
            timestamp: Timestamp.now()
          }).catch(console.error);
          
        }).catch(e => handleFirestoreError(e, OperationType.WRITE, userRef.path));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    return unsubscribe;
  }, [user]);

  // Sync Community Messages
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const messagesRef = collection(db, 'communityMessages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
        } as CommunityMessage;
      }).reverse();
      setCommunityMessages(messages);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'communityMessages'));

    return unsubscribe;
  }, [isAuthReady, user]);

  // Sync Friend Requests
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const requestsRef = collection(db, 'friendRequests');
    const q1 = query(requestsRef, where('receiverId', '==', user.uid));
    const q2 = query(requestsRef, where('senderId', '==', user.uid));

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FriendRequest));
      setFriendRequests(prev => {
        const others = prev.filter(r => r.receiverId !== user.uid);
        return [...others, ...reqs];
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'friendRequests'));

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FriendRequest));
      setFriendRequests(prev => {
        const others = prev.filter(r => r.senderId !== user.uid);
        return [...others, ...reqs];
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'friendRequests'));

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user, isAuthReady]);

  // Sync Friends Profiles
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const acceptedRequests = friendRequests.filter(r => r.status === 'accepted');
    const friendIds = acceptedRequests.map(r => r.senderId === user.uid ? r.receiverId : r.senderId);

    const fetchFriends = async () => {
      const friendProfiles = await Promise.all(friendIds.map(async (id) => {
        try {
          const docSnap = await getDoc(doc(db, 'users_public', id));
          if (docSnap.exists()) {
            return docSnap.data() as PublicProfile;
          }
        } catch (e) {
          console.error(e);
        }
        return null;
      }));
      setFriends(friendProfiles.filter(Boolean) as PublicProfile[]);
    };

    fetchFriends();
  }, [friendRequests, user, isAuthReady]);

  // Sync Private Chats
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chats = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data() as PrivateChat;
        const otherUid = data.participants.find(id => id !== user.uid);
        let otherParticipant;
        if (otherUid) {
          try {
            const pDoc = await getDoc(doc(db, 'users_public', otherUid));
            if (pDoc.exists()) {
              otherParticipant = pDoc.data() as PublicProfile;
            }
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, `users_public/${otherUid}`);
          }
        }
        return { ...data, id: chatDoc.id, otherParticipant };
      }));
      setPrivateChats(chats);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chats'));

    return unsubscribe;
  }, [user, isAuthReady]);

  // Sync Inbox for Active Chat
  useEffect(() => {
    if (!user || !isAuthReady || !activeChat) {
      setPrivateMessages([]);
      return;
    }

    const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PrivateMessage));
      setPrivateMessages(msgs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `chats/${activeChat.id}/messages`));

    return unsubscribe;
  }, [user, isAuthReady, activeChat]);

  // Sync User Message Count
  useEffect(() => {
    if (!user || !isAuthReady) return;
    const messagesRef = collection(db, 'communityMessages');
    const q = query(messagesRef, where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserMessageCount(snapshot.size);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'communityMessages'));
    return unsubscribe;
  }, [user, isAuthReady]);

  // Sync Leaderboard
  useEffect(() => {
    if (!isAuthReady || !user) return;
    const usersRef = collection(db, 'users_public');
    const q = query(usersRef, orderBy('points', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as PublicProfile));
      setLeaderboard(topUsers);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users_public'));
    return unsubscribe;
  }, [isAuthReady]);

  // Check for Achievements
  useEffect(() => {
    if (!user || !profile || !isAuthReady) return;

    const checkAchievements = async () => {
      const newAchievements = [...(profile.achievements || [])];
      let pointsEarned = 0;
      let updated = false;

      // Firsts
      if (userLogCount >= 1 && !newAchievements.includes('first_log')) {
        newAchievements.push('first_log');
        pointsEarned += 20;
        updated = true;
      }
      if (habits.length >= 1 && !newAchievements.includes('first_habit')) {
        newAchievements.push('first_habit');
        pointsEarned += 20;
        updated = true;
      }
      if (userMessageCount >= 1 && !newAchievements.includes('first_social')) {
        newAchievements.push('first_social');
        pointsEarned += 20;
        updated = true;
      }

      // Perfect Day
      if (habits.length > 0 && habits.every(h => h.completed) && !newAchievements.includes('perfect_day')) {
        newAchievements.push('perfect_day');
        pointsEarned += 50;
        updated = true;
      }

      // Water Streak 7
      const waterHabit = habits.find(h => h.name.toLowerCase().includes('water'));
      if (waterHabit && waterHabit.streak >= 7 && !newAchievements.includes('water_7')) {
        newAchievements.push('water_7');
        pointsEarned += 50;
        updated = true;
      }

      // Water Streak 20
      if (waterHabit && waterHabit.streak >= 20 && !newAchievements.includes('water_20')) {
        newAchievements.push('water_20');
        pointsEarned += 150;
        updated = true;
      }

      // Habit Streak 7
      const starterStreakHabit = habits.find(h => h.streak >= 7);
      if (starterStreakHabit && !newAchievements.includes('habit_7')) {
        newAchievements.push('habit_7');
        pointsEarned += 50;
        updated = true;
      }

      // Habit Streak 10
      const longStreakHabit = habits.find(h => h.streak >= 10);
      if (longStreakHabit && !newAchievements.includes('habit_10')) {
        newAchievements.push('habit_10');
        pointsEarned += 100;
        updated = true;
      }

      // Habit Streak 30
      const legendStreakHabit = habits.find(h => h.streak >= 30);
      if (legendStreakHabit && !newAchievements.includes('habit_30')) {
        newAchievements.push('habit_30');
        pointsEarned += 300;
        updated = true;
      }

      // Social Butterfly (10 messages)
      if (userMessageCount >= 10 && !newAchievements.includes('social_10')) {
        newAchievements.push('social_10');
        pointsEarned += 50;
        updated = true;
      }

      // Community Pillar (50 messages)
      if (userMessageCount >= 50 && !newAchievements.includes('social_50')) {
        newAchievements.push('social_50');
        pointsEarned += 150;
        updated = true;
      }

      // Log Master (50 logs)
      if (userLogCount >= 50 && !newAchievements.includes('log_50')) {
        newAchievements.push('log_50');
        pointsEarned += 100;
        updated = true;
      }

      // Nutrition Expert (100 logs)
      if (userLogCount >= 100 && !newAchievements.includes('log_100')) {
        newAchievements.push('log_100');
        pointsEarned += 250;
        updated = true;
      }

      // Point Collector (1000 points)
      if ((profile.points || 0) >= 1000 && !newAchievements.includes('points_1000')) {
        newAchievements.push('points_1000');
        pointsEarned += 200;
        updated = true;
      }

      // Point Master (5000 points)
      if ((profile.points || 0) >= 5000 && !newAchievements.includes('points_5000')) {
        newAchievements.push('points_5000');
        pointsEarned += 500;
        updated = true;
      }

      if (updated) {
        const userRef = doc(db, 'users', user.uid);
        try {
          await updateDoc(userRef, {
            achievements: newAchievements,
            points: (profile.points || 0) + pointsEarned
          });
          
          setChatMessages(prev => [...prev, { 
            role: 'model', 
            content: `🎉 Congratulations! You've earned a new achievement: ${ACHIEVEMENTS.find(a => a.id === newAchievements[newAchievements.length - 1])?.title}! You also earned ${pointsEarned} points!`, 
            timestamp: new Date() 
          }]);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, userRef.path);
        }
      }
    };

    checkAchievements();
  }, [habits, profile, user, isAuthReady]);

  // Sync Food Logs
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const logsRef = collection(db, 'users', user.uid, 'foodLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
        } as FoodLog;
      });
      setFoodLogs(logs);
      setUserLogCount(logs.length);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/foodLogs`));

    return unsubscribe;
  }, [user, isAuthReady]);

  // Sync Habits
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const habitsRef = collection(db, 'users', user.uid, 'habits');
    const unsubscribe = onSnapshot(habitsRef, (snapshot) => {
      if (snapshot.empty) {
        // Initialize default habits if none exist
        INITIAL_HABITS.forEach(h => {
          const { id, ...habitData } = h;
          addDoc(habitsRef, { ...habitData, uid: user.uid, lastUpdated: Timestamp.now() })
            .catch(e => handleFirestoreError(e, OperationType.CREATE, habitsRef.path));
        });
      } else {
        const hList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Habit));
        hList.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setHabits(hList);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/habits`));

    return unsubscribe;
  }, [user, isAuthReady]);

  // Update Stats
  useEffect(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todaysLogs = foodLogs.filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === today);
    
    const totals = todaysLogs.reduce((acc, log) => {
      const newVitamins = [...acc.vitamins];
      if (log.vitamins) {
        log.vitamins.forEach(v => {
          if (!newVitamins.includes(v)) newVitamins.push(v);
        });
      }
      return {
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
        vitamins: newVitamins
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, vitamins: [] as string[] });

    setStats(prev => ({
      ...totals,
      waterIntake: prev.waterIntake,
      targetCalories: profile?.targetCalories || 2000,
      targetProtein: profile?.targetProtein || 150,
      targetCarbs: profile?.targetCarbs || 200,
      targetFat: profile?.targetFat || 70,
      waterIntakeGoal: profile?.waterIntakeGoal || 2000,
    }));
  }, [foodLogs, profile]);

  const searchUsers = async (queryText: string) => {
    if (!queryText.trim() || !user) {
      setUserSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const usersRef = collection(db, 'users_public');
      // Simple client-side filtering for better UX with small datasets
      // In a real app, we'd use a search index or specific firestore queries
      const q = query(usersRef, limit(20));
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => doc.data() as PublicProfile)
        .filter(p => 
          p.uid !== user.uid && 
          p.displayName.toLowerCase().includes(queryText.toLowerCase())
        );
      setUserSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const syncPublicProfile = async (profileData: UserProfile) => {
    if (!user) return;
    const publicRef = doc(db, 'users_public', profileData.uid);
    try {
      await setDoc(publicRef, {
        uid: profileData.uid,
        displayName: profileData.displayName || 'User',
        photoURL: profileData.photoURL || AVATARS[0],
        points: profileData.points || 0,
        achievements: profileData.achievements || [],
        badges: profileData.badges || [],
        class: profileData.class || 'novice'
      });
    } catch (error) {
      console.error("Error syncing public profile:", error);
    }
  };

  const handleReportMessage = async () => {
    if (!reportingMessage || !reportReason.trim() || !user) return;
    setIsReporting(true);
    try {
      const reportsRef = collection(db, 'communityReports');
      await addDoc(reportsRef, {
        reporterUid: user.uid,
        messageId: reportingMessage.id,
        messageContent: reportingMessage.content,
        messageAuthorUid: reportingMessage.uid,
        reason: reportReason,
        timestamp: Timestamp.now(),
        status: 'pending'
      });
      setReportingMessage(null);
      setReportReason('');
      setChatMessages(prev => [...prev, { 
        role: 'model', 
        content: "Thank you for your report. Our moderators will review the message shortly.", 
        timestamp: new Date() 
      }]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'communityReports');
    } finally {
      setIsReporting(false);
    }
  };

  const handleRecipeAnalysis = async () => {
    if (!recipeInput.trim() || !user || !profile) return;
    if (!navigator.onLine) {
      alert("You are offline. Please connect to the internet to analyze recipes.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeRecipe(recipeInput);
      const logsRef = collection(db, 'users', user.uid, 'foodLogs');
      await addDoc(logsRef, {
        ...analysis,
        uid: user.uid,
        timestamp: Timestamp.now(),
      });
      
      // Award points for logging food
      await awardPoints(5, `Logged recipe: ${analysis.name}`);

      setRecipeInput('');
      setActiveTab('logs');
      setChatMessages(prev => [...prev, { 
        role: 'model', 
        content: `Recipe analyzed! Added "${analysis.name}" to your log. ${analysis.isHealthy ? "It's a healthy recipe!" : "It's a moderate recipe."} ${analysis.healthReason} (+5 points)`, 
        timestamp: new Date() 
      }]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/foodLogs`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFridgeSuggestion = async () => {
    if (!fridgeIngredients.trim() || !user) return;
    if (!navigator.onLine) {
      alert("You are offline. Please connect to the internet to get recipe suggestions.");
      return;
    }
    setIsGeneratingRecipe(true);
    try {
      const suggestion = await generateRecipeFromIngredients(fridgeIngredients);
      setGeneratedRecipe(suggestion);
      
      // Award points for using the fridge feature
      await awardPoints(2, "Used Fridge Recipe Generator");
    } catch (error) {
      console.error("Error generating recipe:", error);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!user || user.uid === receiverId) return;
    try {
      const requestId = [user.uid, receiverId].sort().join('_');
      const requestRef = doc(db, 'friendRequests', requestId);
      await setDoc(requestRef, {
        senderId: user.uid,
        receiverId,
        status: 'pending',
        timestamp: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'friendRequests');
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return;
    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'friendRequests');
    }
  };

  const removeFriend = async (requestId: string) => {
    if (!user) return;
    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      await deleteDoc(requestRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'friendRequests');
    }
  };

  const startPrivateChat = async (otherUser: { uid: string, displayName: string, photoURL: string }) => {
    if (!user || otherUser.uid === user.uid) return;
    setViewingProfile(null);
    
    try {
      const chatId = [user.uid, otherUser.uid].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      
      // Use setDoc with merge to avoid read-before-write permission issues on non-existent docs
      await setDoc(chatRef, {
        participants: [user.uid, otherUser.uid],
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      // Set active chat locally without needing to fetch
      setActiveChat({ 
        id: chatId, 
        participants: [user.uid, otherUser.uid],
        updatedAt: Timestamp.now(),
        otherParticipant: otherUser as PublicProfile 
      });
      
      setCommunityTab('messages');
      setActiveTab('community'); // Ensure we are on the community tab
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  const sendPrivateMessage = async () => {
    if (!privateInput.trim() || !user || !activeChat) return;
    
    const messageContent = filterProfanity(privateInput);
    const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
    const chatRef = doc(db, 'chats', activeChat.id);
    
    try {
      await addDoc(messagesRef, {
        senderUid: user.uid,
        content: messageContent,
        timestamp: Timestamp.now()
      });
      
      await updateDoc(chatRef, {
        lastMessage: messageContent,
        lastMessageTimestamp: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      setPrivateInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${activeChat.id}/messages`);
    }
  };

  const deletePrivateMessage = async (messageId: string) => {
    if (!user || !activeChat) return;
    const messageRef = doc(db, 'chats', activeChat.id, 'messages', messageId);
    try {
      await deleteDoc(messageRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, messageRef.path);
    }
  };

  const deletePrivateChat = async (chatId: string) => {
    if (!user) return;
    const chatRef = doc(db, 'chats', chatId);
    try {
      // In a real app, we might want to delete messages too, but for simplicity:
      await deleteDoc(chatRef);
      if (activeChat?.id === chatId) setActiveChat(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, chatRef.path);
    }
  };

  const deleteCommunityMessage = async (messageId: string) => {
    if (!user) return;
    const messageRef = doc(db, 'communityMessages', messageId);
    try {
      await deleteDoc(messageRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, messageRef.path);
    }
  };

  const sendCommunityMessage = async () => {
    if (!communityInput.trim() || !user || !profile) return;
    
    const filteredContent = filterProfanity(communityInput);
    const messagesRef = collection(db, 'communityMessages');
    
    try {
      await addDoc(messagesRef, {
        uid: user.uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        content: filteredContent,
        timestamp: Timestamp.now(),
      });

      // Award points for community interaction
      await awardPoints(2, "Community interaction");

      setCommunityInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, messagesRef.path);
    }
  };

  const startCamera = async (facingMode: 'user' | 'environment' = cameraFacingMode) => {
    setShowCamera(true);
    // Stop any existing tracks first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    
    try {
      const constraints: MediaStreamConstraints = { 
        video: { 
          facingMode,
          advanced: [{ torch: torchEnabled } as any]
        } 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraFacingMode(facingMode);
      
      // Apply zoom if supported
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : null;
      if (capabilities && (capabilities as any).zoom) {
        await track.applyConstraints({
          advanced: [{ zoom: zoomLevel } as any]
        });
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setShowCamera(false);
    }
  };

  const switchCamera = () => {
    const newMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    startCamera(newMode);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const newTorchState = !torchEnabled;
    try {
      await track.applyConstraints({
        advanced: [{ torch: newTorchState } as any]
      });
      setTorchEnabled(newTorchState);
    } catch (err) {
      console.error("Error toggling torch:", err);
    }
  };

  const setZoom = async (zoom: number) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const capabilities = (track as any).getCapabilities?.();
      let finalZoom = zoom;
      if (capabilities && capabilities.zoom) {
        finalZoom = Math.max(capabilities.zoom.min, Math.min(capabilities.zoom.max, zoom));
      }
      await track.applyConstraints({
        advanced: [{ zoom: finalZoom } as any]
      });
      setZoomLevel(finalZoom);
    } catch (err) {
      console.error("Error setting zoom:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const processImage = async (base64Image: string) => {
    if (!user || !profile) return;
    
    if (!navigator.onLine) {
      alert("You are offline. Please connect to the internet to analyze food images.");
      return;
    }

    setIsAnalyzing(true);
    setShowCamera(false);
    
    try {
      const analysis = await analyzeFoodImage(base64Image.split(',')[1]);
      const logsRef = collection(db, 'users', user.uid, 'foodLogs');
      await addDoc(logsRef, {
        ...analysis,
        uid: user.uid,
        timestamp: Timestamp.now(),
        imageUrl: base64Image
      });
      
      // Award points for logging food
      await awardPoints(5, `Logged meal: ${analysis.name}`);

      setChatMessages(prev => [...prev, { 
        role: 'model', 
        content: `I've logged your ${analysis.name}. It contains approximately ${analysis.calories} calories. ${analysis.isHealthy ? "This is a healthy choice!" : "This is a moderate choice."} ${analysis.healthReason} (+5 points)`, 
        timestamp: new Date() 
      }]);
      setActiveTab('logs');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/foodLogs`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Match canvas size to video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const base64Image = canvasRef.current.toDataURL('image/jpeg');
        processImage(base64Image);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim() || !user) return;
    
    const habitsRef = collection(db, 'users', user.uid, 'habits');
    const newHabit = {
      name: newHabitName,
      completed: false,
      streak: 0,
      icon: newHabitIcon,
      uid: user.uid,
      lastUpdated: Timestamp.now(),
      order: habits.length
    };

    try {
      await addDoc(habitsRef, newHabit);
      setNewHabitName('');
      setNewHabitIcon('CheckCircle2');
      setIsAddingHabit(false);
      setShowIconPicker(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, habitsRef.path);
    }
  };

  const awardPoints = async (points: number, reason: string) => {
    if (!user || !profile) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      const newPoints = Math.max(0, (profile.points || 0) + points);
      const { currentClass } = calculateUserClass(newPoints, habits);
      
      const updateData: Partial<UserProfile> = {
        points: newPoints,
        class: currentClass.id as 'amateur' | 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'master'
      };

      // Check for badge unlocks
      const newBadges = [...(profile.badges || [])];
      if (newPoints >= 100 && !newBadges.find(b => b.id === 'novice')) {
        newBadges.push({ id: 'novice', title: 'Novice', description: 'Earned 100 points', icon: 'Award' });
      }
      if (newPoints >= 500 && !newBadges.find(b => b.id === 'pro')) {
        newBadges.push({ id: 'pro', title: 'Pro', description: 'Earned 500 points', icon: 'Star' });
      }
      updateData.badges = newBadges;

      await updateDoc(userRef, updateData);
      await syncPublicProfile({ ...profile, ...updateData });
      
      if (points > 0) {
        setPointsToast({ points, reason });
        setTimeout(() => setPointsToast(null), 3000);
      }
    } catch (error) {
      console.error("Error awarding points:", error);
    }
  };

  const handleReorderHabits = (newOrder: Habit[]) => {
    setHabits(newOrder);
    if (!user) return;
    
    // Update order in Firestore
    newOrder.forEach((habit, index) => {
      if (habit.order !== index) {
        const habitRef = doc(db, 'users', user.uid, 'habits', habit.id);
        updateDoc(habitRef, { order: index }).catch(console.error);
      }
    });
  };

  const toggleHabit = async (habit: Habit) => {
    if (!user || !profile) return;
    const habitRef = doc(db, 'users', user.uid, 'habits', habit.id);
    try {
      const isCompleting = !habit.completed;
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      let newHistory = habit.completionHistory || [];
      if (isCompleting) {
        if (!newHistory.includes(todayStr)) {
          newHistory = [...newHistory, todayStr];
        }
      } else {
        newHistory = newHistory.filter(d => d !== todayStr);
      }

      await updateDoc(habitRef, { 
        completed: isCompleting, 
        streak: isCompleting ? habit.streak + 1 : Math.max(0, habit.streak - 1),
        lastUpdated: Timestamp.now(),
        completionHistory: newHistory
      });

      // Award or deduct points
      if (isCompleting) {
        await awardPoints(5, `Completed habit: ${habit.name}`);
      } else {
        await awardPoints(-5, `Uncompleted habit: ${habit.name}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, habitRef.path);
    }
  };

  const skipHabit = async (habit: Habit, reason: string) => {
    if (!user) return;
    const habitRef = doc(db, 'users', user.uid, 'habits', habit.id);
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      const skippedDates = habit.skippedDates || [];
      const skipReasons = habit.skipReasons || {};
      
      if (!skippedDates.includes(today)) {
        await updateDoc(habitRef, {
          skippedDates: [...skippedDates, today],
          skipReasons: { ...skipReasons, [today]: reason },
          lastUpdated: Timestamp.now()
        });
      }
      setSkippingHabit(null);
      setSkipReason('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, habitRef.path);
    }
  };

  const updateHabitReminder = async (habit: Habit, time: string) => {
    if (!user) return;
    const habitRef = doc(db, 'users', user.uid, 'habits', habit.id);
    try {
      await updateDoc(habitRef, {
        reminderTime: time,
        lastUpdated: Timestamp.now()
      });
      setSettingReminder(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, habitRef.path);
    }
  };

  const handleShare = (title: string, text: string) => {
    setShareContent({ title, text });
  };

  const triggerNativeShare = async () => {
    if (!shareContent) return;
    const shareData = {
      title: shareContent.title,
      text: shareContent.text,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          setShareContent(null);
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError' || shareErr.message?.includes('canceled')) {
            return;
          }
          await navigator.clipboard.writeText(`${shareContent.title}\n${shareContent.text}\n${window.location.href}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          setShareContent(null);
        }
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${shareContent.title}\n${shareContent.text}\n${window.location.href}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setShareContent(null);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const shareToCommunity = async () => {
    if (!user || !profile || !shareContent) return;
    const messagesRef = collection(db, 'communityMessages');
    try {
      await addDoc(messagesRef, {
        uid: user.uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        content: shareContent.text,
        timestamp: Timestamp.now(),
      });

      // Award points for community interaction
      await awardPoints(2, "Shared to community");

      setShareContent(null);
      setActiveTab('community');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, messagesRef.path);
    }
  };

  const shareToPrivateChat = async (chatId: string) => {
    if (!user || !shareContent) return;
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const chatRef = doc(db, 'chats', chatId);
    try {
      await addDoc(messagesRef, {
        senderUid: user.uid,
        content: shareContent.text,
        timestamp: Timestamp.now()
      });
      await updateDoc(chatRef, {
        lastMessage: shareContent.text,
        lastMessageTimestamp: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      setShareContent(null);
      setActiveTab('chat');
      const chat = privateChats.find(c => c.id === chatId);
      if (chat) setActiveChat(chat);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, messagesRef.path);
    }
  };

  const handleFeedback = async (index: number, feedback: 'positive' | 'negative') => {
    if (!auth.currentUser) return;
    
    const message = chatMessages[index];
    if (!message || message.role !== 'model') return;

    // Prevent duplicate feedback for the same message in the same session
    if (message.feedback) return;

    setChatMessages(prev => prev.map((msg, i) => 
      i === index ? { ...msg, feedback } : msg
    ));
    
    try {
      await addDoc(collection(db, 'aiFeedback'), {
        uid: auth.currentUser.uid,
        messageContent: message.content,
        feedback,
        timestamp: Timestamp.now()
      });
      console.log(`Feedback for message ${index} saved to Firestore: ${feedback}`);
    } catch (error) {
      console.error("Error saving feedback to Firestore:", error);
    }
  };

  const handleSpeak = async (text: string) => {
    if (!navigator.onLine) {
      console.warn("TTS is not available offline.");
      return;
    }
    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        audio.play();
      }
    } catch (error) {
      console.error("TTS failed:", error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user) return;
    
    if (!navigator.onLine) {
      setChatMessages(prev => [...prev, { role: 'user', content, timestamp: new Date() }]);
      setChatMessages(prev => [...prev, { role: 'model', content: "I'm sorry, but I need an internet connection to chat. Please check your connection and try again.", timestamp: new Date() }]);
      return;
    }

    const messagesRef = collection(db, 'users', user.uid, 'aiChatMessages');
    
    try {
      // Save user message
      const userMessage = { role: 'user', content, timestamp: Timestamp.now() };
      await addDoc(messagesRef, userMessage);
      
      setChatMessages(prev => [...prev, { role: 'user', content, timestamp: new Date() }]);
      setIsChatting(true);
      let advice;
      if (isSearchMode) {
        advice = await searchNutritionInfo(content);
      } else if (isThinkingMode) {
        advice = await getComplexNutritionAdvice(foodLogs.slice(0, 20), habits, content, profile?.displayName, profile?.aiPersonality);
      } else {
        advice = await getNutritionAdvice(foodLogs.slice(0, 20), habits, content, profile?.displayName, profile?.aiPersonality);
      }
      
      // Save model message
      const modelMessage = { role: 'model', content: advice, timestamp: Timestamp.now() };
      await addDoc(messagesRef, modelMessage);
      
      setChatMessages(prev => [...prev, { role: 'model', content: advice, timestamp: new Date() }]);
      
      // Voice Output if triggered by voice input
      if (shouldSpeakResponse) {
        handleSpeak(advice);
        setShouldSpeakResponse(false); // Reset for next time
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, messagesRef.path);
    } finally {
      setIsChatting(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setChatMessages([{ role: 'model', content: "Hello! I'm NORI AI. How can I help you with your nutrition today?", timestamp: new Date() }]);
      return;
    }
    
    const messagesRef = collection(db, 'users', user.uid, 'aiChatMessages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      } as ChatMessage));
      setChatMessages(messages.length > 0 ? messages : [{ role: 'model', content: "Hello! I'm NORI AI. How can I help you with your nutrition today?", timestamp: new Date() }]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, messagesRef.path));
    
    return () => unsubscribe();
  }, [user]);

  const handleUserClick = async (uid: string, displayName: string, photoURL: string) => {
    if (uid === user?.uid) return;
    try {
      const userRef = doc(db, 'users_public', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setViewingProfile(userSnap.data() as PublicProfile);
      } else {
        setViewingProfile({ uid, displayName, photoURL, points: 0, achievements: [], badges: [], class: 'novice' });
      }
    } catch (error) {
      setViewingProfile({ uid, displayName, photoURL, points: 0, achievements: [], badges: [], class: 'novice' });
    }
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        targetCalories: profile.targetCalories,
        targetProtein: profile.targetProtein || 150,
        targetCarbs: profile.targetCarbs || 200,
        targetFat: profile.targetFat || 70,
        targetWeight: profile.targetWeight || 70,
        targetBodyFat: profile.targetBodyFat || 20,
        waterIntakeGoal: profile.waterIntakeGoal,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        aiPersonality: profile.aiPersonality || 'empathetic'
      });
      await syncPublicProfile(profile);
      setActiveTab('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userRef.path);
    }
  };

  const fetchUserProfile = async (uid: string) => {
    const userRef = doc(db, 'users_public', uid);
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setViewingProfile({ ...userSnap.data(), uid } as PublicProfile);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, userRef.path);
    }
  };

  const handleSignIn = async () => {
    if (isSigningIn) return;
    if (!navigator.onLine) {
      setAuthError("You are offline. Please connect to the internet to sign in.");
      return;
    }
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Sign-in error:", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError("Sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        setAuthError("Sign-in was cancelled. Please keep the popup window open until sign-in is complete.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore this as it's usually a duplicate request
      } else {
        setAuthError("An unexpected error occurred during sign-in. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSigningIn || !email || !password) return;
    if (!navigator.onLine) {
      setAuthError("You are offline. Please connect to the internet to sign in.");
      return;
    }
    setAuthError(null);
    setIsSigningIn(true);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setAuthError("Invalid email or password.");
      } else if (error.code === 'auth/email-already-in-use') {
        setAuthError("This email is already in use. Please log in instead.");
      } else if (error.code === 'auth/weak-password') {
        setAuthError("Password should be at least 6 characters.");
      } else if (error.code === 'auth/invalid-email') {
        setAuthError("Please enter a valid email address.");
      } else {
        setAuthError("An error occurred. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const macroData = [
    { name: 'Protein', value: stats.protein, color: '#10b981' },
    { name: 'Carbs', value: stats.carbs, color: '#3b82f6' },
    { name: 'Fat', value: stats.fat, color: '#f59e0b' },
  ];

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-8 text-center max-w-md mx-auto shadow-2xl text-slate-100">
        <motion.div 
          animate={{ 
            rotate: [0, 2, -2, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 mb-8 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center">
            <Leaf size={40} className="absolute -translate-x-1 -translate-y-1 opacity-40 rotate-12" />
            <Brain size={44} className="relative z-10 drop-shadow-lg" />
          </div>
        </motion.div>
        <h1 className="text-4xl font-display font-black tracking-tight mb-4 text-white drop-shadow-sm">Nourish <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">IQ</span></h1>
        <p className="text-slate-400 mb-8 font-medium opacity-80 leading-relaxed">Your AI-powered multimodal nutritional and habit tracking companion.</p>
        
        {authError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium w-full"
          >
            {authError}
          </motion.div>
        )}

        <form onSubmit={handleEmailAuth} className="w-full space-y-4 mb-8">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isSigningIn}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-70"
          >
            {isSigningIn ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isLoginMode ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div className="flex items-center gap-4 w-full mb-8">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-slate-500 text-xs font-bold uppercase">or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <button 
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl disabled:opacity-70 mb-6"
        >
          {isSigningIn ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-6 h-6 brightness-0 invert" alt="Google" />
              Continue with Google
            </>
          )}
        </button>

        <p className="text-slate-500 text-sm">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-emerald-500 font-bold hover:underline"
          >
            {isLoginMode ? "Sign Up" : "Log In"}
          </button>
        </p>

        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-8">
          &copy; 2026 Nourish IQ
        </p>
      </div>
    );
  }

  if (profile && !profile.hasCompletedOnboarding) {
    return <OnboardingWizard profile={profile} user={user} />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-slate-950 text-slate-100 shadow-2xl relative overflow-hidden border-x border-slate-900 selection:bg-emerald-500/30">
      <div className="atmosphere-bg" />
      
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/5">
        <motion.div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            animate={{ 
              rotate: [0, 3, -3, 0],
              scale: [1, 1.03, 1]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-11 h-11 flex items-center justify-center transform -rotate-3 group-hover:rotate-0 transition-all duration-300"
          >
            <img src="/logo.png" alt="Nourish IQ Logo" className="w-full h-full object-contain drop-shadow-lg" onError={(e) => {
              // Fallback to the old logo if the image isn't uploaded yet
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
            <div className="hidden w-full h-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Leaf size={16} className="absolute top-1 right-1 opacity-30 rotate-12" />
              <Brain size={24} className="relative z-10" />
            </div>
          </motion.div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-white">Nourish <span className="text-emerald-500">IQ</span></h1>
            <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-widest">Nutrition Intelligence</p>
          </div>
        </motion.div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-white/5">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-white">{profile?.points || 0} pts</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-white/5">
            <Flame size={16} className="text-orange-500" />
            <span className="text-xs font-bold text-white">{habits.reduce((max, h) => Math.max(max, h.streak), 0)} Day Streak</span>
          </div>
          <button 
            onClick={() => setShowTrends(!showTrends)}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
              showTrends ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
            )}
          >
            <Bell size={20} />
          </button>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('profile')}
            className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg transition-transform animate-float"
          >
          {profile?.photoURL ? (
            <AnimatedAvatar src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">
              <User size={20} />
            </div>
          )}
        </motion.button>
        </div>
      </header>

      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/20 border-b border-amber-500/30 overflow-hidden"
          >
            <div className="px-6 py-2 flex items-center justify-center gap-2 text-amber-500 text-xs font-medium">
              <LucideIcons.WifiOff size={14} />
              You are currently offline. Some features may be unavailable.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32 px-6 relative">
        {/* User Profile Modal */}
      <AnimatePresence>
        {viewingProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingProfile(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass-card rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative z-10"
            >
              <div className="h-24 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 relative">
                <button 
                  onClick={() => setViewingProfile(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-8 pb-8 -mt-12 flex flex-col items-center">
                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-slate-900 shadow-xl mb-4 bg-slate-800 animate-float">
                  <AnimatedAvatar src={viewingProfile.photoURL} alt={viewingProfile.displayName} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-display font-bold text-white tracking-tight">{viewingProfile.displayName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <LucideIcons.Trophy size={14} className="text-amber-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{viewingProfile.points || 0} Points</span>
                  <span className="text-xs font-bold text-slate-600 mx-1">•</span>
                  <LucideIcons.Users size={14} className="text-blue-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{viewingProfile.friends?.length || 0} Friends</span>
                </div>

                <div className="w-full mt-8 space-y-4">
                  {/* Badges Section */}
                  {viewingProfile.badges && viewingProfile.badges.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
                        <span>Badges</span>
                        <span>{viewingProfile.badges.length} Earned</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {viewingProfile.badges.map((badge) => {
                          const Icon = (LucideIcons[badge.icon as keyof typeof LucideIcons] || LucideIcons.Award) as React.ElementType;
                          return (
                            <div key={badge.id} className="bg-slate-950/50 border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2" title={badge.description}>
                              <Icon size={14} className="text-amber-400" />
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{badge.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
                    <span>Achievements</span>
                    <span>{viewingProfile.achievements?.length || 0} Unlocked</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {viewingProfile.achievements?.map(id => {
                      const ach = ACHIEVEMENTS.find(a => a.id === id);
                      if (!ach) return null;
                      const Icon = LucideIcons[ach.icon as keyof typeof LucideIcons] as any || LucideIcons.Trophy;
                      return (
                        <div key={id} className="aspect-square glass-card rounded-xl flex items-center justify-center text-blue-400" title={ach.title}>
                          <Icon size={18} />
                        </div>
                      );
                    })}
                    {(viewingProfile.achievements?.length || 0) === 0 && (
                      <div className="col-span-4 py-4 text-center text-[10px] text-slate-600 italic">No achievements yet</div>
                    )}
                  </div>
                </div>

                {viewingProfile.uid !== user?.uid && (() => {
                  const isFriend = friends.some(f => f.uid === viewingProfile.uid);
                  const sentRequest = friendRequests.find(r => r.senderId === user?.uid && r.receiverId === viewingProfile.uid && r.status === 'pending');
                  const receivedRequest = friendRequests.find(r => r.receiverId === user?.uid && r.senderId === viewingProfile.uid && r.status === 'pending');

                  if (isFriend) {
                    return (
                      <button 
                        onClick={() => startPrivateChat({ uid: viewingProfile.uid!, displayName: viewingProfile.displayName, photoURL: viewingProfile.photoURL })}
                        className="w-full mt-8 py-4 bg-gradient-to-br from-blue-400 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <LucideIcons.MessageSquare size={18} />
                        Message {viewingProfile.displayName.split(' ')[0]}
                      </button>
                    );
                  }

                  if (receivedRequest) {
                    return (
                      <button 
                        onClick={() => acceptFriendRequest(receivedRequest.id)}
                        className="w-full mt-8 py-4 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <LucideIcons.Check size={18} />
                        Accept Request
                      </button>
                    );
                  }

                  if (sentRequest) {
                    return (
                      <button 
                        disabled
                        className="w-full mt-8 py-4 bg-slate-800 text-slate-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <LucideIcons.Clock size={18} />
                        Request Sent
                      </button>
                    );
                  }

                  return (
                    <button 
                      onClick={() => sendFriendRequest(viewingProfile.uid)}
                      className="w-full mt-8 py-4 bg-gradient-to-br from-blue-400 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <LucideIcons.UserPlus size={18} />
                      Add Friend
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Food Log Detail Modal */}
      <AnimatePresence>
        {viewingLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingLog(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass-card rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="relative h-64 bg-slate-900">
                {viewingLog.imageUrl ? (
                  <img src={viewingLog.imageUrl} alt={viewingLog.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <Utensils size={64} />
                  </div>
                )}
                <button 
                  onClick={() => setViewingLog(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">{viewingLog.name}</h3>
                  <p className="text-emerald-400 font-bold text-sm">{viewingLog.calories} Calories</p>
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card p-4 rounded-2xl text-center border-emerald-500/20">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Protein</p>
                    <p className="text-lg font-bold text-white">{viewingLog.protein}g</p>
                  </div>
                  <div className="glass-card p-4 rounded-2xl text-center border-blue-500/20">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Carbs</p>
                    <p className="text-lg font-bold text-white">{viewingLog.carbs}g</p>
                  </div>
                  <div className="glass-card p-4 rounded-2xl text-center border-amber-500/20">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fat</p>
                    <p className="text-lg font-bold text-white">{viewingLog.fat}g</p>
                  </div>
                </div>
                
                {viewingLog.vitamins && viewingLog.vitamins.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={14} className="text-blue-400" /> Micronutrients
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingLog.vitamins.map((v, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-bold text-blue-300 uppercase tracking-wide">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={cn(
                  "p-5 rounded-[2rem] border space-y-2",
                  viewingLog.isHealthy ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      viewingLog.isHealthy ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
                    )}>
                      {viewingLog.isHealthy ? <Heart size={18} /> : <Info size={18} />}
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      viewingLog.isHealthy ? "text-emerald-400" : "text-amber-400"
                    )}>
                      {viewingLog.isHealthy ? "Healthy Choice" : "Moderate Choice"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pl-11">
                    {viewingLog.healthReason}
                  </p>
                </div>

                {(viewingLog.mood || viewingLog.energy) && (
                  <div className="grid grid-cols-2 gap-4">
                    {viewingLog.mood && (
                      <div className="glass-card p-4 rounded-2xl border-indigo-500/20">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Smile size={12} className="text-indigo-400" /> Expected Mood
                        </p>
                        <p className="text-sm font-bold text-white">{viewingLog.mood}</p>
                      </div>
                    )}
                    {viewingLog.energy && (
                      <div className="glass-card p-4 rounded-2xl border-amber-500/20">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Zap size={12} className="text-amber-400" /> Energy Level
                        </p>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Zap 
                              key={star} 
                              size={14} 
                              className={star <= viewingLog.energy! ? "text-amber-400 fill-amber-400" : "text-slate-700"} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <History size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {format(viewingLog.timestamp, 'MMMM d, yyyy • HH:mm')}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleShare(`Logged: ${viewingLog.name}`, `I just logged ${viewingLog.name} (${viewingLog.calories} kcal) on Nourish IQ! #HealthyLiving`)}
                    className="w-10 h-10 glass-card rounded-xl text-slate-400 hover:text-emerald-400 transition-all flex items-center justify-center"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reporting Modal */}
        <AnimatePresence>
          {reportingMessage && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
                    <Flag size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white">Report Message</h3>
                    <p className="text-xs text-slate-500">Help us keep the community safe.</p>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-2xl p-4 mb-6 border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Message Content</p>
                  <p className="text-sm text-slate-300 italic">"{reportingMessage.content}"</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block px-2">Reason for reporting</label>
                    <textarea 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Why are you reporting this message? (e.g., spam, harassment, inappropriate content)"
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-slate-100 placeholder:text-slate-600 min-h-[120px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => {
                      setReportingMessage(null);
                      setReportReason('');
                    }}
                    className="flex-1 py-4 rounded-2xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleReportMessage}
                    disabled={!reportReason.trim() || isReporting}
                    className="flex-[2] bg-red-500 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isReporting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {copied && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-24 left-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-emerald-500/20 flex items-center gap-3 border border-white/20 backdrop-blur-md"
            >
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={14} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Copied to clipboard!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Points Toast */}
        <AnimatePresence>
          {pointsToast && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: -20, x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, scale: 0.8, y: -20, x: '-50%' }}
              className="fixed top-28 left-1/2 z-[110] bg-slate-950/80 text-white px-6 py-4 rounded-[2rem] border border-amber-500/30 backdrop-blur-2xl shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center gap-4 min-w-[240px]"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-xl animate-pulse" />
                <Zap size={24} className="text-amber-400 relative z-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </div>
              <div>
                <span className="block text-sm font-black uppercase tracking-[0.1em] text-white">+{pointsToast.points} Points</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">{pointsToast.reason}</span>
              </div>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
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
                    className="tech-card border-emerald-500/20 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent opacity-40" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[60px] rounded-full -mr-10 -mt-10 group-hover:bg-emerald-500/30 transition-colors duration-700 pointer-events-none" />
                    
                    <button 
                      onClick={() => setShowTrends(false)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10 bg-slate-900/50 p-1.5 rounded-full backdrop-blur-sm"
                    >
                      <X size={14} />
                    </button>
                    
                    <div className="flex gap-4 relative z-10 items-start">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 relative z-10">
                          <Brain size={22} className="drop-shadow-md" />
                        </div>
                        <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-40 animate-pulse" />
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
              <section className="tech-card border-white/10 p-4 py-3 flex items-center justify-between group cursor-pointer hover:border-blue-500/30 transition-all bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-[1.25rem] flex items-center justify-center relative",
                    userClassData.currentClass.bg,
                    userClassData.currentClass.color
                  )}>
                    <div className={cn("absolute inset-0 blur-lg opacity-30", userClassData.currentClass.bg)} />
                    {(() => {
                      const Icon = LucideIcons[userClassData.currentClass.icon as keyof typeof LucideIcons] as any || LucideIcons.Star;
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
              <section className="tech-card border-white/5 relative group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
                <button 
                  onClick={() => handleShare("My Daily Progress on Nourish IQ", `I've consumed ${stats.calories} calories today out of my ${stats.targetCalories} goal!`)}
                  className="absolute top-6 right-6 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-emerald-400 transition-all border border-white/5"
                >
                  <Share2 size={18} />
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
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                      <TrendingUp size={18} />
                    </div>
                    7-Day Trend
                  </h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleShare("My 7-Day Nutrition Trend", `I've been tracking my calories on Nourish IQ. Here's my 7-day trend! Average: ${Math.round(trendData.reduce((s, d) => s + d.calories, 0) / 7)} kcal/day.`)}
                      className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition-all border border-white/5"
                      title="Share Trend"
                    >
                      <Share2 size={14} />
                    </button>
                    <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calories</span>
                    </div>
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                        dy={15}
                      />
                      <YAxis hide />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#f8fafc', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="calories" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCal)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Macros & Water */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="tech-card border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Macro Breakdown</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Actual</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: 'Protein', value: stats.protein, target: stats.targetProtein || 1, color: 'emerald' },
                      { name: 'Carbs', value: stats.carbs, target: stats.targetCarbs || 1, color: 'blue' },
                      { name: 'Fat', value: stats.fat, target: stats.targetFat || 1, color: 'amber' },
                    ].map((m) => (
                      <div key={m.name} className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.name}</span>
                          <span className="text-[10px] font-bold text-white">{m.value}g <span className="text-slate-500">/ {m.target}g</span></span>
                        </div>
                        <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((m.value / m.target) * 100, 100)}%` }}
                            className={cn(
                              "h-full rounded-full",
                              m.color === 'emerald' ? "bg-emerald-500" : m.color === 'blue' ? "bg-blue-500" : "bg-amber-500"
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="tech-card border-white/5 flex flex-col items-center justify-center min-h-[220px]">
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
                        <Droplets size={16} />
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
                    className="mt-4 w-full py-3 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/10 hover:bg-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add 250ml
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
                            <Utensils size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">{log.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">{format(log.timestamp, 'MMM d, HH:mm')} • {log.calories} kcal</p>
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
              <section className="tech-card border-purple-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400">
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-medium text-xl text-white tracking-tight">Weekly Quests</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Challenges</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 relative z-10">
                  {[
                    { title: "Hydration Master", desc: "Hit your water goal 5 days", progress: 3, total: 5, points: 50, icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { title: "Consistent Logger", desc: "Log 3 meals today", progress: foodLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length, total: 3, points: 30, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { title: "Habit Builder", desc: "Complete all daily habits", progress: habits.filter(h => h.completed).length, total: Math.max(habits.length, 1), points: 40, icon: CheckCircle2, color: "text-indigo-400", bg: "bg-indigo-500/10" }
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
                    <ChefHat size={28} />
                  </div>
                  <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Analyze Recipe</span>
                </button>
                <button 
                  onClick={() => startCamera()}
                  className="p-6 tech-card border-blue-500/10 flex flex-col items-center gap-3 group hover:scale-[1.02] active:scale-95 transition-all text-center"
                >
                  <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-blue-500/5">
                    <Camera size={28} />
                  </div>
                  <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Snap Meal</span>
                </button>
              </div>

            </motion.div>
          )}

          {activeTab === 'recipe' && (
            <motion.div key="recipe" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6 py-4">
              <div className="flex items-center gap-5">
                <button 
                  onClick={() => setActiveTab('dashboard')} 
                  className="w-12 h-12 tech-card rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all border-white/5"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="font-display font-bold text-2xl text-white tracking-tight">AI Kitchen</h2>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Smart Recipe Tools</p>
                </div>
              </div>

              {/* Sub-tab Switcher */}
              <div className="flex p-1 bg-slate-900/50 rounded-2xl border border-white/5">
                <button
                  onClick={() => setRecipeTab('analyze')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                    recipeTab === 'analyze' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Analyze Recipe
                </button>
                <button
                  onClick={() => setRecipeTab('fridge')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                    recipeTab === 'fridge' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Fridge Suggestions
                </button>
              </div>
              
              {recipeTab === 'analyze' ? (
                <div className="tech-card border-white/5 space-y-4">
                  <p className="text-slate-400 text-xs leading-relaxed opacity-70">
                    Paste your ingredients list and quantities below. Nourish IQ will calculate the total nutrition for you using advanced AI analysis.
                  </p>
                  <div className="relative">
                    <textarea 
                      value={recipeInput}
                      onChange={(e) => setRecipeInput(e.target.value)}
                      placeholder="e.g., 2 eggs, 1 slice of whole grain bread, 1/2 avocado..."
                      className="w-full h-56 bg-slate-950/50 border border-white/5 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-slate-100 custom-scrollbar placeholder:text-slate-700"
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                      {recipeInput.length} chars
                    </div>
                  </div>
                  <button 
                    onClick={handleRecipeAnalysis}
                    disabled={isAnalyzing || !recipeInput.trim()}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-3 group transition-all active:scale-[0.98]"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <Zap size={16} />
                        </div>
                        Analyze & Log Recipe
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="tech-card border-white/5 space-y-4 relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                        <Refrigerator size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">What's in your fridge?</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">List your ingredients</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Tell us what ingredients you have, and NORI AI will suggest a creative, healthy recipe you can make right now.
                    </p>
                    <div className="relative">
                      <textarea 
                        value={fridgeIngredients}
                        onChange={(e) => setFridgeIngredients(e.target.value)}
                        placeholder="e.g., chicken breast, spinach, garlic, lemon, pasta..."
                        className="w-full h-32 bg-slate-950/50 border border-white/5 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-100 custom-scrollbar placeholder:text-slate-700"
                      />
                    </div>
                    <button 
                      onClick={handleFridgeSuggestion}
                      disabled={isGeneratingRecipe || !fridgeIngredients.trim()}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3 group transition-all active:scale-[0.98]"
                    >
                      {isGeneratingRecipe ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <>
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <ChefHat size={16} />
                          </div>
                          Suggest a Recipe
                        </>
                      )}
                    </button>
                  </div>

                  {generatedRecipe && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="tech-card border-emerald-500/20 space-y-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[100px] rounded-full -mr-24 -mt-24 pointer-events-none" />
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-display font-bold text-white tracking-tight">{generatedRecipe.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={14} className="text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{generatedRecipe.estimatedTime}</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                          <ChefHat size={24} />
                        </div>
                      </div>

                      <p className="text-slate-400 text-sm italic leading-relaxed">
                        "{generatedRecipe.description}"
                      </p>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ingredients
                          </h4>
                          <ul className="grid grid-cols-1 gap-2">
                            {generatedRecipe.ingredients.map((ing: string, i: number) => (
                              <li key={i} className="flex items-center gap-3 text-sm text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                                  {i + 1}
                                </div>
                                {ing}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Instructions
                          </h4>
                          <div className="space-y-3">
                            {generatedRecipe.instructions.map((step: string, i: number) => (
                              <div key={i} className="flex gap-4">
                                <div className="text-xs font-black text-slate-700 mt-0.5">{String(i + 1).padStart(2, '0')}</div>
                                <p className="text-sm text-slate-400 leading-relaxed">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setRecipeInput(generatedRecipe.ingredients.join(', '));
                          setRecipeTab('analyze');
                          setGeneratedRecipe(null);
                          setFridgeIngredients('');
                        }}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold border border-white/5 transition-all flex items-center justify-center gap-2"
                      >
                        <Zap size={16} className="text-emerald-400" /> Analyze Nutrition
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-2xl text-white tracking-tight">Food Logs</h2>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-white/5">
                  {foodLogs.length} Entries
                </div>
              </div>
              <div className="space-y-4">
                {foodLogs.map(log => (
                  <motion.div 
                    layout
                    key={log.id} 
                    onClick={() => setViewingLog(log)}
                    className="tech-card border-white/5 p-4 flex gap-5 group hover:border-emerald-500/30 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                    <div className="relative w-24 h-24 flex-shrink-0">
                      {log.imageUrl ? (
                        <img src={log.imageUrl} alt={log.name} className="w-full h-full rounded-2xl object-cover shadow-lg" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 border border-white/5">
                          <Utensils size={32} />
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-[#020617]">
                        <Zap size={14} />
                      </div>
                    </div>
                    <div className="flex-1 py-1">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-bold text-white text-lg leading-tight">{log.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">{log.calories} kcal</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-md">{format(log.timestamp, 'HH:mm')}</span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(`Logged: ${log.name}`, `I just logged ${log.name} (${log.calories} kcal) on Nourish IQ! #HealthyLiving`);
                          }}
                          className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition-all border border-white/5"
                          title="Share Meal"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                      <div className="flex gap-4 mt-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Protein</span>
                          <span className="text-xs font-bold text-slate-200">{log.protein}g</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Carbs</span>
                          <span className="text-xs font-bold text-slate-200">{log.carbs}g</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Fat</span>
                          <span className="text-xs font-bold text-slate-200">{log.fat}g</span>
                        </div>
                      </div>
                      
                      {(log.vitamins || log.isHealthy !== undefined) && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                          {log.vitamins && log.vitamins.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {log.vitamins.map((v, i) => (
                                <span key={i} className="text-[8px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20 uppercase tracking-wider">
                                  {v}
                                </span>
                              ))}
                            </div>
                          )}
                          {log.isHealthy !== undefined && (
                            <div className={cn(
                              "flex items-center gap-2 p-2 rounded-xl border",
                              log.isHealthy ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
                            )}>
                              {log.isHealthy ? <Heart size={12} className="text-emerald-500" /> : <Info size={12} className="text-amber-500" />}
                              <p className={cn(
                                "text-[10px] font-medium",
                                log.isHealthy ? "text-emerald-400" : "text-amber-400"
                              )}>
                                {log.isHealthy ? "Healthy Choice" : "Moderate Choice"}: {log.healthReason}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {foodLogs.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-16 text-center tech-card border-dashed border-2 border-white/5 bg-transparent"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full flex items-center justify-center text-emerald-500/50 mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                      <Utensils size={40} className="relative z-10" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-white mb-2">Your Plate is Empty</h3>
                    <p className="text-slate-400 text-sm max-w-[200px] mx-auto mb-6">Log your first meal to start tracking your nutrition and earning points.</p>
                    <button 
                      onClick={() => startCamera()}
                      className="px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-bold text-sm hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 mx-auto"
                    >
                      <Camera size={16} />
                      Scan a Meal
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'habits' && (
            <motion.div key="habits" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 py-4">
              <div className="flex items-center justify-between mb-8 px-2">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white tracking-tight">Daily Habits</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      {habits.filter(h => h.completed).length}/{habits.length} Done
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddingHabit(!isAddingHabit)}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20",
                    isAddingHabit ? "bg-slate-800 text-slate-400" : "bg-emerald-500 text-white"
                  )}
                >
                  {isAddingHabit ? <X size={24} /> : <Plus size={24} />}
                </button>
              </div>

              {/* Weekly Quests */}
              <div className="px-2 mb-8">
                <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-[2rem] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                        <Target size={20} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-white">Weekly Quests</h3>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Resets in 3 days</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-white">Hydration Master</span>
                          <span className="text-xs font-bold text-emerald-400">+50 pts</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 mb-1">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '60%' }} />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">3/5 Days</p>
                      </div>
                      <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-white">Perfect Logger</span>
                          <span className="text-xs font-bold text-emerald-400">+100 pts</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 mb-1">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '20%' }} />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">1/5 Days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isAddingHabit && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="px-2 mb-8"
                  >
                    <div className="glass-card p-4 rounded-[2rem] border-emerald-500/20">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4">Add New Habit</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowIconPicker(!showIconPicker)}
                          className="w-12 h-12 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-all"
                        >
                          {(() => {
                            const Icon = LucideIcons[newHabitIcon as keyof typeof LucideIcons] as any;
                            return <Icon size={20} />;
                          })()}
                        </button>
                        <input 
                          type="text" 
                          placeholder="e.g., Morning Yoga, Healthy Snack..." 
                          className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-100 placeholder:text-slate-600"
                          value={newHabitName}
                          onChange={(e) => setNewHabitName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                        />
                        <button 
                          onClick={addHabit}
                          disabled={!newHabitName.trim()}
                          className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
                        >
                          <Check size={20} />
                        </button>
                      </div>
                      {showIconPicker && (
                        <div className="grid grid-cols-5 gap-2 mt-4 bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                          {HABIT_ICONS.map(iconName => {
                            const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as any;
                            return (
                              <button
                                key={iconName}
                                onClick={() => setNewHabitIcon(iconName)}
                                className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                  newHabitIcon === iconName ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                                )}
                              >
                                <Icon size={20} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Reorder.Group 
                axis="y" 
                values={habits} 
                onReorder={handleReorderHabits}
                className="space-y-4"
              >
                {habits.length === 0 && !isAddingHabit && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-16 text-center tech-card border-dashed border-2 border-white/5 bg-transparent"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full flex items-center justify-center text-indigo-500/50 mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                      <CheckCircle2 size={40} className="relative z-10" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-white mb-2">No Habits Yet</h3>
                    <p className="text-slate-400 text-sm max-w-[200px] mx-auto mb-6">Start building a better routine by adding your first daily habit.</p>
                    <button 
                      onClick={() => setIsAddingHabit(true)}
                      className="px-6 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2 mx-auto"
                    >
                      <Plus size={16} />
                      Create Habit
                    </button>
                  </motion.div>
                )}
                {habits.map((habit, index) => (
                  <Reorder.Item 
                    value={habit}
                    key={habit.id} 
                    animate={{ 
                      scale: habit.completed ? [1, 1.02, 1] : 1,
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={cn(
                      "p-6 rounded-[2rem] border transition-all relative overflow-hidden group/habit",
                      habit.completed 
                        ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                        : "tech-card border-white/5 hover:border-white/10"
                    )}
                  >
                    {habit.completed && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" 
                        />
                        {/* Sparkles flourish */}
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                            animate={{ 
                              opacity: [0, 1, 0], 
                              scale: [0, 1, 0],
                              x: (Math.random() - 0.5) * 100,
                              y: (Math.random() - 0.5) * 100
                            }}
                            transition={{ 
                              duration: 1, 
                              delay: i * 0.1,
                              repeat: Infinity,
                              repeatDelay: Math.random() * 2
                            }}
                            className="absolute left-1/2 top-1/2 w-1 h-1 bg-emerald-400 rounded-full z-0"
                          />
                        ))}
                      </>
                    )}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-5 flex-1">
                        <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-2 -ml-2" onPointerDown={(e) => e.preventDefault()}>
                          <GripVertical size={20} />
                        </div>
                        <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={() => toggleHabit(habit)}>
                          <motion.div 
                            animate={{ 
                              rotate: habit.completed ? [0, -10, 10, 0] : 0,
                              scale: habit.completed ? 1.1 : 1
                            }}
                            className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                              habit.completed 
                                ? "bg-emerald-500 text-white shadow-emerald-500/30" 
                                : "bg-slate-800 text-slate-500 border border-white/5"
                            )}
                          >
                          {(() => {
                            const Icon = LucideIcons[habit.icon as keyof typeof LucideIcons] as any || CheckCircle2;
                            return <Icon size={26} />;
                          })()}
                        </motion.div>
        {/* Habit Card Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={cn(
              "font-bold text-lg transition-colors duration-500",
              habit.completed ? "text-white" : "text-slate-300"
            )}>{habit.name}</h3>
            
            {/* Visual Streak Indicator */}
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-800/50"
                  />
                  <motion.circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="88"
                    initial={{ strokeDashoffset: 88 }}
                    animate={{ strokeDashoffset: 88 - (88 * Math.min(habit.streak / 7, 1)) }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "transition-colors duration-500",
                      habit.completed ? "text-emerald-500" : "text-orange-500"
                    )}
                  />
                  {/* Glowing end cap */}
                  {habit.streak > 0 && (
                    <motion.circle
                      cx={16 + 14 * Math.cos((Math.min(habit.streak / 7, 1) * 360 - 90) * Math.PI / 180)}
                      cy={16 + 14 * Math.sin((Math.min(habit.streak / 7, 1) * 360 - 90) * Math.PI / 180)}
                      r="3"
                      className={cn(
                        "fill-current",
                        habit.completed ? "text-emerald-400" : "text-orange-400"
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </svg>
                <div className="relative z-10 flex items-center justify-center group/flame">
                  <motion.div
                    animate={habit.streak >= 3 ? {
                      scale: [1, 1.1, 1],
                      filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Flame 
                      size={16} 
                      className={cn(
                        "transition-all duration-500",
                        habit.streak > 0 
                          ? habit.completed ? "text-emerald-500" : "text-orange-500" 
                          : "text-slate-700"
                      )} 
                    />
                  </motion.div>
                </div>
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                habit.streak >= 3 ? "text-orange-400" : "text-slate-500"
              )}>{habit.streak}d</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1 underline-offset-4">
            {habit.reminderTime && (
              <div className="flex items-center gap-1">
                <Bell size={10} className={cn("transition-colors", habit.completed ? "text-emerald-500/60" : "text-slate-600")} />
                <span className={cn("text-[10px] font-bold", habit.completed ? "text-emerald-500/60" : "text-slate-600")}>{habit.reminderTime}</span>
              </div>
            )}
            {habit.skippedDates?.includes(format(new Date(), 'yyyy-MM-dd')) && (
              <div className="flex items-center gap-1">
                <SkipForward size={10} className="text-amber-500" />
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Skipped</span>
              </div>
            )}
          </div>
          
          {/* 7-Day History Mini-Grid */}
          <div className="flex items-center gap-1 mt-3">
            {[...Array(7)].map((_, i) => {
              const date = subDays(new Date(), 6 - i);
              const dateStr = format(date, 'yyyy-MM-dd');
              const isCompleted = habit.completionHistory?.includes(dateStr) || (i === 6 && habit.completed);
              const isToday = i === 6;
              
              return (
                <div 
                  key={i}
                  className={cn(
                    "w-6 flex-1 h-1.5 rounded-full transition-all duration-500",
                    isCompleted 
                      ? "bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                      : isToday ? "bg-slate-800 border border-slate-700" : "bg-slate-900 border border-white/5",
                  )}
                  title={format(date, 'MMM d')}
                />
              );
            })}
          </div>
        </div>
                      </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {habit.completed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(`Habit Completed: ${habit.name}`, `I just completed my habit "${habit.name}" on Nourish IQ! Current streak: ${habit.streak} 🔥`);
                            }}
                            className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all flex items-center justify-center border border-white/5"
                            title="Share Habit"
                          >
                            <Share2 size={18} />
                          </button>
                        )}
                        {!habit.completed && !habit.skippedDates?.includes(format(new Date(), 'yyyy-MM-dd')) && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSettingReminder(habit);
                                setReminderTime(habit.reminderTime || '08:00');
                              }}
                              className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all flex items-center justify-center border border-white/5"
                              title="Set Reminder"
                            >
                              <Bell size={18} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSkippingHabit(habit);
                              }}
                              className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-all flex items-center justify-center border border-white/5"
                              title="Skip for Today"
                            >
                              <SkipForward size={18} />
                            </button>
                          </>
                        )}
                        <motion.div 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHabit(habit);
                          }}
                          animate={{ 
                            scale: habit.completed ? [1, 1.2, 1] : 1,
                            backgroundColor: habit.completed ? "rgb(16, 185, 129)" : "rgba(15, 23, 42, 0.5)"
                          }}
                          className={cn(
                            "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
                            habit.completed 
                              ? "border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                              : "border-slate-700"
                          )}
                        >
                          {habit.completed ? (
                            <motion.div
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                            >
                              <CheckCircle2 size={22} strokeWidth={3} />
                            </motion.div>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                          )}
                        </motion.div>
                      </div>
                    </div>

                    {/* Skip Reason Input */}
                    <AnimatePresence>
                      {skippingHabit?.id === habit.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-white/5 relative z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Why are you skipping today?</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Optional reason..." 
                              className="flex-1 bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500/50 transition-all text-slate-100 placeholder:text-slate-700"
                              value={skipReason}
                              onChange={(e) => setSkipReason(e.target.value)}
                              autoFocus
                            />
                            <button 
                              onClick={() => skipHabit(habit, skipReason)}
                              className="px-4 bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-amber-500/20"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => setSkippingHabit(null)}
                              className="p-2 text-slate-500 hover:text-white"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reminder Time Picker */}
                    <AnimatePresence>
                      {settingReminder?.id === habit.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-white/5 relative z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Set Reminder Time</p>
                          <div className="flex gap-2">
                            <input 
                              type="time" 
                              className="flex-1 bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500/50 transition-all text-slate-100"
                              value={reminderTime}
                              onChange={(e) => setReminderTime(e.target.value)}
                              autoFocus
                            />
                            <button 
                              onClick={() => updateHabitReminder(habit, reminderTime)}
                              className="px-4 bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setSettingReminder(null)}
                              className="p-2 text-slate-500 hover:text-white"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {habits.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="tech-card border-emerald-500/10 mt-4 relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                      <Brain size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">AI Habit Coach</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Get personalized advice based on your streaks</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveTab('chat');
                      sendMessage("Analyze my habits and give me some motivational advice for habit formation.");
                    }}
                    className="w-full py-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> Chat with Coach
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div key="achievements" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 py-4">
              <div className="flex items-center justify-between mb-8 px-2">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white tracking-tight">Your Awards</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                      {profile?.achievements?.length || 0} / {ACHIEVEMENTS.length} Unlocked
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 shadow-lg shadow-yellow-500/10">
                  <Trophy size={24} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {ACHIEVEMENTS.map((achievement, index) => {
                  const isUnlocked = profile?.achievements?.includes(achievement.id);
                  return (
                    <motion.div 
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-6 rounded-[2.5rem] border transition-all flex items-center gap-6 relative overflow-hidden group",
                        isUnlocked 
                          ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                          : "tech-card border-white/5 opacity-50 grayscale hover:opacity-70 transition-opacity"
                      )}
                    >
                      {isUnlocked && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                      )}
                      <div className={cn(
                        "w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                        isUnlocked ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-600"
                      )}>
                        {achievement.icon === 'Droplets' && <Droplets size={32} />}
                        {achievement.icon === 'Zap' && <Zap size={32} />}
                        {achievement.icon === 'CheckCircle2' && <CheckCircle2 size={32} />}
                        {achievement.icon === 'Users' && <Users size={32} />}
                        {achievement.icon === 'History' && <History size={32} />}
                        {achievement.icon === 'Trophy' && <Trophy size={32} />}
                      </div>
                      <div className="flex-1 relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-bold text-white">{achievement.title}</h4>
                          {isUnlocked && (
                            <div className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">Unlocked</div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{achievement.description}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                            <Zap size={12} className="fill-emerald-400/20" /> +{achievement.points} XP
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 relative z-10">
                        {isUnlocked ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(`I unlocked ${achievement.title}!`, `I just earned the "${achievement.title}" achievement on Nourish IQ: ${achievement.description}`);
                            }}
                            className="w-10 h-10 bg-slate-800/50 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-emerald-400 transition-all border border-white/5 flex items-center justify-center"
                          >
                            <Share2 size={18} />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-700 border border-white/5">
                            <Lock size={18} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Stats Summary */}
              <div className="tech-card border-yellow-500/10 p-8 mt-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 blur-[100px] rounded-full -mr-24 -mt-24 pointer-events-none" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Milestone Progress</h3>
                    <p className="text-xs text-slate-500 font-medium">Keep going to unlock more rewards!</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Overall Completion</span>
                    <span className="text-yellow-500">{Math.round(((profile?.achievements?.length || 0) / ACHIEVEMENTS.length) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((profile?.achievements?.length || 0) / ACHIEVEMENTS.length) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col h-[calc(100vh-180px)] py-4">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img src="/logo.png" alt="Nourish IQ Logo" className="w-full h-full object-contain drop-shadow-lg" onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }} />
                    <div className="hidden w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <Brain size={24} />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-white tracking-tight">Nourish IQ</h2>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">AI Assistant Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsThinkingMode(!isThinkingMode);
                      if (!isThinkingMode) setIsSearchMode(false);
                    }}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
                      isThinkingMode ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "glass-card text-slate-500"
                    )}
                  >
                    <Brain size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setIsSearchMode(!isSearchMode);
                      if (!isSearchMode) setIsThinkingMode(false);
                    }}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
                      isSearchMode ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "glass-card text-slate-500"
                    )}
                  >
                    <Search size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-4">
                {chatMessages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "items-start")}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                      msg.role === 'user' ? "bg-slate-800 text-slate-400" : "bg-emerald-500 text-white"
                    )}>
                      {msg.role === 'user' ? <User size={18} /> : <Brain size={18} />}
                    </div>
                    <div className={cn(
                      "px-5 py-3.5 rounded-[1.5rem] text-sm leading-relaxed shadow-lg relative group",
                      msg.role === 'user' 
                        ? "tech-card border-white/5 text-slate-100 rounded-tr-none" 
                        : "tech-card border-emerald-500/20 text-slate-200 rounded-tl-none bg-emerald-500/5 backdrop-blur-md"
                    )}>
                      <div className="markdown-body">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                      {msg.role === 'model' && (
                        <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleSpeak(msg.content)}
                            className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors"
                            title="Speak response"
                          >
                            <Volume2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleFeedback(i, 'positive')}
                            className={cn(
                              "p-1.5 transition-colors",
                              msg.feedback === 'positive' ? "text-emerald-500" : "text-slate-500 hover:text-emerald-400"
                            )}
                            title="Helpful"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button 
                            onClick={() => handleFeedback(i, 'negative')}
                            className={cn(
                              "p-1.5 transition-colors",
                              msg.feedback === 'negative' ? "text-red-500" : "text-slate-500 hover:text-red-400"
                            )}
                            title="Not helpful"
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      )}
                      <div className={cn("text-[9px] font-bold uppercase tracking-widest mt-2 opacity-40 flex justify-between items-center", msg.role === 'user' ? "text-right" : "")}>
                        <span>{format(msg.timestamp, 'HH:mm')}</span>
                        {msg.feedback && (
                          <motion.span 
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              "ml-2",
                              msg.feedback === 'positive' ? "text-emerald-500" : "text-red-500"
                            )}
                          >
                            Feedback received
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {chatMessages.length === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap gap-2 mt-4"
                  >
                    {[
                      "What should I eat for lunch?",
                      "Give me a high protein snack idea",
                      "How much water should I drink?",
                      "Analyze my recent meals"
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setChatInput(prompt);
                          sendMessage(prompt);
                        }}
                        className="px-4 py-2 bg-slate-800/50 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 text-xs rounded-full border border-white/5 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </motion.div>
                )}
                
                {isChatting && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 max-w-[80%]"
                  >
                    <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                      <Brain size={18} />
                    </div>
                    <div className="px-5 py-3.5 glass-card text-slate-200 rounded-[1.5rem] rounded-tl-none text-sm shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      </div>
                      <span className="text-xs text-slate-400 ml-2">{isSearchMode ? "Searching..." : isThinkingMode ? "Thinking deeply..." : "Typing..."}</span>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Quick Prompts */}
              <div className="flex gap-2 overflow-x-auto pb-4 px-2 no-scrollbar">
                {[
                  { label: "Habit Advice", prompt: "Analyze my habits and give me some motivational advice for habit formation." },
                  { label: "Nutrition Trends", prompt: "What are the latest nutrition trends I should know about?" },
                  { label: "Meal Ideas", prompt: "Based on my history, what should I eat for my next meal?" },
                  { label: "Streak Tips", prompt: "How can I maintain my habit streaks more effectively?" }
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.prompt)}
                    className="whitespace-nowrap px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-all"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 glass-card rounded-3xl p-2 flex gap-2 border border-white/10 shadow-2xl">
                <button 
                  onClick={() => setShouldSpeakResponse(!shouldSpeakResponse)}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    shouldSpeakResponse ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" : "bg-slate-800/50 text-slate-500 hover:text-emerald-400"
                  )}
                  title="Toggle Voice Output"
                >
                  <Volume2 size={20} />
                </button>
                <button 
                  onClick={toggleListening}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    isListening ? "bg-red-500 text-white animate-pulse shadow-red-500/20" : "bg-slate-800/50 text-slate-500 hover:text-emerald-400"
                  )}
                  title="Voice Input"
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Ask NORI AI about your nutrition..." 
                    className="w-full bg-transparent px-2 py-3 text-sm outline-none text-slate-100 placeholder:text-slate-600" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') { 
                        sendMessage(chatInput); 
                        setChatInput(''); 
                      } 
                    }} 
                  />
                </div>
                <button 
                  onClick={() => {
                    sendMessage(chatInput);
                    setChatInput('');
                  }}
                  disabled={!chatInput.trim() || isChatting}
                  className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
                >
                  <Send size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div key="community" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col h-[calc(100vh-180px)] py-4">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-white tracking-tight">Community</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <button 
                        onClick={() => setCommunityTab('chat')}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest transition-all",
                          communityTab === 'chat' ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        Live Chat
                      </button>
                      <div className="w-1 h-1 bg-slate-800 rounded-full" />
                      <button 
                        onClick={() => setCommunityTab('messages')}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest transition-all",
                          communityTab === 'messages' ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        Inbox
                      </button>
                      <div className="w-1 h-1 bg-slate-800 rounded-full" />
                      <button 
                        onClick={() => setCommunityTab('friends')}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest transition-all",
                          communityTab === 'friends' ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        Friends
                      </button>
                      <button 
                        onClick={() => setCommunityTab('leagues')}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest transition-all",
                          communityTab === 'leagues' ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        Leagues
                      </button>
                    </div>
                  </div>
                </div>
                {communityTab === 'chat' && (
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-full border border-white/5">
                    {communityMessages.length} Messages
                  </div>
                )}
              </div>

              {communityTab === 'chat' && (
                <>
                  {/* Community Search Bar */}
                  <div className="px-2 mb-6">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                        <Search size={18} className="text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Search conversations..." 
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-100 placeholder:text-slate-700 shadow-inner"
                        value={communitySearchQuery}
                        onChange={(e) => setCommunitySearchQuery(e.target.value)}
                      />
                      {communitySearchQuery && (
                        <button 
                          onClick={() => setCommunitySearchQuery('')}
                          className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-4">
                    {communityMessages
                      .filter(msg => 
                        msg.content.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
                        msg.displayName.toLowerCase().includes(communitySearchQuery.toLowerCase())
                      ).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-700 mb-4 border border-white/5">
                            <Search size={32} />
                          </div>
                          <p className="text-slate-500 font-medium">No messages found matching "{communitySearchQuery}"</p>
                          <button 
                            onClick={() => setCommunitySearchQuery('')}
                            className="mt-4 text-blue-400 text-xs font-bold uppercase tracking-widest hover:text-blue-300 transition-colors"
                          >
                            Clear Search
                          </button>
                        </div>
                      ) : (
                        communityMessages
                          .filter(msg => 
                            msg.content.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
                            msg.displayName.toLowerCase().includes(communitySearchQuery.toLowerCase())
                          )
                          .map((msg) => (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={msg.id} 
                            className={cn("flex gap-4 max-w-[85%] group", msg.uid === user?.uid ? "ml-auto flex-row-reverse" : "items-start")}
                          >
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg cursor-pointer hover:scale-105 transition-transform animate-float" onClick={() => fetchUserProfile(msg.uid)}>
                          <AnimatedAvatar src={msg.photoURL} alt={msg.displayName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col relative">
                          <div 
                            onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                            className={cn(
                              "px-5 py-3 rounded-[1.5rem] text-sm leading-relaxed shadow-sm relative cursor-pointer transition-all",
                              msg.uid === user?.uid 
                                ? "bg-blue-600 text-white rounded-tr-none" 
                                : "glass-card text-slate-200 rounded-tl-none",
                              selectedMessageId === msg.id && (msg.uid === user?.uid ? "ring-2 ring-blue-400" : "ring-2 ring-blue-500/50")
                            )}
                          >
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                msg.uid !== user?.uid && handleUserClick(msg.uid, msg.displayName, msg.photoURL);
                              }}
                              className={cn("text-[9px] font-black uppercase tracking-widest mb-1 opacity-70", msg.uid !== user?.uid && "cursor-pointer hover:text-blue-400 transition-colors", msg.uid === user?.uid ? "text-right" : "")}
                            >
                              {msg.displayName}
                            </div>
                            <p dir="auto">{msg.content}</p>
                            <div className={cn(
                              "absolute top-1/2 -translate-y-1/2 flex flex-col gap-1 transition-all z-20",
                              selectedMessageId === msg.id ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:scale-100 lg:group-hover:pointer-events-auto",
                              msg.uid === user?.uid ? "-left-12" : "-right-12"
                            )}>
                              {msg.uid !== user?.uid && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReportingMessage(msg);
                                    setSelectedMessageId(null);
                                  }}
                                  className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-red-500 transition-colors border border-white/5 shadow-xl"
                                  title="Report Message"
                                >
                                  <Flag size={14} />
                                </button>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(`Community Message from ${msg.displayName}`, msg.content);
                                  setSelectedMessageId(null);
                                }}
                                className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-blue-400 transition-colors border border-white/5 shadow-xl"
                                title="Share Message"
                              >
                                <Share2 size={14} />
                              </button>
                              {msg.uid !== user?.uid && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startPrivateChat({ uid: msg.uid, displayName: msg.displayName, photoURL: msg.photoURL });
                                    setSelectedMessageId(null);
                                  }}
                                  className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors border border-white/5 shadow-xl"
                                  title="Inbox"
                                >
                                  <MessageSquare size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          <span className={cn("text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-tighter", msg.uid === user?.uid ? "text-right" : "")}>
                            {format(msg.timestamp, 'HH:mm')}
                          </span>
                        </div>
                      </motion.div>
                    )))}
                  </div>
                  
                  <div className="mt-4 glass-card rounded-3xl p-2 flex gap-2 border border-white/10 shadow-2xl">
                    <input 
                      type="text" 
                      dir="auto"
                      placeholder="Share your progress with others..." 
                      className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-slate-100 placeholder:text-slate-600" 
                      value={communityInput}
                      onChange={(e) => setCommunityInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendCommunityMessage(); }} 
                    />
                    <button 
                      onClick={sendCommunityMessage}
                      disabled={!communityInput.trim()}
                      className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </>
              )}

              {communityTab === 'friends' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {/* Friend Requests */}
                    {friendRequests.filter(r => r.receiverId === user?.uid && r.status === 'pending').length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Friend Requests</h3>
                        <div className="space-y-3">
                          {friendRequests.filter(r => r.receiverId === user?.uid && r.status === 'pending').map(request => {
                            // We need to fetch the sender's profile, but for now we'll just show the ID or a placeholder if we don't have it
                            // A better approach would be to fetch the sender's profile when the request comes in, but we'll keep it simple here
                            return (
                              <div key={request.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                                    <User size={20} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">Someone wants to connect</p>
                                    <p className="text-[10px] text-slate-500">Pending request</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => acceptFriendRequest(request.id)}
                                    className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button 
                                    onClick={() => removeFriend(request.id)}
                                    className="w-8 h-8 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Friends List */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Your Friends ({friends.length})</h3>
                      {friends.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="py-12 text-center glass-card rounded-[2rem] border-dashed border-2 border-white/5"
                        >
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full flex items-center justify-center text-blue-500/50 mx-auto mb-4 relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                            <Users size={32} className="relative z-10" />
                          </div>
                          <h3 className="text-lg font-display font-bold text-white mb-2">No Friends Yet</h3>
                          <p className="text-slate-400 text-sm max-w-[200px] mx-auto mb-6">Connect with others to share your journey and compete in leagues.</p>
                          <button 
                            onClick={() => {
                              setCommunityTab('chat');
                              // Assuming there's a way to trigger search or just go to chat
                            }}
                            className="px-6 py-3 bg-blue-500/10 text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 mx-auto"
                          >
                            <MessageSquare size={16} />
                            Join Live Chat
                          </button>
                        </motion.div>
                      ) : (
                        <div className="space-y-3">
                          {friends.map(friend => (
                            <div 
                              key={friend.uid} 
                              className="glass-card p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-colors cursor-pointer"
                              onClick={() => handleUserClick(friend.uid, friend.displayName, friend.photoURL)}
                            >
                              <div className="flex items-center gap-4">
                                <AnimatedAvatar src={friend.photoURL} alt={friend.displayName} className="w-12 h-12 rounded-xl object-cover animate-float" />
                                <div>
                                  <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{friend.displayName}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                                      <Zap size={10} /> {friend.points || 0}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startPrivateChat({ uid: friend.uid, displayName: friend.displayName, photoURL: friend.photoURL });
                                }}
                                className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"
                              >
                                <MessageSquare size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {communityTab === 'messages' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {!activeChat ? (
                    <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                      {/* User Search Bar */}
                      <div className="px-2">
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Search users by name..." 
                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-100 placeholder:text-slate-600"
                            value={userSearchQuery}
                            onChange={(e) => {
                              setUserSearchQuery(e.target.value);
                              searchUsers(e.target.value);
                            }}
                          />
                          {userSearchQuery && (
                            <button 
                              onClick={() => {
                                setUserSearchQuery('');
                                setUserSearchResults([]);
                              }}
                              className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>

                        {/* Search Results */}
                        <AnimatePresence>
                          {userSearchQuery && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mt-4 space-y-2"
                            >
                              {isSearchingUsers ? (
                                <div className="flex items-center justify-center py-8">
                                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : userSearchResults.length === 0 ? (
                                <p className="text-center py-8 text-slate-500 text-xs">No users found matching "{userSearchQuery}"</p>
                              ) : (
                                userSearchResults.map(result => (
                                  <motion.div
                                    key={result.uid}
                                    whileHover={{ x: 4 }}
                                    onClick={() => {
                                      fetchUserProfile(result.uid);
                                      setUserSearchQuery('');
                                      setUserSearchResults([]);
                                    }}
                                    className="glass-card p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:border-blue-500/30 transition-all"
                                  >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 animate-float">
                                      <AnimatedAvatar src={result.photoURL} alt={result.displayName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-sm font-bold text-white">{result.displayName}</h4>
                                      <p className="text-[10px] text-slate-500">{result.points || 0} Points</p>
                                    </div>
                                    <MessageSquare size={16} className="text-blue-500" />
                                  </motion.div>
                                ))
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Discover Users */}
                      {!userSearchQuery && (
                        <div className="px-2">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4">Discover Active Users</h3>
                          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar-hide">
                            {Array.from(new Map(communityMessages.filter(m => m.uid !== user?.uid).map(m => [m.uid, m])).values()).map(msg => (
                              <motion.button
                                key={msg.uid}
                                whileHover={{ y: -4 }}
                                onClick={() => fetchUserProfile(msg.uid)}
                                className="flex flex-col items-center gap-2 flex-shrink-0 group"
                              >
                                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/5 group-hover:border-blue-500/50 transition-all shadow-xl relative animate-float">
                                  <AnimatedAvatar src={msg.photoURL} alt={msg.displayName} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors truncate max-w-[60px]">{msg.displayName.split(' ')[0]}</span>
                              </motion.button>
                            ))}
                            {communityMessages.filter(m => m.uid !== user?.uid).length === 0 && (
                              <p className="text-[10px] text-slate-600 italic">No other active users found yet.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recent Chats */}
                      {!userSearchQuery && (
                        <div className="px-2">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4">Recent Conversations</h3>
                          {privateChats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center tech-card border-dashed border-white/5">
                              <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-600 mb-4 border border-white/5 shadow-inner">
                                <MessageSquare size={28} />
                              </div>
                              <p className="text-slate-500 text-xs font-black uppercase tracking-widest opacity-60">No private conversations yet</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {privateChats.map(chat => (
                                <motion.div 
                                  key={chat.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="tech-card border-white/5 hover:border-blue-500/20 group relative cursor-pointer"
                                >
                                  <div className="flex-1 flex items-center gap-4 min-w-0">
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (chat.otherParticipant) fetchUserProfile(chat.otherParticipant.uid);
                                      }}
                                      className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 hover:scale-105 transition-transform z-10 animate-float"
                                    >
                                      <AnimatedAvatar src={chat.otherParticipant?.photoURL} alt={chat.otherParticipant?.displayName} className="w-full h-full object-cover" />
                                    </div>
                                    <div onClick={() => setActiveChat(chat)} className="flex-1 min-w-0">
                                      <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-white truncate text-sm">{chat.otherParticipant?.displayName}</h4>
                                        {chat.lastMessageTimestamp && (
                                          <span className="text-[9px] text-slate-500 font-bold uppercase">{format(chat.lastMessageTimestamp instanceof Timestamp ? chat.lastMessageTimestamp.toDate() : new Date(chat.lastMessageTimestamp), 'MMM d')}</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-400 truncate pr-8">{chat.lastMessage || 'No messages yet'}</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePrivateChat(chat.id);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Conversation"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveChat(null)}
                            className="p-2 text-slate-500 hover:text-white transition-colors"
                          >
                            <ArrowLeft size={18} />
                          </button>
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg animate-float">
                            <AnimatedAvatar src={activeChat.otherParticipant?.photoURL} alt={activeChat.otherParticipant?.displayName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{activeChat.otherParticipant?.displayName}</h4>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Now</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => deletePrivateChat(activeChat.id)}
                          className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                          title="Delete Chat"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-4 px-2">
                        {privateMessages.map((msg, i) => {
                          const isFirstFromSender = i === 0 || privateMessages[i-1].senderUid !== msg.senderUid;
                          return (
                            <motion.div 
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn("flex max-w-[85%]", msg.senderUid === user?.uid ? "ml-auto" : "")}
                            >
                              <div 
                                onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                                className={cn(
                                  "px-5 py-3 rounded-[1.5rem] text-sm leading-relaxed shadow-sm relative group/msg cursor-pointer transition-all",
                                  msg.senderUid === user?.uid 
                                    ? "bg-blue-600 text-white rounded-tr-none" 
                                    : "glass-card text-slate-200 rounded-tl-none",
                                  !isFirstFromSender && "mt-1",
                                  selectedMessageId === msg.id && (msg.senderUid === user?.uid ? "ring-2 ring-blue-400" : "ring-2 ring-blue-500/50")
                                )}
                              >
                                <p dir="auto">{msg.content}</p>
                                <div className={cn("text-[8px] font-black mt-1 opacity-40 uppercase tracking-tighter", msg.senderUid === user?.uid ? "text-right" : "")}>
                                  {format(msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date(msg.timestamp), 'HH:mm')}
                                </div>
                                {msg.senderUid === user?.uid && (
                                  <div className={cn(
                                    "absolute top-1/2 -translate-y-1/2 transition-all z-20",
                                    selectedMessageId === msg.id ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none group-hover/msg:opacity-100 group-hover/msg:scale-100 group-hover/msg:pointer-events-auto",
                                    msg.senderUid === user?.uid ? "-left-10" : "-right-10"
                                  )}>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deletePrivateMessage(msg.id);
                                        setSelectedMessageId(null);
                                      }}
                                      className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-red-400 transition-colors border border-white/5 shadow-xl"
                                      title="Delete Message"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-4 glass-card rounded-3xl p-2 flex gap-2 border border-white/10 shadow-2xl mx-2">
                        <input 
                          type="text" 
                          dir="auto"
                          placeholder="Type a message..." 
                          className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-slate-100 placeholder:text-slate-600" 
                          value={privateInput}
                          onChange={(e) => setPrivateInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendPrivateMessage(); }} 
                        />
                        <button 
                          onClick={sendPrivateMessage}
                          disabled={!privateInput.trim()}
                          className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {communityTab === 'leagues' && (
                <div className="flex-1 flex flex-col overflow-hidden space-y-6 overflow-y-auto custom-scrollbar pr-2">
                  {/* Boss Battle Section */}
                  <div className="tech-card border-amber-500/20 relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-colors pointer-events-none" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
                          <Swords size={24} />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-white text-lg">{communityGoal.title}</h3>
                          <p className="text-xs text-slate-400">{communityGoal.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 relative z-10">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Boss</p>
                          <p className="font-bold text-amber-400">{communityGoal.bossName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Boss Health</p>
                          <p className="font-bold text-white">{communityGoal.bossHealth}%</p>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${communityGoal.bossHealth}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-red-500 to-amber-500"
                        />
                      </div>
                      <p className="text-center text-[10px] text-slate-500 mt-3 font-bold uppercase tracking-widest">
                        {communityGoal.current} / {communityGoal.target} logged by community
                      </p>
                    </div>
                  </div>

                  {/* Leaderboard Section */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Global Leaderboard</h3>
                    <div className="space-y-2">
                      {leaderboard.map((user, index) => (
                        <div key={user.uid} className="tech-card border-white/5 hover:border-white/10 flex items-center gap-4 transition-all hover:scale-[1.01]">
                          <div className="w-8 text-center font-display font-black text-slate-500 text-lg">
                            {index + 1}
                          </div>
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 animate-float">
                            <AnimatedAvatar src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-sm">{user.displayName}</h4>
                            <p className="text-xs text-slate-400">{user.achievements?.length || 0} Achievements</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-400">{user.points || 0}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Points</p>
                          </div>
                        </div>
                      ))}
                      {leaderboard.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-sm">
                          Loading leaderboard...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8 py-4">
              <div className="flex items-center justify-between px-2">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group"
                >
                  <div className="w-9 h-9 glass-card rounded-xl flex items-center justify-center group-hover:bg-white/5 transition-all">
                    <ArrowLeft size={18} />
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
                        <User size={48} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-display font-bold text-white tracking-tight">{profile?.displayName}</h2>
                  <p className="text-slate-500 text-sm font-medium">{user?.email}</p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <div className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/20 flex items-center gap-2 uppercase tracking-widest">
                      <Zap size={14} className="fill-emerald-500/20" /> {profile?.points || 0} Points
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
                      <Share2 size={16} />
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
                    <Settings size={20} />
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
                      <Target size={14} className="text-emerald-500" /> Daily Macro Goals
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
                      <Activity size={14} className="text-blue-500" /> Body Metrics
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
                      <Brain size={14} className="text-purple-500" /> AI Personality
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'empathetic', label: 'Supportive', icon: Heart, color: 'text-pink-400' },
                        { id: 'strict', label: 'Strict Coach', icon: ShieldAlert, color: 'text-red-400' },
                        { id: 'scientific', label: 'Data Driven', icon: Activity, color: 'text-blue-400' },
                        { id: 'playful', label: 'Fun Buddy', icon: Zap, color: 'text-amber-400' },
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
                    <Save size={20} className="group-hover:scale-110 transition-transform" /> 
                    Save Changes
                  </button>

                  <button 
                    onClick={() => auth.signOut()}
                    className="w-full py-4 bg-slate-900 border border-white/5 text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <LogOut size={18} />
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
                      <ShieldAlert size={20} />
                    </div>
                    <h3 className="font-display font-bold text-lg text-white">Security & Privacy</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                          <CheckCircle2 size={16} />
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
                          <ShieldAlert size={16} />
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

                <div className="pt-8 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Developer</h4>
                      <p className="text-sm font-bold text-white">Frankline Mwangi</p>
                      <p className="text-[10px] text-slate-500 font-medium">franklinemwangi0259@gmail.com</p>
                    </div>
                    <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-emerald-500">
                      <Activity size={24} />
                    </div>
                  </div>

                  <div className="space-y-4 bg-slate-950/30 p-5 rounded-[1.5rem] border border-white/5">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <Star size={14} /> Rate Nourish IQ
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
                                // Optional: save rating to backend here
                              }}
                              className="relative p-1 transition-transform hover:scale-110 focus:outline-none"
                            >
                              <Star 
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

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      onClick={logout}
                      className="py-4 glass-card text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                    >
                      <LogOut size={20} /> Sign Out
                    </button>
                    <button 
                      onClick={async () => {
                        await logout();
                        handleSignIn();
                      }}
                      className="py-4 glass-card text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all"
                    >
                      <User size={20} /> Switch
                    </button>
                  </div>

                  <div className="pt-6 pb-2 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">&copy; 2026 Nourish IQ</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <motion.nav 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-[100]"
      >
        <div className="relative group flex justify-between items-center bg-slate-950/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 rounded-[2rem] px-2 py-2 overflow-visible">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none rounded-[2rem]" />
          {[
            { id: 'dashboard', icon: Activity, label: 'Home' },
            { id: 'logs', icon: History, label: 'Logs' },
            { id: 'community', icon: Users, label: 'Social' },
            { id: 'habits', icon: CheckCircle2, label: 'Habit' },
            { id: 'achievements', icon: Trophy, label: 'Award' },
            { id: 'chat', icon: Brain, label: 'AI' }
          ].map((tab, i) => (
            <React.Fragment key={tab.id}>
              {i === 3 && <div className="w-12 h-10 flex-shrink-0" />}
              <button
                onClick={() => setActiveTab(tab.id as any)}
                className="flex flex-col items-center flex-1 min-w-0 group relative py-1 z-10"
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 relative",
                  activeTab === tab.id 
                    ? "text-emerald-400 bg-emerald-500/10" 
                    : "text-slate-500 hover:text-slate-300"
                )}>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="tab-active-bg"
                      className="absolute inset-0 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    />
                  )}
                  <tab.icon size={18} className={cn("relative z-10", activeTab === tab.id && "drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]")} strokeWidth={2.5} />
                </div>
                <span className={cn(
                  "text-[6px] font-black uppercase tracking-widest transition-all duration-500 truncate w-full text-center px-1",
                  activeTab === tab.id ? "text-emerald-400 opacity-100" : "text-slate-600 opacity-60"
                )}>
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="tab-underline"
                    className="absolute -bottom-1 w-1 h-1 bg-emerald-400 rounded-full"
                  />
                )}
              </button>
            </React.Fragment>
          ))}

          {/* Center Float Button */}
          <motion.div
            className="absolute -top-7 left-1/2 -translate-x-1/2 z-30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <motion.button 
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => startCamera()} 
              className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-[1.75rem] flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.5)] transform transition-all border-4 border-[#020617] relative group"
            >
              <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
              <div className="absolute inset-0 bg-white/20 rounded-[1.75rem] opacity-0 group-active:opacity-100 transition-opacity" />
              
              {/* Outer Glow */}
              <div className="absolute inset-x-0 -bottom-2 h-4 bg-emerald-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
            </motion.button>
          </motion.div>
        </div>
      </motion.nav>

      {/* Camera Overlay */}
      <AnimatePresence>
        {showCamera && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="p-6 flex justify-between items-center text-white">
              <button onClick={stopCamera} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                <X size={24} />
              </button>
              <span className="font-display font-bold">Analyze Meal</span>
              <div className="flex gap-2">
                <button 
                  onClick={toggleTorch}
                  className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", torchEnabled ? "bg-yellow-500/50" : "bg-white/10 hover:bg-white/20")}
                >
                  <Zap size={20} />
                </button>
                <button 
                  onClick={switchCamera}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={cn(
                  "h-full w-full object-cover",
                  cameraFacingMode === 'user' && "scale-x-[-1]"
                )} 
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="0.5" 
                  value={zoomLevel} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="h-32 accent-white rotate-180"
                  style={{ writingMode: 'vertical-lr' }}
                />
              </div>
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/50 rounded-3xl border-dashed relative">
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                    <span className="text-xs font-bold text-white tracking-widest uppercase">Point at your meal</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-12 flex justify-center items-center gap-8 bg-black">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <Upload size={24} />
              </button>
              
              <button onClick={handleCapture} className="w-20 h-20 rounded-full border-4 border-white p-1 group">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-black group-active:scale-95 transition-transform">
                  <Camera size={32} />
                </div>
              </button>
              
              <button 
                onClick={() => setActiveTab('logs')}
                className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <History size={24} />
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyzing Overlay */}
      <AnimatePresence>
        {showClassModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="tech-card w-full max-w-md border-white/10 relative">
              <button onClick={() => setShowClassModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              <h2 className="text-2xl font-display font-black text-white mb-6 uppercase tracking-tight">User Classes</h2>
              <div className="space-y-4">
                {USER_CLASSES.map((c) => {
                  const Icon = LucideIcons[c.icon as keyof typeof LucideIcons] as React.ElementType;
                  const isUnlocked = (profile?.points || 0) >= c.minPoints && (habits.reduce((max, h) => Math.max(max, h.streak), 0) >= c.minStreak);
                  return (
                    <div key={c.id} className={cn("p-5 rounded-3xl border flex items-center gap-4 transition-all", isUnlocked ? "bg-slate-900/50 border-emerald-500/20 shadow-lg shadow-emerald-500/5" : "bg-slate-950/20 border-white/5 opacity-40 grayscale")}>
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", c.bg, c.color)}><Icon size={28} /></div>
                      <div>
                        <h4 className="font-bold text-white text-base">{c.name}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{c.minPoints}+ Points • {c.minStreak}+ Day Streak</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyzing Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-emerald-500/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-12 text-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6"
            >
              <Brain size={32} />
            </motion.div>
            <h2 className="text-2xl font-display font-bold mb-2">Analyzing...</h2>
            <p className="text-emerald-100 font-medium">NORI <span className="font-bold">AI</span> is calculating nutrition facts.</p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Share Modal */}
      <AnimatePresence>
        {shareContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="tech-card w-full max-w-sm border-white/10 group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-10 -mt-10 pointer-events-none" />
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Share</h3>
                <button onClick={() => setShareContent(null)} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={triggerNativeShare}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-left transition-all border border-white/5"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Share via Web</h4>
                    <p className="text-xs text-slate-400">Social media, copy link, etc.</p>
                  </div>
                </button>

                <button 
                  onClick={shareToCommunity}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-left transition-all border border-white/5"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Share to Community</h4>
                    <p className="text-xs text-slate-400">Post to the public feed</p>
                  </div>
                </button>

                <div className="pt-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Send in Inbox</h4>
                  {privateChats.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {privateChats.map(chat => (
                        <button 
                          key={chat.id}
                          onClick={() => shareToPrivateChat(chat.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-800/30 hover:bg-slate-800 text-left transition-all border border-white/5"
                        >
                          <AnimatedAvatar src={chat.otherParticipant?.photoURL || AVATARS[0]} alt="Avatar" className="w-8 h-8 rounded-full animate-float" />
                          <span className="font-bold text-sm text-white truncate">{chat.otherParticipant?.displayName || 'User'}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2">No private chats yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
    </div>
  );
}
