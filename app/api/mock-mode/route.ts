import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/mock-mode - Returns current mock mode status.
 * Mock mode is ON when:
 *   1. NEXT_PUBLIC_MOCK_MODE=true, OR
 *   2. Elasticsearch credentials are not configured
 */
export async function GET() {
  const envValue = process.env.NEXT_PUBLIC_MOCK_MODE;
  const hasES = !!(process.env.ELASTICSEARCH_CLOUD_ID && process.env.ELASTICSEARCH_API_KEY);
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  let isMock: boolean;
  if (envValue === 'true') isMock = true;
  else if (envValue === 'false') isMock = false;
  else isMock = !hasES;

  return NextResponse.json({
    mock_mode: isMock,
    reason: envValue ? `NEXT_PUBLIC_MOCK_MODE=${envValue}` : (hasES ? 'Elasticsearch configured' : 'Elasticsearch not configured (auto-fallback)'),
    services: {
      elasticsearch: hasES,
      anthropic: hasAnthropic,
      fhir: !!process.env.FHIR_SERVER_URL,
    },
  });
}
