import Anthropic from '@anthropic-ai/sdk';
import { LLM_MODEL, LLM_DEFAULT_MAX_TOKENS } from '@/lib/constants';

export abstract class BaseAgent {
  protected name: string;
  protected description: string;
  protected llm: Anthropic | null;
  protected conversationHistory: Anthropic.MessageParam[] = [];

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.llm = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;
  }

  abstract execute(context: unknown): Promise<unknown>;

  protected async callLLM(
    messages: Anthropic.MessageParam[],
    systemPrompt?: string,
    maxTokens = LLM_DEFAULT_MAX_TOKENS
  ): Promise<string> {
    if (!this.llm) {
      return `[Demo] ${this.name} analysis would appear here with a configured Anthropic API key.`;
    }

    try {
      const response = await this.llm.messages.create({
        model: LLM_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt || this.description,
        messages,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        this.conversationHistory.push({
          role: 'assistant',
          content: content.text,
        });
        return content.text;
      }

      return '';
    } catch (error) {
      console.error(`LLM call failed for ${this.name}:`, error);
      throw error;
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
