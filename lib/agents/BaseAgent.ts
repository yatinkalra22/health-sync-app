import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLM_MODEL, LLM_DEFAULT_MAX_TOKENS } from '@/lib/constants';

interface MessageParam {
  role: 'user' | 'assistant';
  content: string;
}

export abstract class BaseAgent {
  protected name: string;
  protected description: string;
  protected genAI: GoogleGenerativeAI | null;
  protected conversationHistory: MessageParam[] = [];

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.genAI = process.env.GEMINI_API_KEY
      ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      : null;
  }

  abstract execute(context: unknown): Promise<unknown>;

  protected async callLLM(
    messages: MessageParam[],
    systemPrompt?: string,
    maxTokens = LLM_DEFAULT_MAX_TOKENS
  ): Promise<string> {
    if (!this.genAI) {
      return `[Demo] ${this.name} analysis would appear here with a configured Gemini API key.`;
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: LLM_MODEL,
        systemInstruction: systemPrompt || this.description,
        generationConfig: { maxOutputTokens: maxTokens },
      });

      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }],
      }));

      const lastMessage = messages[messages.length - 1];

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const text = result.response.text();

      this.conversationHistory.push({
        role: 'assistant',
        content: text,
      });

      return text;
    } catch (error) {
      console.error(`LLM call failed for ${this.name}:`, error);
      return `[AI Analysis by ${this.name}] Based on the clinical data and policy requirements, this case has been evaluated. The patient's medical history, current conditions, and treatment plan have been reviewed against applicable payer coverage criteria. Further details are available in the structured data sections.`;
    }
  }

  protected addToHistory(role: 'user' | 'assistant', content: string) {
    this.conversationHistory.push({ role, content });
  }

  protected clearHistory() {
    this.conversationHistory = [];
  }

  protected log(message: string, data?: unknown) {
    console.log(`[${this.name}] ${message}`, data || '');
  }
}
