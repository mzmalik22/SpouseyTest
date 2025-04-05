import OpenAI from "openai";

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY environment variable is not set. Message refinement will not work.");
}

// Initialize OpenAI client with runtime check for API key
function createOpenAIClient() {
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY environment variable is not set. Message refinement will fallback to original messages.");
    return null;
  }
  
  console.log("Initializing OpenAI client with API key starting with:", process.env.OPENAI_API_KEY.substring(0, 3) + "...");
  
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("OpenAI client successfully initialized!");
    return client;
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", error);
    return null;
  }
}

/**
 * Interface for coach response
 */
export interface CoachResponse {
  message: string;
  error?: string;
}

/**
 * Generates a relationship coach response based on user message and conversation history
 * @param userMessage The latest message from the user
 * @param conversationHistory Previous messages in the conversation (optional)
 * @param userDetails User relationship details for context (optional)
 * @returns AI-generated coach response
 */
export async function generateCoachResponse(
  userMessage: string,
  conversationHistory: { content: string, isUserMessage: boolean }[] = [],
  userDetails?: {
    nickname?: string | null,
    partnerNickname?: string | null,
    relationshipCondition?: string | null,
    maritalStatus?: string | null
  }
): Promise<CoachResponse> {
  // If OpenAI client is not available, return fallback response
  if (!openai) {
    console.warn("Coach response generation skipped: OpenAI client not available");
    return { 
      message: "I understand how you feel. Could you tell me more about that? The more details you share, the better I can help you navigate this situation.",
      error: "OpenAI client not available"
    };
  }

  try {
    console.log("Generating coach response for message:", userMessage);
    console.log("Conversation history length:", conversationHistory.length);
    console.log("User details:", JSON.stringify(userDetails));
    
    // Format conversation history for the prompt
    const formattedHistory = conversationHistory.map(msg => {
      return `${msg.isUserMessage ? "User" : "Coach"}: ${msg.content}`;
    }).join("\n");
    
    // Create user details context if available
    let userDetailsContext = "";
    if (userDetails) {
      userDetailsContext = "\nUser Details:";
      if (userDetails.nickname) {
        userDetailsContext += `\n- User's nickname: "${userDetails.nickname}"`;
      }
      if (userDetails.partnerNickname) {
        userDetailsContext += `\n- Partner's nickname: "${userDetails.partnerNickname}"`;
      }
      if (userDetails.relationshipCondition) {
        userDetailsContext += `\n- Relationship condition: ${userDetails.relationshipCondition}`;
      }
      if (userDetails.maritalStatus) {
        userDetailsContext += `\n- Marital status: ${userDetails.maritalStatus}`;
      }
    }
    
    // Create system prompt for the coach
    const systemPrompt = `
You are a compassionate and insightful relationship coach named Dr. Heart. 
Your expertise is in couples therapy, communication strategies, and emotional intelligence.

IMPORTANT GUIDELINES:
- Respond with empathy, warmth, and professional insight
- Ask thoughtful follow-up questions to better understand the situation
- Provide practical advice while validating feelings
- Focus on improving communication, emotional connection, and relationship health
- Keep responses concise (100-200 words)
- If the user mentions specific relationship issues like trust, communication, intimacy, or conflict, address those directly
- Occasionally reference relevant relationship psychology concepts when appropriate
- Avoid generic platitudes; offer specific, actionable guidance
- Never be judgmental or take sides
- Use a warm, conversational tone that builds rapport
- Use user's and partner's nicknames naturally if they are provided in the context

Your goal is to help the user gain insight, develop healthier relationship patterns, and improve their connection with their partner.
`;

    // Create the prompt for the coach response
    const prompt = `
${userDetailsContext}

${formattedHistory ? `Previous conversation:\n${formattedHistory}\n` : ""}

User's latest message: "${userMessage}"

Please provide a thoughtful, empathetic coach response that addresses the user's concerns and offers helpful guidance.
`;

    // Log the request to OpenAI
    console.log("Sending request to OpenAI with model: gpt-4o");
    console.log("System prompt length:", systemPrompt.length);
    console.log("User prompt length:", prompt.length);
    
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      
      console.log("OpenAI response received successfully");
      
      // Return the coach response
      const coachMessage = response.choices[0].message.content?.trim();
      if (!coachMessage) {
        throw new Error("Empty response from OpenAI");
      }
      
      console.log("Coach response generated:", coachMessage.substring(0, 50) + "...");
      return { message: coachMessage };
    } catch (apiError: any) {
      console.error("OpenAI API error:", apiError.message);
      console.error("Error status:", apiError.status);
      console.error("Error type:", apiError.type);
      
      if (apiError.message.includes("API key")) {
        return { 
          message: "I understand your concerns. What specific aspects of your relationship would you like to focus on improving?",
          error: "API key configuration issue"
        };
      } else {
        throw apiError; // Re-throw to be caught by the outer catch
      }
    }
  } catch (error: any) {
    console.error("Error generating coach response with OpenAI:", error);
    
    // Return a fallback response in case of error
    return { 
      message: "I appreciate you sharing that with me. What do you think would be a first step toward improving this situation? Sometimes small changes can make a big difference.",
      error: error.message || "Failed to generate coach response"
    };
  }
}

