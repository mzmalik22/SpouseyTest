export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  partnerId?: number;
  inviteCode?: string;
  maritalStatus?: string;
  relationshipCondition?: string;
  onboardingCompleted?: boolean;
  nickname?: string;
  partnerNickname?: string;
  seesTherapist?: boolean;
}

export interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  vibe?: string;
  originalContent?: string;
  timestamp: Date;
  read?: boolean;
}

export interface CoachingTopic {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface CoachingContent {
  id: number;
  topicId: number;
  title: string;
  content: string;
  order: number;
}

export interface Activity {
  id: number;
  userId: number;
  type: string;
  description: string;
  timestamp: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'message' | 'activity' | 'coaching' | 'partner' | 'system';
  title: string;
  content: string;
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  relatedId?: number;
}

export type VibeOption = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
};

export const vibeOptions: VibeOption[] = [
  {
    id: 'affectionate',
    name: 'Affectionate',
    icon: 'fa-heart',
    color: 'text-rose-500',
    description: 'Warm, loving, and caring tone that expresses fondness and tenderness'
  },
  {
    id: 'concerned',
    name: 'Concerned',
    icon: 'fa-exclamation-circle',
    color: 'text-blue-500',
    description: 'Shows genuine care and worry about your partner\'s wellbeing'
  },
  {
    id: 'apologetic',
    name: 'Apologetic',
    icon: 'fa-hand-holding-heart',
    color: 'text-purple-500',
    description: 'Expresses sincere regret and takes responsibility'
  },
  {
    id: 'playful',
    name: 'Playful',
    icon: 'fa-smile',
    color: 'text-amber-500',
    description: 'Light-hearted, fun, and engaging with a touch of humor'
  },
  {
    id: 'excited',
    name: 'Excited',
    icon: 'fa-star',
    color: 'text-yellow-500',
    description: 'Enthusiastic and energetic with a sense of anticipation'
  },
  {
    id: 'flirty',
    name: 'Flirty',
    icon: 'fa-kiss-wink-heart',
    color: 'text-pink-500',
    description: 'Playfully romantic with subtle romantic innuendo'
  },
  {
    id: 'funny',
    name: 'Funny',
    icon: 'fa-laugh',
    color: 'text-green-500',
    description: 'Humorous and witty with a focus on making your partner laugh'
  }
];
