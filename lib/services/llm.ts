import Anthropic from '@anthropic-ai/sdk';
import { LLM_MODEL, LLM_DEFAULT_MAX_TOKENS } from '@/lib/constants';

function createClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('Anthropic API key not configured - running in demo mode');
    return null;
  }

  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

export const anthropic = createClient();

export async function callClaude(
  messages: Anthropic.MessageParam[],
  systemPrompt?: string,
  maxTokens = LLM_DEFAULT_MAX_TOKENS
): Promise<string> {
  if (!anthropic) {
    return 'Demo mode: AI analysis would appear here with a configured API key.';
  }

  const response = await anthropic.messages.create({
    model: LLM_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  return '';
}