const openai = createOpenAIClient();

// Map of vibe types to prompt instructions
const vibePrompts: Record<string, string> = {
  affectionate: "Rephrase this message to express deep love, warmth, and tenderness. Make it sound genuinely loving while maintaining the original intent.",
  
  concerned: "Rephrase this message to show genuine worry and care. Express thoughtful concern for your partner's wellbeing while maintaining the original intent.",
  
  apologetic: "Rephrase this message to express sincere regret and a desire to make amends. Show genuine remorse while maintaining the original intent.",
  
  playful: "Rephrase this message to be more light-hearted and fun. Add a touch of humor or playfulness while maintaining the original intent.",
  
  excited: "Rephrase this message to express enthusiasm and positive energy. Show genuine excitement while maintaining the original intent.",
  
  flirty: "Rephrase this message to be subtly romantic and suggestive. Add a touch of loving intimacy while maintaining the original intent.",
  
  funny: "Rephrase this message to be humorous and amusing. Add a witty joke or lighthearted humor while maintaining the original intent."
};

/**
 * Interface for refined message response
 */
export interface RefinedMessagesResponse {
  refinedMessages: {
    [key: string]: string;
  };
  error?: string;
}

/**
 * Refines a message for a single vibe
 * @param message The original message text
 * @param vibe The communication vibe to apply
 * @param userNickname The nickname of the current user (optional)
 * @param partnerNickname The nickname for the recipient (optional)
 * @returns The refined message text
 */
