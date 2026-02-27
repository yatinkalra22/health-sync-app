import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLM_MODEL, LLM_DEFAULT_MAX_TOKENS } from '@/lib/constants';

function createClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Gemini API key not configured - running in demo mode');
    return null;
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export const genAI = createClient();

export async function callLLM(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string,
  maxTokens = LLM_DEFAULT_MAX_TOKENS
): Promise<string> {
  if (!genAI) {
    return 'Demo mode: AI analysis would appear here with a configured API key.';
  }

  const model = genAI.getGenerativeModel({
    model: LLM_MODEL,
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: maxTokens },
  });

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);

  return result.response.text();
}
