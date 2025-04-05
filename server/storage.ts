import { v4 as uuidv4 } from 'uuid';
import {
  users, 
  messages, 
  coachingTopics, 
  coachingContents, 
  activities,
  type User, 
  type InsertUser, 
  type Message, 
  type InsertMessage, 
  type CoachingTopic, 
  type InsertCoachingTopic, 
  type CoachingContent, 
  type InsertCoachingContent,
  type Activity,
  type InsertActivity
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByInviteCode(inviteCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Message methods
  getMessages(userId1: number, userId2: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Coaching methods
  getCoachingTopics(): Promise<CoachingTopic[]>;
  getCoachingTopic(id: number): Promise<CoachingTopic | undefined>;
  createCoachingTopic(topic: InsertCoachingTopic): Promise<CoachingTopic>;
  getCoachingContents(topicId: number): Promise<CoachingContent[]>;
  createCoachingContent(content: InsertCoachingContent): Promise<CoachingContent>;
  
  // Activity methods
  getUserActivities(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Initialize with sample data
  initializeSampleData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private coachingTopics: Map<number, CoachingTopic>;
  private coachingContents: Map<number, CoachingContent>;
  private activities: Map<number, Activity>;
  private userIdCounter: number;
  private messageIdCounter: number;
  private topicIdCounter: number;
  private contentIdCounter: number;
  private activityIdCounter: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.coachingTopics = new Map();
    this.coachingContents = new Map();
    this.activities = new Map();
    this.userIdCounter = 1;
    this.messageIdCounter = 1;
    this.topicIdCounter = 1;
    this.contentIdCounter = 1;
    this.activityIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByInviteCode(inviteCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.inviteCode === inviteCode,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const inviteCode = uuidv4().substring(0, 8);
    const user: User = { ...insertUser, id, inviteCode };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Message methods
  async getMessages(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === userId1 && message.recipientId === userId2) ||
        (message.senderId === userId2 && message.recipientId === userId1)
    ).sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateA - dateB;
    });
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const timestamp = new Date();
    const message: Message = { ...insertMessage, id, timestamp };
    this.messages.set(id, message);
    return message;
  }

  // Coaching methods
  async getCoachingTopics(): Promise<CoachingTopic[]> {
    return Array.from(this.coachingTopics.values());
  }

  async getCoachingTopic(id: number): Promise<CoachingTopic | undefined> {
    return this.coachingTopics.get(id);
  }

  async createCoachingTopic(insertTopic: InsertCoachingTopic): Promise<CoachingTopic> {
    const id = this.topicIdCounter++;
    const topic: CoachingTopic = { ...insertTopic, id };
    this.coachingTopics.set(id, topic);
    return topic;
  }

  async getCoachingContents(topicId: number): Promise<CoachingContent[]> {
    return Array.from(this.coachingContents.values())
      .filter(content => content.topicId === topicId)
      .sort((a, b) => a.order - b.order);
  }

  async createCoachingContent(insertContent: InsertCoachingContent): Promise<CoachingContent> {
    const id = this.contentIdCounter++;
    const content: CoachingContent = { ...insertContent, id };
    this.coachingContents.set(id, content);
    return content;
  }

  // Activity methods
  async getUserActivities(userId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });

    return limit ? activities.slice(0, limit) : activities;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const timestamp = new Date();
    const activity: Activity = { ...insertActivity, id, timestamp };
    this.activities.set(id, activity);
    return activity;
  }

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    // Create sample users
    const user1 = await this.createUser({
      username: "john_doe",
      password: "password123",
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
    });

    const user2 = await this.createUser({
      username: "jane_doe",
      password: "password123",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Doe",
    });

    // Connect partners
    await this.updateUser(user1.id, { partnerId: user2.id });
    await this.updateUser(user2.id, { partnerId: user1.id });

    // Create sample messages
    await this.createMessage({
      senderId: user2.id,
      recipientId: user1.id,
      content: "Hey, I was wondering if you'd like to go out for dinner tonight? I found this new place downtown.",
    });

    await this.createMessage({
      senderId: user1.id,
      recipientId: user2.id,
      content: "That sounds wonderful! I'd love to try the new place. What time were you thinking?",
      vibe: "Supportive",
      originalContent: "Sounds good. What time?",
    });

    await this.createMessage({
      senderId: user2.id,
      recipientId: user1.id,
      content: "How about 7:30? I can make a reservation.",
    });

    await this.createMessage({
      senderId: user1.id,
      recipientId: user2.id,
      content: "7:30 works perfectly for me! I'm excited to spend the evening with you.",
      vibe: "Appreciative",
      originalContent: "7:30 is fine.",
    });

    // Create coaching topics
    const communicationTopic = await this.createCoachingTopic({
      title: "Communication Skills",
      description: "Learn how to communicate more effectively with your partner",
      icon: "fa-comments",
    });

    const conflictTopic = await this.createCoachingTopic({
      title: "Resolving Conflicts",
      description: "Learn effective strategies to address disagreements constructively",
      icon: "fa-heart-broken",
    });

    const intimacyTopic = await this.createCoachingTopic({
      title: "Building Intimacy",
      description: "Deepen your connection and strengthen your bond",
      icon: "fa-star",
    });

    const goalsTopic = await this.createCoachingTopic({
      title: "Shared Goals",
      description: "Work together to achieve your relationship goals",
      icon: "fa-balance-scale",
    });

    const qualityTimeTopic = await this.createCoachingTopic({
      title: "Quality Time",
      description: "Make the most of your time together",
      icon: "fa-calendar-check",
    });

    // Create content for conflict resolution topic
    await this.createCoachingContent({
      topicId: conflictTopic.id,
      title: "Introduction",
      content: "Conflicts are natural in any relationship. The key is not to avoid them, but to address them in a way that strengthens your connection rather than weakening it.",
      order: 1,
    });

    await this.createCoachingContent({
      topicId: conflictTopic.id,
      title: "Choose the right time",
      content: "Avoid discussing sensitive topics when either of you is tired, hungry, or stressed. Set aside a specific time when you're both calm.",
      order: 2,
    });

    await this.createCoachingContent({
      topicId: conflictTopic.id,
      title: "Use \"I\" statements",
      content: "Instead of saying \"You always...\" try \"I feel...\" This reduces defensiveness and opens up communication.",
      order: 3,
    });

    await this.createCoachingContent({
      topicId: conflictTopic.id,
      title: "Listen actively",
      content: "Give your full attention, maintain eye contact, and paraphrase to ensure understanding before responding.",
      order: 4,
    });

    await this.createCoachingContent({
      topicId: conflictTopic.id,
      title: "Practice Exercise",
      content: "Try this simple exercise with your partner to improve conflict resolution skills:\n1. Each person writes down a minor recent disagreement\n2. Take turns discussing using \"I\" statements\n3. Practice active listening without interruption\n4. Look for compromise solutions together",
      order: 5,
    });

    // Create sample activities
    await this.createActivity({
      userId: user1.id,
      type: "coaching",
      description: "New coaching session available: Building Better Communication Habits",
    });

    await this.createActivity({
      userId: user1.id,
      type: "message",
      description: "Message sent to Jane with a supportive tone",
    });
  }
}

export const storage = new MemStorage();
