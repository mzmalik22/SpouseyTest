import OpenAI from "openai";

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY environment variable is not set. Message refinement will not work.");
}

// Initialize OpenAI client 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
 * Refines a message according to the selected communication vibe
 * @param message The original message text
 * @param vibe The communication vibe to apply (compassionate, direct, etc.)
 * @returns The refined message text
 */
export async function refineMessage(message: string, vibe: string): Promise<string> {
  // If no vibe selected, message is empty, or API key is missing, return the original
  if (!message || !vibe || !vibePrompts[vibe.toLowerCase()] || !process.env.OPENAI_API_KEY) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("Message refinement skipped: OPENAI_API_KEY not set");
    }
    return message;
  }
  
  try {
    // Create the prompt for the selected vibe
    const prompt = `
As a relationship communication assistant, please help refine the following message between partners.

Original message: "${message}"

${vibePrompts[vibe.toLowerCase()]}

The refined message should sound natural and authentic, not overly formal or robotic.
Keep it approximately the same length as the original message.
Do not add expressions like "I feel" or similar phrases unless they were in the original message.
Do not include any explanation, just respond with the refined message text.
`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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