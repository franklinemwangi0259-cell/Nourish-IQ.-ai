
export interface FoodLog {
  id: string;
  timestamp: Date;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  vitamins?: string[];
  isHealthy?: boolean;
  healthReason?: string;
  imageUrl?: string;
  uid: string;
  mood?: string;
  energy?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  targetCalories: number;
  waterIntakeGoal: number;
  points: number;
  achievements: string[];
  aiPersonality?: 'empathetic' | 'strict' | 'scientific' | 'playful';
  friends?: string[];
  friendRequests?: string[];
  hasCompletedOnboarding?: boolean;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  points: number;
  achievements: string[];
  friends?: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: string;
  points: number;
}

export interface CommunityMessage {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  content: string;
  timestamp: Date;
}

export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  streak: number;
  icon: string;
  uid: string;
  lastUpdated?: any;
  reminderTime?: string;
  skippedDates?: string[];
  skipReasons?: Record<string, string>;
  order?: number;
  completionHistory?: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
}

export interface DailyStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  vitamins?: string[];
  waterIntake: number;
  targetCalories: number;
  waterIntakeGoal: number;
}

export interface PrivateChat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: any;
  updatedAt: any;
  otherParticipant?: PublicProfile;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted';
  timestamp: any;
}

export interface PrivateMessage {
  id: string;
  senderUid: string;
  content: string;
  timestamp: any;
}
