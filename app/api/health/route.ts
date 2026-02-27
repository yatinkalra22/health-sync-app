import { NextResponse } from 'next/server';
import { elasticsearch } from '@/lib/services/elasticsearch';

export async function GET() {
  const health: Record<string, unknown> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {},
  };

  // Check Elasticsearch
  if (elasticsearch) {
    try {
      const info = await elasticsearch.info();
      (health.services as Record<string, unknown>).elasticsearch = {
        status: 'connected',
        version: info.version.number,
        cluster_name: info.cluster_name,
      };
    } catch {
      (health.services as Record<string, unknown>).elasticsearch = { status: 'disconnected' };
      health.status = 'degraded';
    }
  } else {
    (health.services as Record<string, unknown>).elasticsearch = { status: 'not_configured (demo mode)' };
  }

  // Check Gemini AI
  (health.services as Record<string, unknown>).gemini = {
    status: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured (demo mode)',
  };

  return NextResponse.json(health);
}
