import { User, Message, CalendarEvent, RelationshipCondition } from "@shared/schema";
import { OpenAI } from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Enum for radar insight types
export enum RadarInsightType {
  MESSAGE_TONE = "message_tone",
  CALENDAR_STRESS = "calendar_stress",
  RELATIONSHIP_HEALTH = "relationship_health",
  COMMUNICATION_TIP = "communication_tip"
}

// Interface for radar insights
export interface RadarInsight {
  type: RadarInsightType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  actionItem?: string;
  createdAt: Date;
}

/**
 * Analyzes messages for tone and sentiment patterns
 */
async function analyzeMessages(messages: Message[], userNickname?: string | null, partnerNickname?: string | null): Promise<RadarInsight | null> {
  if (!messages || messages.length === 0) {
    return null;
  }

  // Only analyze the most recent messages (last 10)
  const recentMessages = messages.slice(-10);
  
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a relationship analyst that examines message tone and content to identify patterns. Look for emotional cues, tone shifts, and potential communication issues."
        },
        {
          role: "user",
          content: `Analyze these recent messages between partners ${userNickname || 'User'} and ${partnerNickname || 'Partner'} and identify any significant tone patterns or emotional cues that might suggest communication challenges or opportunities for improvement. 
          
          ${recentMessages.map(msg => `${msg.senderId}: ${msg.content}`).join('\n')}
          
          Provide a brief insight about communication patterns and a specific actionable tip.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      type: RadarInsightType.MESSAGE_TONE,
      title: result.title || "Message Tone Analysis",
      description: result.insight || "Analysis of your recent conversations revealed patterns in communication style.",
      severity: result.severity || "medium",
      actionItem: result.actionTip || "Consider being more explicit about your feelings in your messages.",
      createdAt: new Date()
    };
  } catch (error) {
    console.error("Error analyzing messages:", error);
    return null;
  }
}

/**
 * Analyzes calendar events for potential stress factors
 */
async function analyzeCalendar(events: CalendarEvent[], user: User): Promise<RadarInsight | null> {
  if (!events || events.length === 0) {
    return null;
  }

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  // Calculate basic metrics
  const now = new Date();
  const weekEvents = sortedEvents.filter(e => {
    const eventDate = new Date(e.startTime);
    const diffTime = Math.abs(eventDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });
  
  const eventsPerDay = weekEvents.length / 7;
  const allDayEvents = weekEvents.filter(e => e.allDay).length;
  const upcomingImportantEvents = weekEvents.filter(e => 
    e.title.toLowerCase().includes("meeting") || 
    e.title.toLowerCase().includes("deadline") ||
    e.title.toLowerCase().includes("important") ||
    e.title.toLowerCase().includes("urgent")
  );
  
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a relationship wellness assistant that analyzes calendar patterns to identify potential stress factors that might affect a relationship."
        },
        {
          role: "user",
          content: `Analyze these calendar events for ${user.firstName || 'the user'} and determine if they suggest a busy or stressful period that might impact relationship health.
          
          Events per day: ${eventsPerDay}
          All-day events: ${allDayEvents}
          Important upcoming events: ${upcomingImportantEvents.length}
          
          Upcoming events:
          ${weekEvents.map(e => `- ${e.title} (${new Date(e.startTime).toLocaleDateString()})`).join('\n')}
          
          Provide a brief insight about schedule stress level and a specific tip for maintaining relationship connection during busy periods.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      type: RadarInsightType.CALENDAR_STRESS,
      title: result.title || "Calendar Analysis",
      description: result.insight || "Your schedule shows some potential stress factors that might affect your relationship.",
      severity: result.severity || "medium",
      actionItem: result.actionTip || "Consider setting aside dedicated time for your relationship this week.",
      createdAt: new Date()
    };
  } catch (error) {
    console.error("Error analyzing calendar:", error);
    return null;
  }
}

/**
 * Generates communication tips based on relationship condition
 */
async function generateCommunicationTips(
  user: User, 
  recentMessages: Message[],
  relationshipCondition: RelationshipCondition
): Promise<RadarInsight | null> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a relationship coach that provides specific, actionable communication tips based on relationship condition and message history."
        },
        {
          role: "user",
          content: `Generate a personalized communication tip for ${user.firstName || 'a user'} whose relationship is currently in a "${relationshipCondition}" state.
          
          ${recentMessages.length > 0 ? `Their recent messages include: 
          ${recentMessages.slice(-5).map(msg => msg.content).join('\n')}` : 'No recent messages are available.'}
          
          Provide a brief, specific communication tip with the title "Heads Up!" that would be helpful for someone in a ${relationshipCondition} relationship. Make it feel gentle and supportive, not prescriptive.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      type: RadarInsightType.COMMUNICATION_TIP,
      title: result.title || "Heads Up!",
      description: result.tip || "Remember to prioritize connection in your communication.",
      severity: relationshipCondition === "critical" ? "high" : 
                relationshipCondition === "stable" ? "medium" : "low",
      actionItem: result.actionItem || "Try leading with warmth rather than logic in your next conversation.",
      createdAt: new Date()
    };
  } catch (error) {
    console.error("Error generating communication tips:", error);
    return null;
  }
}

/**
 * Main function to generate relationship radar insights
 */
export async function generateRelationshipRadarInsights(
  user: User,
  messages: Message[],
  calendarEvents: CalendarEvent[]
): Promise<RadarInsight[]> {
  const insights: RadarInsight[] = [];
  
  // Define relationship condition with fallback
  const relationshipCondition = user.relationshipCondition as RelationshipCondition || "stable";
  
  // Generate insights in parallel
  const [messageInsight, calendarInsight, communicationTip] = await Promise.all([
    analyzeMessages(messages, user.nickname, user.partnerNickname),
    analyzeCalendar(calendarEvents, user),
    generateCommunicationTips(user, messages, relationshipCondition)
  ]);
  
  // Add valid insights to results
  if (messageInsight) insights.push(messageInsight);
  if (calendarInsight) insights.push(calendarInsight);
  if (communicationTip) insights.push(communicationTip);
  
  // If no insights were generated due to lack of data, create a default insight
  if (insights.length === 0) {
    insights.push({
      type: RadarInsightType.RELATIONSHIP_HEALTH,
      title: "Building Your Relationship Profile",
      description: "As you use the app more, we'll provide personalized insights about your relationship dynamics.",
      severity: "low",
      actionItem: "Complete your profile and begin messaging to get started.",
      createdAt: new Date()
    });
  }
  
  return insights;
}