import { GoogleGenAI } from "@google/genai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY environment variable is required');
}

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

async function getModerationResult(text: string): Promise<boolean> {
  try {
    const prompt = `You are a content moderator. Your task is to determine if the following text contains any harmful content, such as hate speech, harassment, violence, or sexually explicit material.
Respond with only the word "true" if the text is harmful, and "false" if it is not.

Text to analyze:
---
${text}
---
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log(`Moderation check for text: "${text.substring(0, 40)}..."`, {
        responseText,
    });

    if (responseText) {
      const result = responseText.trim().toLowerCase();
      if (result === 'true') {
        return true;
      }
      if (result === 'false') {
        return false;
      }
      console.warn(`Moderation check returned ambiguous response: "${responseText}"`);
      return true;
    }

    console.warn('Moderation check returned empty response.');
    return true;

  } catch (error) {
    console.error('Moderation API error:', error);
    return true;
  }
}


export type ModerationResult = {
	allowed: boolean;
	reason?: string;
};

export async function validateNoteForModeration(note: string): Promise<ModerationResult> {
	const trimmed = note.trim();

	if (trimmed.length === 0) {
		return { allowed: false, reason: "Note cannot be empty." };
	}
	if (trimmed.length > 500) {
		return { allowed: false, reason: "Note is too long (max 500 characters)." };
	}

	const isHarmful = await getModerationResult(trimmed);

	if (isHarmful) {
		return { allowed: false, reason: "This note violates our content policy." };
	}

	return { allowed: true };
}

export function sanitizeNoteForDisplay(note: string): string {
	const plain = note.replace(/[	]+/g, " ").trim();
	return plain.length > 500 ? plain.slice(0, 500) + "…" : plain;
}