import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum values for marital status and relationship condition
export const maritalStatusValues = ['single', 'dating', 'engaged', 'married', 'divorced', 'widowed'] as const;
export const relationshipConditionValues = ['critical', 'stable', 'improving'] as const;
export const notificationTypeValues = ['message', 'activity', 'coaching', 'partner', 'system'] as const;
export const sessionStatusValues = ['active', 'completed', 'archived'] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  partnerId: integer("partner_id").references(() => users.id),
  inviteCode: text("invite_code").unique(),
  maritalStatus: text("marital_status"),  // Will be one of maritalStatusValues
  relationshipCondition: text("relationship_condition"), // Will be one of relationshipConditionValues
  onboardingCompleted: boolean("onboarding_completed").default(false),
  nickname: text("nickname"),  // User's own nickname
  partnerNickname: text("partner_nickname")  // What they call their partner
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  vibe: text("vibe"),
  originalContent: text("original_content"),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false), // Track whether message has been read
});

export const coachingTopics = pgTable("coaching_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const coachingContents = pgTable("coaching_contents", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => coachingTopics.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  order: integer("order").notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// New table for notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type", { enum: notificationTypeValues }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  relatedId: integer("related_id"), // ID of related message, activity, etc.
  read: boolean("read").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
  dismissed: boolean("dismissed").default(false), // Allow user to dismiss notifications
});

// Coaching sessions table
export const coachingSessions = pgTable("coaching_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  topicId: integer("topic_id").references(() => coachingTopics.id),
  status: text("status", { enum: sessionStatusValues }).default("active").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coaching session messages table
export const coachingSessionMessages = pgTable("coaching_session_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => coachingSessions.id),
  content: text("content").notNull(),
  isUserMessage: boolean("is_user_message").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, partnerId: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true, read: true });
export const insertCoachingTopicSchema = createInsertSchema(coachingTopics).omit({ id: true });
export const insertCoachingContentSchema = createInsertSchema(coachingContents).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, timestamp: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, timestamp: true, read: true, dismissed: true });
export const insertCoachingSessionSchema = createInsertSchema(coachingSessions).omit({ id: true, lastMessageAt: true, createdAt: true });
export const insertCoachingSessionMessageSchema = createInsertSchema(coachingSessionMessages).omit({ id: true, createdAt: true });

// Types
export type MaritalStatus = typeof maritalStatusValues[number];
export type RelationshipCondition = typeof relationshipConditionValues[number];
export type NotificationType = typeof notificationTypeValues[number];
export type SessionStatus = typeof sessionStatusValues[number];

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertCoachingTopic = z.infer<typeof insertCoachingTopicSchema>;
export type CoachingTopic = typeof coachingTopics.$inferSelect;
export type InsertCoachingContent = z.infer<typeof insertCoachingContentSchema>;
export type CoachingContent = typeof coachingContents.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertCoachingSession = z.infer<typeof insertCoachingSessionSchema>;
export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSessionMessage = z.infer<typeof insertCoachingSessionMessageSchema>;
export type CoachingSessionMessage = typeof coachingSessionMessages.$inferSelect;
