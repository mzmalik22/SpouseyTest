import { v4 as uuidv4 } from 'uuid';
import {
  type User, 
  type InsertUser, 
  type Message, 
  type InsertMessage, 
  type CoachingTopic, 
  type InsertCoachingTopic, 
  type CoachingContent, 
  type InsertCoachingContent,
  type Activity,
  type InsertActivity,
  type Notification,
  type InsertNotification,
  type CoachingSession,
  type InsertCoachingSession,
  type SessionMessage,
  type InsertSessionMessage
} from "@shared/schema";
import { pool } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Use a memory-based storage implementation by default
// We'll implement PostgreSQL-based storage in the future

export interface IStorage {
  // User methods
  getUsers(): Map<number, User>; // Debug method
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByInviteCode(inviteCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Message methods
  getMessages(userId1: number, userId2: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(userId: number, partnerId: number): Promise<void>;
  getUnreadMessageCount(userId: number): Promise<number>;
  
  // Coaching methods
  getCoachingTopics(): Promise<CoachingTopic[]>;
  getCoachingTopic(id: number): Promise<CoachingTopic | undefined>;
  createCoachingTopic(topic: InsertCoachingTopic): Promise<CoachingTopic>;
  getCoachingContents(topicId: number): Promise<CoachingContent[]>;
  createCoachingContent(content: InsertCoachingContent): Promise<CoachingContent>;
  
  // Coaching Sessions methods
  getUserCoachingSessions(userId: number): Promise<CoachingSession[]>;
  getCoachingSession(id: number): Promise<CoachingSession | undefined>;
  createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession>;
  updateCoachingSession(id: number, data: Partial<CoachingSession>): Promise<CoachingSession | undefined>;
  deleteCoachingSession(id: number): Promise<boolean>;
  
  // Session Messages methods
  getSessionMessages(sessionId: number): Promise<SessionMessage[]>;
  createSessionMessage(message: InsertSessionMessage): Promise<SessionMessage>;
  
  // Activity methods
  getUserActivities(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Notification methods
  getUserNotifications(userId: number, limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  dismissNotification(id: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  
  // Calendar Integration methods
  getUserCalendarIntegrations(userId: number): Promise<CalendarIntegration[]>;
  getCalendarIntegration(id: number): Promise<CalendarIntegration | undefined>;
  createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration>;
  updateCalendarIntegration(id: number, data: Partial<CalendarIntegration>): Promise<CalendarIntegration | undefined>;
  deleteCalendarIntegration(id: number): Promise<boolean>;
  
  // Calendar Event methods
  getUserCalendarEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  getPartnerCalendarEvents(userId: number, partnerId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: number, data: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;
  
  // Task methods
  getUserTasks(userId: number, status?: TaskStatus): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Initialize with sample data
  initializeSampleData(): Promise<void>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

// Global state to persist data across server restarts during development
const globalData = global as any;
if (!globalData.__spouseyAppStorage) {
  globalData.__spouseyAppStorage = {
    users: new Map<number, User>(),
    messages: new Map<number, Message>(),
    coachingTopics: new Map<number, CoachingTopic>(),
    coachingContents: new Map<number, CoachingContent>(),
    coachingSessions: new Map<number, CoachingSession>(),
    sessionMessages: new Map<number, SessionMessage>(),
    activities: new Map<number, Activity>(),
    notifications: new Map<number, Notification>(),
    calendarIntegrations: new Map<number, CalendarIntegration>(),
    calendarEvents: new Map<number, CalendarEvent>(),
    tasks: new Map<number, Task>(),
    userIdCounter: 1,
    messageIdCounter: 1,
    topicIdCounter: 1,
    contentIdCounter: 1,
    activityIdCounter: 1,
    notificationIdCounter: 1,
    sessionIdCounter: 1,
    sessionMessageIdCounter: 1,
    calendarIntegrationIdCounter: 1,
    calendarEventIdCounter: 1,
    taskIdCounter: 1,
    sessionStore: new MemoryStore({ 
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  };
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private coachingTopics: Map<number, CoachingTopic>;
  private coachingContents: Map<number, CoachingContent>;
  private coachingSessions: Map<number, CoachingSession>;
  private sessionMessages: Map<number, SessionMessage>;
  private activities: Map<number, Activity>;
  private notifications: Map<number, Notification>;
  private calendarIntegrations: Map<number, CalendarIntegration>;
  private calendarEvents: Map<number, CalendarEvent>;
  private tasks: Map<number, Task>;
  private userIdCounter: number;
  private messageIdCounter: number;
  private topicIdCounter: number;
  private contentIdCounter: number;
  private activityIdCounter: number;
  private notificationIdCounter: number;
  private sessionIdCounter: number;
  private sessionMessageIdCounter: number;
  private calendarIntegrationIdCounter: number;
  private calendarEventIdCounter: number;
  private taskIdCounter: number;
  sessionStore: session.Store;
  
  // Debug method to expose users map for debugging
  getUsers(): Map<number, User> {
    return this.users;
  }

  constructor() {
    // Use the global data to persist across server restarts
    const data = globalData.__spouseyAppStorage;
    this.users = data.users;
    this.messages = data.messages;
    this.coachingTopics = data.coachingTopics;
    this.coachingContents = data.coachingContents;
    this.coachingSessions = data.coachingSessions;
    this.sessionMessages = data.sessionMessages;
    this.activities = data.activities;
    this.notifications = data.notifications;
    this.calendarIntegrations = data.calendarIntegrations;
    this.calendarEvents = data.calendarEvents;
    this.tasks = data.tasks;
    this.userIdCounter = data.userIdCounter;
    this.messageIdCounter = data.messageIdCounter;
    this.topicIdCounter = data.topicIdCounter;
    this.contentIdCounter = data.contentIdCounter;
    this.activityIdCounter = data.activityIdCounter;
    this.notificationIdCounter = data.notificationIdCounter;
    this.sessionIdCounter = data.sessionIdCounter;
    this.sessionMessageIdCounter = data.sessionMessageIdCounter;
    this.calendarIntegrationIdCounter = data.calendarIntegrationIdCounter;
    this.calendarEventIdCounter = data.calendarEventIdCounter;
    this.taskIdCounter = data.taskIdCounter;
    this.sessionStore = data.sessionStore;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async getUserByInviteCode(inviteCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.inviteCode === inviteCode,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Update global counter
    globalData.__spouseyAppStorage.userIdCounter = this.userIdCounter;
    
    const inviteCode = uuidv4().substring(0, 8);
    const user: User = { 
      ...insertUser, 
      id, 
      inviteCode,
      onboardingCompleted: false,
      maritalStatus: null,
      relationshipCondition: null,
      nickname: null,
      partnerNickname: null
    };
    this.users.set(id, user);
    
    // Explicitly update the global map to ensure persistence
    globalData.__spouseyAppStorage.users.set(id, user);
    
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.users.set(id, updatedUser);
    
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
    // Update global counter
    globalData.__spouseyAppStorage.messageIdCounter = this.messageIdCounter;
    
    const timestamp = new Date();
    // Ensure we have proper null values instead of undefined for optional properties
    const message: Message = {
      ...insertMessage,
      id,
      timestamp,
      read: false,
      vibe: insertMessage.vibe || null,
      originalContent: insertMessage.originalContent || null
    };
    
    this.messages.set(id, message);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.messages.set(id, message);
    
    // Create a notification for the recipient
    const sender = await this.getUser(insertMessage.senderId);
    const senderName = sender ? 
      (sender.nickname || `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.username) : 
      'Your partner';
    
    this.createNotification({
      userId: insertMessage.recipientId,
      type: 'message',
      title: 'New Message',
      content: `You have a new message from ${senderName}`,
      relatedId: id
    }).catch(err => {
      console.error('Failed to create notification:', err);
    });
    
    return message;
  }
  
  async markMessagesAsRead(userId: number, partnerId: number): Promise<void> {
    // Find messages from partner to user and mark them as read
    const messages = Array.from(this.messages.values()).filter(
      message => message.senderId === partnerId && message.recipientId === userId && !message.read
    );
    
    // Update each message's read status
    for (const message of messages) {
      message.read = true;
      this.messages.set(message.id, message);
      // Update global map
      globalData.__spouseyAppStorage.messages.set(message.id, message);
    }
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values()).filter(
      message => message.recipientId === userId && !message.read
    ).length;
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
    // Update global counter
    globalData.__spouseyAppStorage.topicIdCounter = this.topicIdCounter;
    
    const topic: CoachingTopic = { ...insertTopic, id };
    this.coachingTopics.set(id, topic);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.coachingTopics.set(id, topic);
    
    return topic;
  }

  async getCoachingContents(topicId: number): Promise<CoachingContent[]> {
    return Array.from(this.coachingContents.values())
      .filter(content => content.topicId === topicId)
      .sort((a, b) => a.order - b.order);
  }

  async createCoachingContent(insertContent: InsertCoachingContent): Promise<CoachingContent> {
    const id = this.contentIdCounter++;
    // Update global counter
    globalData.__spouseyAppStorage.contentIdCounter = this.contentIdCounter;
    
    const content: CoachingContent = { ...insertContent, id };
    this.coachingContents.set(id, content);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.coachingContents.set(id, content);
    
    return content;
  }

  // Coaching Sessions methods
  async getUserCoachingSessions(userId: number): Promise<CoachingSession[]> {
    return Array.from(this.coachingSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
  }

  async getCoachingSession(id: number): Promise<CoachingSession | undefined> {
    return this.coachingSessions.get(id);
  }

  async createCoachingSession(insertSession: InsertCoachingSession): Promise<CoachingSession> {
    const id = this.sessionIdCounter++;
    // Update global counter
    globalData.__spouseyAppStorage.sessionIdCounter = this.sessionIdCounter;
    
    const now = new Date();
    const session: CoachingSession = {
      ...insertSession,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.coachingSessions.set(id, session);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.coachingSessions.set(id, session);
    
    // Create an activity for the user
    this.createActivity({
      userId: insertSession.userId,
      type: 'coaching',
      description: `Started a new coaching session: ${insertSession.title}`
    }).catch(err => {
      console.error('Failed to create activity:', err);
    });
    
    return session;
  }

  async updateCoachingSession(id: number, data: Partial<CoachingSession>): Promise<CoachingSession | undefined> {
    const session = await this.getCoachingSession(id);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      ...data,
      updatedAt: new Date() // Always update the updatedAt timestamp
    };
    
    this.coachingSessions.set(id, updatedSession);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.coachingSessions.set(id, updatedSession);
    
    return updatedSession;
  }

  async deleteCoachingSession(id: number): Promise<boolean> {
    const session = await this.getCoachingSession(id);
    if (!session) return false;
    
    // Delete the session
    this.coachingSessions.delete(id);
    globalData.__spouseyAppStorage.coachingSessions.delete(id);
    
    // Delete all associated messages
    const sessionMessages = await this.getSessionMessages(id);
    for (const message of sessionMessages) {
      this.sessionMessages.delete(message.id);
      globalData.__spouseyAppStorage.sessionMessages.delete(message.id);
    }
    
    return true;
  }

  // Session Messages methods
  async getSessionMessages(sessionId: number): Promise<SessionMessage[]> {
    return Array.from(this.sessionMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateA - dateB; // Ascending order (oldest first)
      });
  }

  async createSessionMessage(insertMessage: InsertSessionMessage): Promise<SessionMessage> {
    const id = this.sessionMessageIdCounter++;
    // Update global counter
    globalData.__spouseyAppStorage.sessionMessageIdCounter = this.sessionMessageIdCounter;
    
    const timestamp = new Date();
    const message: SessionMessage = {
      ...insertMessage,
      id,
      timestamp
    };
    
    this.sessionMessages.set(id, message);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.sessionMessages.set(id, message);
    
    // Update the session's updatedAt time
    const session = await this.getCoachingSession(insertMessage.sessionId);
    if (session) {
      await this.updateCoachingSession(session.id, { updatedAt: timestamp });
    }
    
    return message;
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
    // Update global counter
    globalData.__spouseyAppStorage.activityIdCounter = this.activityIdCounter;
    
    const timestamp = new Date();
    const activity: Activity = { ...insertActivity, id, timestamp };
    this.activities.set(id, activity);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.activities.set(id, activity);
    
    return activity;
  }
  
  // Notification methods
  async getUserNotifications(userId: number, limit?: number): Promise<Notification[]> {
    const notifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
      
    return limit ? notifications.slice(0, limit) : notifications;
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    // Update global counter
    globalData.__spouseyAppStorage.notificationIdCounter = this.notificationIdCounter;
    
    const timestamp = new Date();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      timestamp, 
      read: false,
      dismissed: false,
      // Ensure relatedId is null if undefined
      relatedId: insertNotification.relatedId || null
    };
    
    this.notifications.set(id, notification);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.notifications.set(id, notification);
    
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.notifications.set(id, notification);
      // Update global map
      globalData.__spouseyAppStorage.notifications.set(id, notification);
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read);
      
    for (const notification of userNotifications) {
      notification.read = true;
      this.notifications.set(notification.id, notification);
      // Update global map
      globalData.__spouseyAppStorage.notifications.set(notification.id, notification);
    }
  }
  
  async dismissNotification(id: number): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.dismissed = true;
      this.notifications.set(id, notification);
      // Update global map
      globalData.__spouseyAppStorage.notifications.set(id, notification);
    }
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read && !notification.dismissed)
      .length;
  }

  // Calendar Integration methods
  async getUserCalendarIntegrations(userId: number): Promise<CalendarIntegration[]> {
    return Array.from(this.calendarIntegrations.values())
      .filter(integration => integration.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCalendarIntegration(id: number): Promise<CalendarIntegration | undefined> {
    return this.calendarIntegrations.get(id);
  }

  async createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration> {
    const id = this.calendarIntegrationIdCounter++;
    // Update global counter
    globalData.__spouseyAppStorage.calendarIntegrationIdCounter = this.calendarIntegrationIdCounter;
    
    const now = new Date();
    const calendarIntegration: CalendarIntegration = {
      ...integration,
      id,
      isActive: true,
      lastSynced: now,
      createdAt: now
    };
    
    this.calendarIntegrations.set(id, calendarIntegration);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.calendarIntegrations.set(id, calendarIntegration);
    
    // Create activity for user
    await this.createActivity({
      userId: integration.userId,
      type: 'calendar',
      description: `Added a new calendar: ${integration.name}`
    });
    
    return calendarIntegration;
  }

  async updateCalendarIntegration(id: number, data: Partial<CalendarIntegration>): Promise<CalendarIntegration | undefined> {
    const integration = await this.getCalendarIntegration(id);
    if (!integration) return undefined;
    
    const updatedIntegration = { ...integration, ...data };
    this.calendarIntegrations.set(id, updatedIntegration);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.calendarIntegrations.set(id, updatedIntegration);
    
    return updatedIntegration;
  }

  async deleteCalendarIntegration(id: number): Promise<boolean> {
    const integration = await this.getCalendarIntegration(id);
    if (!integration) return false;
    
    // Delete the integration
    this.calendarIntegrations.delete(id);
    globalData.__spouseyAppStorage.calendarIntegrations.delete(id);
    
    // Delete all events associated with this calendar
    const events = Array.from(this.calendarEvents.values())
      .filter(event => event.calendarId === id);
    
    for (const event of events) {
      this.calendarEvents.delete(event.id);
      globalData.__spouseyAppStorage.calendarEvents.delete(event.id);
      
      // Delete any tasks associated with these events
      const tasks = Array.from(this.tasks.values())
        .filter(task => task.eventId === event.id);
      
      for (const task of tasks) {
        this.tasks.delete(task.id);
        globalData.__spouseyAppStorage.tasks.delete(task.id);
      }
    }
    
    return true;
  }

  // Calendar Event methods
  async getUserCalendarEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    let events = Array.from(this.calendarEvents.values())
      .filter(event => {
        // Events created by the user
        const isCreator = event.creatorId === userId;
        
        // Events from calendars owned by the user
        const isOwnerCalendar = Array.from(this.calendarIntegrations.values())
          .some(cal => cal.id === event.calendarId && cal.userId === userId);
        
        return isCreator || isOwnerCalendar;
      });
    
    // Filter by date range if provided
    if (startDate) {
      events = events.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= startDate;
      });
    }
    
    if (endDate) {
      events = events.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart <= endDate;
      });
    }
    
    // Sort by start time
    return events.sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      return dateA - dateB;
    });
  }

  async getPartnerCalendarEvents(userId: number, partnerId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    // Get all of partner's events
    let partnerEvents = Array.from(this.calendarEvents.values())
      .filter(event => {
        // Events created by the partner
        const isCreator = event.creatorId === partnerId;
        
        // Events from calendars owned by the partner that have visibility = "partner" or "public"
        const isVisibleCalendar = Array.from(this.calendarIntegrations.values())
          .some(cal => cal.id === event.calendarId && 
            cal.userId === partnerId && 
            (cal.visibility === "partner" || cal.visibility === "public"));
        
        // Or individual events with visibility = "partner" or "public"
        const isVisibleEvent = event.visibility === "partner" || event.visibility === "public";
        
        return isCreator && (isVisibleCalendar || isVisibleEvent);
      });
    
    // Filter by date range if provided
    if (startDate) {
      partnerEvents = partnerEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= startDate;
      });
    }
    
    if (endDate) {
      partnerEvents = partnerEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart <= endDate;
      });
    }
    
    // Sort by start time
    return partnerEvents.sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      return dateA - dateB;
    });
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.calendarEventIdCounter++;
    // Update global counter
    globalData.__spouseyAppStorage.calendarEventIdCounter = this.calendarEventIdCounter;
    
    const now = new Date();
    const calendarEvent: CalendarEvent = {
      ...event,
      id,
      createdAt: now,
      updatedAt: now,
      isTask: event.isTask || false,
      allDay: event.allDay || false,
      recurrence: event.recurrence || null,
      location: event.location || null,
      description: event.description || null,
      externalId: event.externalId || null,
      calendarId: event.calendarId || null // Allow for events not tied to a specific calendar
    };
    
    this.calendarEvents.set(id, calendarEvent);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.calendarEvents.set(id, calendarEvent);
    
    // Create activity for event creation
    await this.createActivity({
      userId: event.creatorId,
      type: 'calendar',
      description: `Created new event: ${event.title}`
    });
    
    return calendarEvent;
  }

  async updateCalendarEvent(id: number, data: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const event = await this.getCalendarEvent(id);
    if (!event) return undefined;
    
    const updatedEvent = { 
      ...event, 
      ...data,
      updatedAt: new Date() // Always update the updatedAt timestamp
    };
    
    this.calendarEvents.set(id, updatedEvent);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.calendarEvents.set(id, updatedEvent);
    
    return updatedEvent;
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    const event = await this.getCalendarEvent(id);
    if (!event) return false;
    
    // Delete the event
    this.calendarEvents.delete(id);
    globalData.__spouseyAppStorage.calendarEvents.delete(id);
    
    // Delete any tasks associated with this event
    const tasks = Array.from(this.tasks.values())
      .filter(task => task.eventId === id);
    
    for (const task of tasks) {
      this.tasks.delete(task.id);
      globalData.__spouseyAppStorage.tasks.delete(task.id);
    }
    
    return true;
  }

  // Task methods
  async getUserTasks(userId: number, status?: TaskStatus): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values())
      .filter(task => {
        // Tasks assigned by the user
        const isAssigner = task.assignerId === userId;
        
        // Tasks assigned to the user
        const isAssignee = task.assigneeId === userId;
        
        return isAssigner || isAssignee;
      });
    
    // Filter by status if provided
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }
    
    // Sort by due date, closest first
    return tasks.sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    // Update global counter
    globalData.__spouseyAppStorage.taskIdCounter = this.taskIdCounter;
    
    const now = new Date();
    const newTask: Task = {
      ...task,
      id,
      status: task.status || "pending",
      priority: task.priority || 0,
      notes: task.notes || null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };
    
    this.tasks.set(id, newTask);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.tasks.set(id, newTask);
    
    // Get event details
    const event = await this.getCalendarEvent(task.eventId);
    
    // Create a notification for the assignee
    if (task.assigneeId) {
      const assigner = await this.getUser(task.assignerId);
      const assignerName = assigner ? 
        (assigner.nickname || `${assigner.firstName || ''} ${assigner.lastName || ''}`.trim() || assigner.username) : 
        'Your partner';
      
      await this.createNotification({
        userId: task.assigneeId,
        type: 'calendar',
        title: 'New Task Assignment',
        content: `${assignerName} has assigned you a task: ${event?.title || 'Task'}`,
        relatedId: id
      });
      
      // Create activity for task assignment
      await this.createActivity({
        userId: task.assignerId,
        type: 'calendar',
        description: `Assigned task "${event?.title || 'Task'}" to partner`
      });
    }
    
    return newTask;
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    const now = new Date();
    const statusChanged = data.status && data.status !== task.status;
    
    // Set completedAt timestamp if task is being marked as completed
    let completedAt = task.completedAt;
    if (statusChanged && data.status === 'completed' && !task.completedAt) {
      completedAt = now;
    } else if (statusChanged && data.status !== 'completed') {
      completedAt = null;
    }
    
    const updatedTask = { 
      ...task, 
      ...data,
      completedAt,
      updatedAt: now
    };
    
    this.tasks.set(id, updatedTask);
    
    // Explicitly update the global map
    globalData.__spouseyAppStorage.tasks.set(id, updatedTask);
    
    // Create notifications and activities for status changes
    if (statusChanged) {
      const event = await this.getCalendarEvent(task.eventId);
      const eventTitle = event?.title || 'Task';
      
      // Notify the assigner when the assignee changes the status
      if (updatedTask.assignerId !== updatedTask.assigneeId) {
        const assignee = await this.getUser(updatedTask.assigneeId);
        const assigneeName = assignee ? 
          (assignee.nickname || `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.username) : 
          'Your partner';
        
        let statusMessage = '';
        switch (data.status) {
          case 'accepted':
            statusMessage = `accepted your task: ${eventTitle}`;
            break;
          case 'declined':
            statusMessage = `declined your task: ${eventTitle}`;
            break;
          case 'completed':
            statusMessage = `completed your task: ${eventTitle}`;
            break;
          default:
            statusMessage = `updated the status of your task: ${eventTitle}`;
        }
        
        await this.createNotification({
          userId: updatedTask.assignerId,
          type: 'calendar',
          title: 'Task Status Updated',
          content: `${assigneeName} has ${statusMessage}`,
          relatedId: id
        });
        
        // Create activity for task status change
        await this.createActivity({
          userId: updatedTask.assigneeId,
          type: 'calendar',
          description: `${data.status === 'accepted' ? 'Accepted' : data.status === 'declined' ? 'Declined' : 'Updated'} task "${eventTitle}"`
        });
      }
    }
    
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const task = await this.getTask(id);
    if (!task) return false;
    
    // Delete the task
    this.tasks.delete(id);
    globalData.__spouseyAppStorage.tasks.delete(id);
    
    return true;
  }

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    // Check if sample data already exists
    if (this.users.size > 0) {
      console.log("Sample data already exists, skipping initialization");
      return;
    }
    
    console.log("Initializing sample data...");
    
    // Create test user as requested
    const testUser = await this.createUser({
      username: "Test",
      password: "spouseytest",
      email: "stockman.ed@gmail.com",
      firstName: "Ed",
      lastName: "Stockman",
    });
    
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

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  // Debug method
  getUsers(): Map<number, User> {
    throw new Error("Method not implemented in DatabaseStorage");
  }
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Using LOWER() function for case-insensitive comparison
    const [user] = await db.select().from(users).where(
      sql`LOWER(${users.username}) = LOWER(${username})`
    );
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Using LOWER() function for case-insensitive comparison
    const [user] = await db.select().from(users).where(
      sql`LOWER(${users.email}) = LOWER(${email})`
    );
    return user;
  }

  async getUserByInviteCode(inviteCode: string): Promise<User | undefined> {
    if (!inviteCode) return undefined;
    const [user] = await db.select().from(users).where(eq(users.inviteCode, inviteCode));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const inviteCode = uuidv4().substring(0, 8);
    const [user] = await db.insert(users)
      .values({ ...insertUser, inviteCode })
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getMessages(userId1: number, userId2: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.recipientId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.recipientId, userId1)
          )
        )
      )
      .orderBy(messages.timestamp);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getCoachingTopics(): Promise<CoachingTopic[]> {
    return await db.select().from(coachingTopics);
  }

  async getCoachingTopic(id: number): Promise<CoachingTopic | undefined> {
    const [topic] = await db.select()
      .from(coachingTopics)
      .where(eq(coachingTopics.id, id));
    return topic;
  }

  async createCoachingTopic(insertTopic: InsertCoachingTopic): Promise<CoachingTopic> {
    const [topic] = await db.insert(coachingTopics)
      .values(insertTopic)
      .returning();
    return topic;
  }

  async getCoachingContents(topicId: number): Promise<CoachingContent[]> {
    return await db.select()
      .from(coachingContents)
      .where(eq(coachingContents.topicId, topicId))
      .orderBy(coachingContents.order);
  }

  async createCoachingContent(insertContent: InsertCoachingContent): Promise<CoachingContent> {
    const [content] = await db.insert(coachingContents)
      .values(insertContent)
      .returning();
    return content;
  }

  async getUserActivities(userId: number, limit?: number): Promise<Activity[]> {
    let query = db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async initializeSampleData(): Promise<void> {
    try {
      // Check if we already have coaching topics
      const existingTopics = await this.getCoachingTopics();
      
      if (existingTopics.length === 0) {
        // Sample coaching topics
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
      }
    } catch (error) {
      console.error("Error initializing sample data:", error);
      // Continue without sample data if there's an error
    }
  }
}

// Import pool for session store
import { pool } from './db';
import { sql } from 'drizzle-orm';

// Use in-memory storage
const storage = new MemStorage();
console.log("Using in-memory storage");

export { storage };
