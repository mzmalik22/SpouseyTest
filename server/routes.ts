import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { refineMessage, refineMessageAllVibes } from "./openai";

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
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
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
    
    const { message, vibe } = req.body;
    
    if (!message || !vibe) {
      return res.status(400).json({ message: "Message and vibe are required" });
    }
    
    try {
      const refinedMessage = await refineMessage(message, vibe);
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
    
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: "Message text is required" });
    }
    
    try {
      const result = await refineMessageAllVibes(message);
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

  const httpServer = createServer(app);
  return httpServer;
}
