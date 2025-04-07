import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum values for marital status and relationship condition
export const maritalStatusValues = ['single', 'dating', 'engaged', 'married', 'divorced', 'widowed'] as const;
export const relationshipConditionValues = ['critical', 'stable', 'improving'] as const;
export const notificationTypeValues = ['message', 'activity', 'coaching', 'partner', 'system', 'calendar'] as const;
export const sessionCategoryValues = ['relationship', 'communication', 'conflict', 'intimacy', 'future', 'general'] as const;
export const calendarVisibilityValues = ['private', 'partner', 'public'] as const;
export const taskStatusValues = ['pending', 'accepted', 'declined', 'completed'] as const;
export const calendarTypeValues = ['personal', 'work', 'family', 'shared'] as const;
export const birthSexValues = ['male', 'female', 'other'] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  birthSex: text("birth_sex", { enum: birthSexValues }),  // Will be one of birthSexValues
  partnerId: integer("partner_id").references(() => users.id),
  inviteCode: text("invite_code").unique(),
  maritalStatus: text("marital_status"),  // Will be one of maritalStatusValues
  relationshipCondition: text("relationship_condition"), // Will be one of relationshipConditionValues
  onboardingCompleted: boolean("onboarding_completed").default(false),
  nickname: text("nickname"),  // User's own nickname
  partnerNickname: text("partner_nickname"),  // What they call their partner
  seesTherapist: boolean("sees_therapist").default(false)  // Whether user sees a therapist
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

// New table for coaching sessions
export const coachingSessions = pgTable("coaching_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  category: text("category", { enum: sessionCategoryValues }).default('general'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New table for coaching session messages (chat history)
export const sessionMessages = pgTable("session_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => coachingSessions.id),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
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

// Calendar integration (connected external calendars)
export const calendarIntegrations = pgTable("calendar_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // User-friendly name for this calendar
  type: text("type", { enum: calendarTypeValues }).notNull(),
  provider: text("provider").notNull(), // "google", "apple", "outlook", "manual", etc.
  credentials: json("credentials"), // Encrypted credentials for API access
  visibility: text("visibility", { enum: calendarVisibilityValues }).default("private"),
  color: text("color").notNull(), // Display color for this calendar
  isActive: boolean("is_active").default(true),
  lastSynced: timestamp("last_synced"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar events
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  calendarId: integer("calendar_id").references(() => calendarIntegrations.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  allDay: boolean("all_day").default(false),
  recurrence: text("recurrence"), // RRULE format for recurring events
  visibility: text("visibility", { enum: calendarVisibilityValues }).default("partner"),
  externalId: text("external_id"), // ID from external calendar system
  isTask: boolean("is_task").default(false), // Whether this is a task that can be delegated/assigned
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks (assignable events)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => calendarEvents.id),
  assignerId: integer("assigner_id").notNull().references(() => users.id),
  assigneeId: integer("assignee_id").references(() => users.id),
  status: text("status", { enum: taskStatusValues }).default("pending"),
  priority: integer("priority").default(0), // 0-5 priority scale
  dueDate: timestamp("due_date").notNull(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, partnerId: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true, read: true });
export const insertCoachingTopicSchema = createInsertSchema(coachingTopics).omit({ id: true });
export const insertCoachingContentSchema = createInsertSchema(coachingContents).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, timestamp: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, timestamp: true, read: true, dismissed: true });
export const insertCoachingSessionSchema = createInsertSchema(coachingSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSessionMessageSchema = createInsertSchema(sessionMessages).omit({ id: true, timestamp: true });
export const insertCalendarIntegrationSchema = createInsertSchema(calendarIntegrations).omit({ id: true, lastSynced: true, createdAt: true });
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, completedAt: true, createdAt: true, updatedAt: true });

// Types
export type MaritalStatus = typeof maritalStatusValues[number];
export type RelationshipCondition = typeof relationshipConditionValues[number];
export type NotificationType = typeof notificationTypeValues[number];
export type SessionCategory = typeof sessionCategoryValues[number];
export type CalendarVisibility = typeof calendarVisibilityValues[number];
export type TaskStatus = typeof taskStatusValues[number];
export type CalendarType = typeof calendarTypeValues[number];
export type BirthSex = typeof birthSexValues[number];

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
export type InsertSessionMessage = z.infer<typeof insertSessionMessageSchema>;
export type SessionMessage = typeof sessionMessages.$inferSelect;
export type InsertCalendarIntegration = z.infer<typeof insertCalendarIntegrationSchema>;
export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
