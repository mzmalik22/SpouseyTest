import OpenAI from "openai";

// Check for OpenAI API key
// TODO: uncomment
// if (!process.env.OPENAI_API_KEY) {
//   console.warn("OPENAI_API_KEY environment variable is not set. Message refinement will not work.");
// }

// Initialize OpenAI client with runtime check for API key
function createOpenAIClient() {
  // TODO: uncomment
  // Check if API key is available
  // if (!process.env.OPENAI_API_KEY) {
  //   console.warn("OPENAI_API_KEY environment variable is not set. Message refinement will fallback to original messages.");
  //   return null;
  // }

  try {
    return new OpenAI({
      // TODO: uncomment
      // apiKey: process.env.OPENAI_API_KEY,
      apiKey:
        "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",
    });
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", error);
    return null;
  }
}

const openai = createOpenAIClient();

// Map of vibe types to prompt instructions
const vibePrompts: Record<string, string> = {
  affectionate:
    "Rephrase this message to express deep love, warmth, and tenderness. Make it sound genuinely loving while maintaining the original intent.",

  concerned:
    "Rephrase this message to show genuine worry and care. Express thoughtful concern for your partner's wellbeing while maintaining the original intent.",

  apologetic:
    "Rephrase this message to express sincere regret and a desire to make amends. Show genuine remorse while maintaining the original intent.",

  playful:
    "Rephrase this message to be more light-hearted and fun. Add a touch of humor or playfulness while maintaining the original intent.",

  excited:
    "Rephrase this message to express enthusiasm and positive energy. Show genuine excitement while maintaining the original intent.",

  flirty:
    "Rephrase this message to be subtly romantic and suggestive. Add a touch of loving intimacy while maintaining the original intent.",

  funny:
    "Rephrase this message to be humorous and amusing. Add a witty joke or lighthearted humor while maintaining the original intent.",
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
      nicknameContext +=
        "\nPlease incorporate these nicknames naturally if appropriate.";
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
      const fallbackMessages: { [key: string]: string } = {};
      Object.keys(vibePrompts).forEach((vibe) => {
        fallbackMessages[vibe] = message || "";
      });

      return {
        refinedMessages: fallbackMessages,
        error: "OpenAI client not available",
      };
    }

    return {
      refinedMessages: {},
      error: "Message is empty",
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
      nicknameContext +=
        "\nPlease incorporate these nicknames naturally if appropriate.";
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
      response_format: { type: "json_object" },
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
    const fallbackMessages: { [key: string]: string } = {};
    Object.keys(vibePrompts).forEach((vibe) => {
      fallbackMessages[vibe] = message;
    });

    return {
      refinedMessages: fallbackMessages,
      error: "Failed to generate refined messages",
    };
  }
}
