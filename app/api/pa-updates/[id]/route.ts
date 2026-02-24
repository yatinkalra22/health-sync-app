import { NextRequest } from 'next/server';
import { getPARequest, elasticsearch } from '@/lib/services/elasticsearch';
import { getDemoPARequest } from '@/mock';
import { SSE_POLL_INTERVAL_MS } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const interval = setInterval(async () => {
        try {
          let pa;
          if (!elasticsearch) {
            pa = getDemoPARequest(id);
          } else {
            pa = await getPARequest(id);
          }

          if (pa) {
            const data = `data: ${JSON.stringify(pa)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          console.error('SSE error:', error);
        }
      }, SSE_POLL_INTERVAL_MS);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
