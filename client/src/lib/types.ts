export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  partnerId?: number;
  inviteCode?: string;
}

export interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  vibe?: string;
  originalContent?: string;
  timestamp: Date;
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

export type VibeOption = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export const vibeOptions: VibeOption[] = [
  {
    id: 'compassionate',
    name: 'Compassionate',
    icon: 'fa-heart',
    color: 'text-rose-500'
  },
  {
    id: 'direct',
    name: 'Direct',
    icon: 'fa-bolt',
    color: 'text-amber-500'
  },
  {
    id: 'playful',
    name: 'Playful',
    icon: 'fa-smile',
    color: 'text-amber-500'
  },
  {
    id: 'supportive',
    name: 'Supportive',
    icon: 'fa-hands-helping',
    color: 'text-primary'
  },
  {
    id: 'reflective',
    name: 'Reflective',
    icon: 'fa-brain',
    color: 'text-purple-500'
  },
  {
    id: 'appreciative',
    name: 'Appreciative',
    icon: 'fa-star',
    color: 'text-amber-500'
  },
  {
    id: 'neutral',
    name: 'Neutral',
    icon: 'fa-balance-scale',
    color: 'text-neutral-500'
  }
];