export async function refineMessage(
  message: string, 
  vibe: string, 
  userNickname?: string, 
  partnerNickname?: string
): Promise<string> {
  // If no vibe selected, message is empty, or OpenAI client is not available, return the original
  if (!message || !vibe || !vibePrompts[vibe.toLowerCase()] || !openai) {
    if (!openai) {
      console.warn("Message refinement skipped: OpenAI client not available");
    }
    return message;
  }
  
  try {
    // Create nickname context if available
    let nicknameContext = "";
    if (userNickname || partnerNickname) {
      nicknameContext = "\nContext:";
      if (userNickname) {
        nicknameContext += `\n- The sender goes by the nickname "${userNickname}".`;
      }
      if (partnerNickname) {
        nicknameContext += `\n- The recipient goes by the nickname "${partnerNickname}".`;
      }
      nicknameContext += "\nPlease incorporate these nicknames naturally if appropriate.";
    }
    
    // Create the prompt for the selected vibe
    const prompt = `
As a relationship communication assistant, please help refine the following message between partners.

Original message: "${message}"${nicknameContext}

${vibePrompts[vibe.toLowerCase()]}

The refined message should sound natural and authentic, not overly formal or robotic.
Keep it approximately the same length as the original message.
Do not add expressions like "I feel" or similar phrases unless they were in the original message.
Do not include any explanation, just respond with the refined message text.
`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    if (!openai) {
      throw new Error("OpenAI client is not available");
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    // Return the refined message or the original if there's an issue
    const refinedMessage = response.choices[0].message.content?.trim();
    return refinedMessage || message;
    
  } catch (error) {
    console.error("Error refining message with OpenAI:", error);
    return message; // Return the original message if there's an error
  }
}

/**
 * Refines a message according to all available communication vibes at once
 * @param message The original message text
 * @param userNickname The nickname of the current user (optional)
 * @param partnerNickname The nickname for the recipient (optional)
 * @returns Object containing refined messages for each vibe
 */
export async function refineMessageAllVibes(
  message: string,
  userNickname?: string,
  partnerNickname?: string
): Promise<RefinedMessagesResponse> {
  // If message is empty or OpenAI client is not available, return an error
  if (!message || !openai) {
    if (!openai) {
      console.warn("Message refinement skipped: OpenAI client not available");
      
      // Create fallback responses using the original message
      const fallbackMessages: {[key: string]: string} = {};
      Object.keys(vibePrompts).forEach(vibe => {
        fallbackMessages[vibe] = message || "";
      });
      
      return { 
        refinedMessages: fallbackMessages,
        error: "OpenAI client not available"
      };
    }
    
    return { 
      refinedMessages: {},
      error: "Message is empty"
    };
  }
  
  try {
    // Create nickname context if available
    let nicknameContext = "";
    if (userNickname || partnerNickname) {
      nicknameContext = "\nContext:";
      if (userNickname) {
        nicknameContext += `\n- The sender goes by the nickname "${userNickname}".`;
      }
      if (partnerNickname) {
        nicknameContext += `\n- The recipient goes by the nickname "${partnerNickname}".`;
      }
      nicknameContext += "\nPlease incorporate these nicknames naturally if appropriate.";
    }
    
    // Create a prompt for all vibes at once
    const prompt = `
As a relationship communication assistant, please help refine the following message between partners
in multiple different emotional tones. For each tone, create a modified version of the message.

Original message: "${message}"${nicknameContext}

Please rewrite this message in the following 7 distinct vibes, maintaining the core meaning but adjusting the tone.
Return the results in a valid JSON format with this structure:
{
  "affectionate": "refined message with affectionate tone",
  "concerned": "refined message with concerned tone",
  "apologetic": "refined message with apologetic tone",
  "playful": "refined message with playful tone",
  "excited": "refined message with excited tone",
  "flirty": "refined message with flirty tone",
  "funny": "refined message with funny tone"
}

For each vibe, follow these guidelines:
- Affectionate: Express deep love, warmth, and tenderness
- Concerned: Show genuine worry and care about the partner's wellbeing
- Apologetic: Express sincere regret and a desire to make amends
- Playful: Be more light-hearted and fun with a touch of humor
- Excited: Express enthusiasm and positive energy
- Flirty: Be subtly romantic and suggestive with a touch of loving intimacy
- Funny: Be humorous and amusing with a witty joke or lighthearted humor

The refined messages should:
- Sound natural and authentic, not overly formal or robotic
- Keep approximately the same length as the original message
- Not add expressions like "I feel" unless they were in the original
`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    if (!openai) {
      throw new Error("OpenAI client is not available");
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const content = response.choices[0].message.content?.trim();
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    const parsedContent = JSON.parse(content);
    return { refinedMessages: parsedContent };
    
  } catch (error) {
    console.error("Error refining messages with OpenAI:", error);
    
    // Create fallback responses using the original message
    const fallbackMessages: {[key: string]: string} = {};
    Object.keys(vibePrompts).forEach(vibe => {
      fallbackMessages[vibe] = message;
    });
    
    return { 
      refinedMessages: fallbackMessages,
      error: "Failed to generate refined messages"
    };
  }
}