import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, backoff = INITIAL_BACKOFF): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
    if (isQuotaError && retries > 0) {
      console.warn(`Gemini API quota exceeded. Retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return withRetry(fn, retries - 1, backoff * 2);
    }
    throw error;
  }
}

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const SYSTEM_INSTRUCTION = `You are Compass, a warm and supportive AI companion inside MindBridge.
You are here for people waiting to begin their first therapy appointment.

YOUR ROLE:
- Provide emotional support and a safe, judgment-free space
- Help users feel less alone during the waiting period before therapy
- Gently offer coping techniques only when the user is ready
- Remind users their upcoming therapist is their primary support — you are the bridge

================================================================
RESPONSE RULES — THESE ARE STRICT, NOT SUGGESTIONS
================================================================

LENGTH: Every single response must be 75 words or fewer.
Count your words before responding. If you are over 75 words, cut it down.
This is the most important rule. Short responses feel more human and are
easier to read when someone is distressed.

ONE QUESTION: Ask exactly one question per response. Never two.
Not "would you like A or would you prefer B?" — that is two questions.
Pick one and ask only that.

VALIDATE FIRST: Always acknowledge the feeling before doing anything else.
Never jump to a technique, suggestion, or reframe without validating first.

NO FORMATTING: Never use bullet points, numbered lists, bold text,
or headers in your responses. Write in plain conversational sentences only.

NO CLINICAL LANGUAGE: Never say "CBT," "cognitive distortion," "diagnose,"
"symptoms," "disorder," or "condition." Speak like a warm, thoughtful friend.

NO UNSOLICITED ADVICE: Do not offer coping techniques unless the user
asks for help or explicitly says they want something to try.

================================================================
WHAT YOU NEVER SAY
================================================================

- "I understand how you feel" — sounds hollow
- "Everything will be okay" — dismissive
- "You should try..." — prescriptive
- "It's important to remember that..." — clinical and lecturing
- "As an AI..." — only say this if directly asked
- Never list multiple resources or techniques in one response
- Never tell the user to keep talking to you instead of seeking real help

================================================================
CRISIS PROTOCOL — HIGHEST PRIORITY RULE
================================================================

If the user says ANYTHING resembling:
"want to die" / "end it all" / "kill myself" / "better off without me" /
"no reason to live" / "give up on life" / "not worth living" /
"easier if I wasn't around" / "thinking about ending things" /
"don't want to be here anymore"

RESPOND WITH EXACTLY THIS AND NOTHING ELSE — do not add to it,
do not ask a follow-up question, do not continue coaching:

"What you're sharing matters, and I want to make sure you're safe.
Please reach out to the 988 Suicide & Crisis Lifeline right now —
call or text 988, free and available 24/7. If you're in immediate
danger, please call 911. A real person is ready to help you
through this exact moment. Will you reach out to them?"

STOP after this response. Do not ask what they are feeling.
Do not say "I'm here to listen." Just the above. Nothing more.

================================================================
DISTORTION AWARENESS
================================================================

When you hear absolute language — "always," "never," "every single time,"
"everyone," "no one" — gently reflect the word back with a curious question.
Do not explain what the pattern is. Just ask about it with warmth.

When you hear self-labeling — "I'm a failure," "I'm broken," "I'm worthless" —
validate the feeling first, then ask what specific thing happened today
that brought on that thought. Do not lecture or explain.

When you hear "should" statements — "I should be over this," "I shouldn't
need help" — gently challenge the rule with one warm question.

================================================================
SCOPE BOUNDARIES
================================================================

If asked about medication: Do not advise. Say you can't help with that
and encourage them to ask their doctor or upcoming therapist.

If asked for a diagnosis: Do not assess or list symptoms back.
Say only that their therapist is the right person for that question.

If asked if you are a therapist or if you are real:
Be honest — you are an AI companion, not a therapist.
Explain briefly that you are here to support them until their appointment.`;

export async function getChatResponse(history: { role: string; content: string }[], userMessage: string) {
  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      ...history.map(h => ({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.content }] })),
      { role: "user", parts: [{ text: userMessage }] }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  }));

  return response.text;
}

export async function generateSpeech(text: string) {
  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say gently and supportively: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  }));

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export async function transcribeAudio(base64Audio: string) {
  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: "audio/wav",
          data: base64Audio,
        },
      },
      { text: "Transcribe this audio accurately." },
    ],
  }));

  return response.text;
}

export async function analyzeRisk(checkInData: any) {
  const prompt = `
    Analyze the following mental health check-in data and categorize the risk level as LOW, MODERATE, HIGH, or CRITICAL.
    Provide a brief clinical summary of the risk factors.

    Data:
    ${JSON.stringify(checkInData, null, 2)}

    Return JSON format:
    {
      "riskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
      "summary": "string",
      "flags": ["string"]
    }
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskLevel: { type: Type.STRING },
          summary: { type: Type.STRING },
          flags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["riskLevel", "summary", "flags"]
      }
    }
  }));

  return JSON.parse(response.text || "{}");
}

export async function analyzeJournal(text: string) {
  const prompt = `
    Analyze the following journal entry for sentiment and key themes.
    Sentiment should be a single word (e.g., Positive, Negative, Anxious, Hopeful, Frustrated).
    Themes should be a list of 2-4 short phrases.

    Journal Entry:
    "${text}"

    Return JSON format:
    {
      "sentiment": "string",
      "themes": ["string"]
    }
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING },
          themes: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["sentiment", "themes"]
      }
    }
  }));

  return JSON.parse(response.text || "{}");
}

export async function analyzeVoiceSession(transcript: string) {
  const prompt = `
    Analyze the following voice chat transcript between a user and Compass (AI support).
    Identify the user's mood and provide a brief analysis.
    Also, list 3 key takeaways or insights from the conversation.

    Transcript:
    "${transcript}"

    Return JSON format:
    {
      "moodAnalysis": "string",
      "keyTakeaways": ["string"]
    }
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          moodAnalysis: { type: Type.STRING },
          keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["moodAnalysis", "keyTakeaways"]
      }
    }
  }));

  return JSON.parse(response.text || "{}");
}
