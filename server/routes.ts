import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema, User } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { refineMessage, refineMessageAllVibes } from "./openai";
import OpenAI from "openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Using in-memory storage
  
  try {
    // Initialize sample data
    await storage.initializeSampleData();
  } catch (error) {
    console.error("Error initializing sample data:", error);
    // Continue without sample data
  }

  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "spousey-app-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: false, // Set to false for development to work with HTTP
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      },
      store: storage.sessionStore,
    })
  );

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          console.log("Attempting login with email:", email);
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log("User not found with email:", email);
            return done(null, false, { message: "Incorrect email." });
          }
          
          console.log("User found, checking password...");
          // Using plaintext password comparison for development
          // In production, we would use bcrypt.compare
          if (user.password !== password) {
            console.log("Password does not match");
            return done(null, false, { message: "Incorrect password." });
          }
          
          console.log("Login successful for user:", user.username);
          return done(null, user);
        } catch (err) {
          console.error("Error during authentication:", err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration request received:", req.body);
      const userData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const emailExists = await storage.getUserByEmail(userData.email);
      if (emailExists) {
        console.log("Email already exists:", userData.email);
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Check if username already exists
      const usernameExists = await storage.getUserByUsername(userData.username);
      if (usernameExists) {
        console.log("Username already exists:", userData.username);
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // In a real app, we would hash the password
      // const hashedPassword = await bcrypt.hash(userData.password, 10);
      // userData.password = hashedPassword;
      
      console.log("Creating new user with data:", { ...userData, password: '[REDACTED]' });
      const user = await storage.createUser(userData);
      console.log("User created successfully:", user.id);
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = user;
      
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "Login error after registration" });
        }
        console.log("User logged in after registration:", user.id);
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    // User is logged in at this point
    const { password, ...userWithoutPassword } = req.user as any;
    return res.json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout error" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/current-user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { password, ...userWithoutPassword } = req.user as any;
    return res.json(userWithoutPassword);
  });

  // Partner invitation
  app.post("/api/users/invite", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    if (currentUser.partnerId) {
      return res.status(400).json({ message: "You already have a partner connected" });
    }
    
    // Generate a new invite code
    const updatedUser = await storage.updateUser(currentUser.id, {
      inviteCode: req.body.inviteCode || undefined
    });
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.json({ inviteCode: updatedUser.inviteCode });
  });
  
  app.get("/api/users/check-invite/:code", async (req, res) => {
    // Allow non-authenticated users to check invite codes
    // This way new users can see who invited them before they register
    
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ message: "Invite code is required" });
    }
    
    const partnerUser = await storage.getUserByInviteCode(code);
    if (!partnerUser) {
      return res.status(404).json({ message: "Invalid invite code" });
    }
    
    // If user is authenticated, perform additional checks
    if (req.isAuthenticated()) {
      const currentUser = req.user as any;
      if (partnerUser.id === currentUser.id) {
        return res.status(400).json({ message: "You cannot connect with yourself" });
      }
      
      if (currentUser.partnerId) {
        return res.status(400).json({ message: "You already have a partner connected" });
      }
    }
    
    // Return basic info about the invitation
    return res.json({ 
      valid: true,
      partnerName: partnerUser.firstName || partnerUser.username 
    });
  });

  app.post("/api/users/accept-invite", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ message: "Invite code is required" });
    }
    
    const currentUser = req.user as any;
    if (currentUser.partnerId) {
      return res.status(400).json({ message: "You already have a partner connected" });
    }
    
    const partnerUser = await storage.getUserByInviteCode(inviteCode);
    if (!partnerUser) {
      return res.status(404).json({ message: "Invalid invite code" });
    }
    
    if (partnerUser.id === currentUser.id) {
      return res.status(400).json({ message: "You cannot connect with yourself" });
    }
    
    // Connect both users
    await storage.updateUser(currentUser.id, { partnerId: partnerUser.id });
    await storage.updateUser(partnerUser.id, { partnerId: currentUser.id });
    
    // Clear the invite code
    await storage.updateUser(partnerUser.id, { inviteCode: null });
    
    return res.json({ message: "Partner connected successfully" });
  });

  // Messages routes
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    if (!currentUser.partnerId) {
      return res.status(400).json({ message: "No partner connected" });
    }
    
    const messages = await storage.getMessages(currentUser.id, currentUser.partnerId);
    return res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    if (!currentUser.partnerId) {
      return res.status(400).json({ message: "No partner connected" });
    }
    
    try {
      const messageData = {
        ...req.body,
        senderId: currentUser.id,
        recipientId: currentUser.partnerId
      };
      
      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);
      
      // Create activity for this message
      if (validatedData.vibe) {
        await storage.createActivity({
          userId: currentUser.id,
          type: "message",
          description: `Message sent to ${currentUser.partnerId} with a ${validatedData.vibe} tone`
        });
      }
      
      return res.status(201).json(message);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  });

  // Coaching routes
  app.get("/api/coaching/topics", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const topics = await storage.getCoachingTopics();
    return res.json(topics);
  });

  app.get("/api/coaching/topics/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const topicId = parseInt(req.params.id);
    if (isNaN(topicId)) {
      return res.status(400).json({ message: "Invalid topic ID" });
    }
    
    const topic = await storage.getCoachingTopic(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    
    const contents = await storage.getCoachingContents(topicId);
    
    return res.json({ topic, contents });
  });

  // Message refinement endpoint for a single vibe
  app.post("/api/messages/refine", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    const { message, vibe } = req.body;
    
    if (!message || !vibe) {
      return res.status(400).json({ message: "Message and vibe are required" });
    }
    
    try {
      // Get user's nickname information if available
      const userNickname = currentUser.nickname || null;
      const partnerNickname = currentUser.partnerNickname || null;
      
      // Pass nickname info to refineMessage
      const refinedMessage = await refineMessage(message, vibe, userNickname, partnerNickname);
      return res.json({ refinedMessage });
    } catch (error: any) {
      console.error("Error refining message with OpenAI:", error);
      
      // More specific error handling based on error type
      let errorMessage = "Failed to refine message";
      
      if (!process.env.OPENAI_API_KEY) {
        errorMessage = "OpenAI API key not configured. Using original message instead.";
      } else if (error.code === 'insufficient_quota') {
        errorMessage = "OpenAI API quota exceeded. Using original message instead.";
      } else if (error.status === 429) {
        errorMessage = "OpenAI API rate limit reached. Using original message instead.";
      } else if (error.message && error.message.includes("API key")) {
        errorMessage = "OpenAI API key configuration issue. Using original message instead.";
      }
      
      // Return the original message as fallback with a specific warning
      return res.status(200).json({ 
        refinedMessage: message,
        error: errorMessage
      });
    }
  });
  
  // Message refinement endpoint for all vibes at once
  app.post("/api/messages/refine-all-vibes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: "Message text is required" });
    }
    
    try {
      // Get user's nickname information if available
      const userNickname = currentUser.nickname || null;
      const partnerNickname = currentUser.partnerNickname || null;
      
      // Pass nickname info to refineMessageAllVibes
      const result = await refineMessageAllVibes(message, userNickname, partnerNickname);
      return res.json(result);
    } catch (error: any) {
      console.error("Error refining message for all vibes:", error);
      
      // More comprehensive error handling
      let errorMessage = "Failed to refine message for all vibes";
      
      if (!process.env.OPENAI_API_KEY) {
        errorMessage = "OpenAI API key not configured. Using original messages instead.";
      } else if (error.code === 'insufficient_quota') {
        errorMessage = "OpenAI API quota exceeded. Using original messages instead.";
      } else if (error.status === 429) {
        errorMessage = "OpenAI API rate limit reached. Using original messages instead.";
      } else if (error.message && error.message.includes("API key")) {
        errorMessage = "OpenAI API key configuration issue. Using original messages instead.";
      }
      
      // Create a default response with the original message for each vibe
      const { vibeOptions } = await import('../client/src/lib/types');
      const fallbackRefinedMessages: Record<string, string> = {};
      
      // Use the original message as fallback for all vibes
      if (vibeOptions) {
        vibeOptions.forEach((vibe: any) => {
          fallbackRefinedMessages[vibe.id] = message;
        });
      }
      
      return res.status(200).json({ 
        refinedMessages: fallbackRefinedMessages,
        error: errorMessage
      });
    }
  });

  // Onboarding route
  app.post("/api/onboarding", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    const { maritalStatus, relationshipCondition } = req.body;
    
    if (!maritalStatus || !relationshipCondition) {
      return res.status(400).json({ message: "Marital status and relationship condition are required" });
    }
    
    try {
      const updatedUser = await storage.updateUser(currentUser.id, {
        maritalStatus,
        relationshipCondition,
        onboardingCompleted: true
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create activity for completing onboarding
      await storage.createActivity({
        userId: currentUser.id,
        type: "onboarding",
        description: `Completed onboarding - ${maritalStatus}, relationship is ${relationshipCondition}`
      });
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Onboarding error:", error);
      return res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const activities = await storage.getUserActivities(currentUser.id, limit);
    return res.json(activities);
  });
  
  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const notifications = await storage.getUserNotifications(currentUser.id, limit);
    return res.json(notifications);
  });
  
  app.get("/api/notifications/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    const count = await storage.getUnreadNotificationCount(currentUser.id);
    return res.json({ count });
  });
  
  app.post("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    await storage.markNotificationAsRead(notificationId);
    return res.json({ message: "Notification marked as read" });
  });
  
  app.post("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    await storage.markAllNotificationsAsRead(currentUser.id);
    return res.json({ message: "All notifications marked as read" });
  });
  
  app.post("/api/notifications/:id/dismiss", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    await storage.dismissNotification(notificationId);
    return res.json({ message: "Notification dismissed" });
  });
  
  // Message reading status
  app.post("/api/messages/mark-read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    if (!currentUser.partnerId) {
      return res.status(400).json({ message: "No partner connected" });
    }
    
    await storage.markMessagesAsRead(currentUser.id, currentUser.partnerId);
    return res.json({ message: "Messages marked as read" });
  });
  
  app.get("/api/messages/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    if (!currentUser.partnerId) {
      return res.json({ count: 0 });
    }
    
    const count = await storage.getUnreadMessageCount(currentUser.id);
    return res.json({ count });
  });
  
  // Nickname update route
  app.post("/api/user/nickname", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const currentUser = req.user as any;
    const { nickname, partnerNickname } = req.body;
    
    console.log("Nickname update request:", {
      userId: currentUser.id,
      nickname,
      partnerNickname
    });
    
    if (!nickname && !partnerNickname) {
      return res.status(400).json({ message: "At least one nickname must be provided" });
    }
    
    try {
      // Create an update object with only the provided fields
      const updateData: Partial<User> = {};
      if (nickname) updateData.nickname = nickname;
      if (partnerNickname) updateData.partnerNickname = partnerNickname;
      
      console.log("Updating user with data:", updateData);
      
      const updatedUser = await storage.updateUser(currentUser.id, updateData);
      
      if (!updatedUser) {
        console.log("User not found for update:", currentUser.id);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("User updated successfully:", {
        id: updatedUser.id,
        nickname: updatedUser.nickname,
        partnerNickname: updatedUser.partnerNickname
      });
      
      // Create activity for updating nicknames
      await storage.createActivity({
        userId: currentUser.id,
        type: "profile_update",
        description: `Updated nicknames: ${nickname ? 'self: ' + nickname : ''}${nickname && partnerNickname ? ', ' : ''}${partnerNickname ? 'partner: ' + partnerNickname : ''}`
      });
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Nickname update error:", error);
      return res.status(500).json({ message: "Failed to update nicknames" });
    }
  });

  // Coaching Sessions API
  
  // Get all coaching sessions for the current user
  app.get("/api/coaching/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as User).id;
      const sessions = await storage.getUserCoachingSessions(userId);
      return res.json(sessions);
    } catch (error) {
      console.error("Error fetching coaching sessions:", error);
      return res.status(500).json({ message: "Failed to fetch coaching sessions" });
    }
  });

  // Get a specific coaching session by ID
  app.get("/api/coaching/sessions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getCoachingSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Security check: make sure the session belongs to the current user
      const userId = (req.user as User).id;
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      return res.json(session);
    } catch (error) {
      console.error("Error fetching coaching session:", error);
      return res.status(500).json({ message: "Failed to fetch coaching session" });
    }
  });

  // Create a new coaching session
  app.post("/api/coaching/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as User).id;
      const { title, category } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      const session = await storage.createCoachingSession({
        userId,
        title,
        category: category || 'general'
      });

      return res.status(201).json(session);
    } catch (error) {
      console.error("Error creating coaching session:", error);
      return res.status(500).json({ message: "Failed to create coaching session" });
    }
  });

  // Update a coaching session
  app.patch("/api/coaching/sessions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getCoachingSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Security check: make sure the session belongs to the current user
      const userId = (req.user as User).id;
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { title, category, generateTitleFromContent } = req.body;
      const updateData: Partial<any> = {};
      
      if (generateTitleFromContent === true) {
        try {
          // Get session messages to analyze
          const messages = await storage.getSessionMessages(sessionId);
          
          if (messages.length > 0) {
            // Use OpenAI to generate a title based on conversation content
            const openai = new OpenAI({
              apiKey: process.env.OPENAI_API_KEY
            });
            
            // Build a prompt with the conversation content
            const conversationText = messages
              .map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
              .join('\n');
            
            const response = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
              messages: [
                {
                  role: "system",
                  content: "You are a helpful assistant that generates short, descriptive titles for relationship coaching conversations. Create a concise title (5-7 words max) that captures the main topic or issue being discussed. Do not use quotes or punctuation in the title. The title should be meaningful and descriptive of the conversation content. Respond ONLY with the title text and nothing else."
                },
                {
                  role: "user",
                  content: `Please generate a title for this relationship coaching conversation:\n\n${conversationText}`
                }
              ],
              temperature: 0.7,
              max_tokens: 50
            });
            
            const generatedTitle = response.choices[0].message.content?.trim();
            if (generatedTitle) {
              updateData.title = generatedTitle;
              console.log("Auto-generated title:", generatedTitle);
            }
          }
        } catch (titleError) {
          console.error("Error generating title with OpenAI:", titleError);
          // Continue with user-provided title or existing title if AI title generation fails
        }
      } else {
        // Use provided title if auto-generation wasn't requested
        if (title !== undefined) updateData.title = title;
      }
      
      // Always update category if provided
      if (category !== undefined) updateData.category = category;

      // Only update if we have changes to make
      if (Object.keys(updateData).length > 0) {
        const updatedSession = await storage.updateCoachingSession(sessionId, updateData);
        return res.json(updatedSession);
      } else {
        return res.json(session); // Return original session if no updates
      }
    } catch (error) {
      console.error("Error updating coaching session:", error);
      return res.status(500).json({ message: "Failed to update coaching session" });
    }
  });

  // Delete a coaching session
  app.delete("/api/coaching/sessions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getCoachingSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Security check: make sure the session belongs to the current user
      const userId = (req.user as User).id;
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteCoachingSession(sessionId);
      if (success) {
        return res.status(204).end();
      } else {
        return res.status(500).json({ message: "Failed to delete session" });
      }
    } catch (error) {
      console.error("Error deleting coaching session:", error);
      return res.status(500).json({ message: "Failed to delete coaching session" });
    }
  });

  // Session Messages API

  // Get all messages for a specific session
  app.get("/api/coaching/sessions/:id/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getCoachingSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Security check: make sure the session belongs to the current user
      const userId = (req.user as User).id;
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getSessionMessages(sessionId);
      return res.json(messages);
    } catch (error) {
      console.error("Error fetching session messages:", error);
      return res.status(500).json({ message: "Failed to fetch session messages" });
    }
  });

  // Create a new message in a session
  app.post("/api/coaching/sessions/:id/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getCoachingSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Security check: make sure the session belongs to the current user
      const userId = (req.user as User).id;
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { content, role } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      if (!role || (role !== 'user' && role !== 'assistant')) {
        return res.status(400).json({ message: "Role must be 'user' or 'assistant'" });
      }

      const message = await storage.createSessionMessage({
        sessionId,
        content,
        role
      });

      return res.status(201).json(message);
    } catch (error) {
      console.error("Error creating session message:", error);
      return res.status(500).json({ message: "Failed to create session message" });
    }
  });
  
  // AI Coaching Response API
  
  // Get AI-generated response for a coaching session
  app.post("/api/coaching/ai-response", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { sessionId, messageHistory } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      if (!messageHistory || !Array.isArray(messageHistory)) {
        return res.status(400).json({ message: "Message history is required and must be an array" });
      }
      
      const session = await storage.getCoachingSession(parseInt(sessionId));
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Security check: make sure the session belongs to the current user
      const userId = (req.user as User).id;
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get current user for personalization
      const currentUser = req.user as User;
      
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        
        // Build the messages array for OpenAI
        const messages = [
          {
            role: "system", 
            content: `You are Spousey, an AI relationship coach. Your expertise is in providing supportive, 
            empathetic advice for relationships. This conversation is about: "${session.title}" in the 
            category: "${session.category}".
            
            The user's name is ${currentUser.firstName || 'the user'} and their relationship status is 
            ${currentUser.maritalStatus || 'unspecified'}.
            
            If they mention their partner, their partner's name is ${currentUser.partnerNickname || 'their partner'}.
            
            Always be supportive, non-judgmental, and focus on practical advice. Ask clarifying questions when needed.
            
            If a couple is experiencing severe issues (abuse, extreme conflict), kindly suggest professional help 
            and emphasize that you're an AI assistant with limitations.`
          }
        ];
        
        // Add the message history to the conversation
        messageHistory.forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });
        
        // Get response from OpenAI
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        });
        
        const aiResponse = response.choices[0].message.content;
        
        // Create the assistant message in storage
        const message = await storage.createSessionMessage({
          sessionId: parseInt(sessionId),
          content: aiResponse,
          role: 'assistant'
        });
        
        return res.status(201).json(message);
      } catch (error) {
        console.error("OpenAI API error:", error);
        return res.status(500).json({ 
          message: "Failed to generate AI response", 
          error: error.message 
        });
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      return res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
