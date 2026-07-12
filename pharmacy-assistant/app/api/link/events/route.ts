import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import LinkSession from '@/models/LinkSession';

/**
 * GET /api/link/events?sessionId=...
 * Server-Sent Events stream for the desktop to receive real-time updates.
 * 
 * Events emitted:
 *   - phone-connected: Phone has joined the session
 *   - photo-result:    A photo has been processed, includes the AI result
 *   - session-expired: Session has expired
 *   - heartbeat:       Keep-alive ping every 15 seconds
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('sessionId is required', { status: 400 });
  }

  await dbConnect();

  // Verify session belongs to this user
  const linkSession = await LinkSession.findOne({
    _id: sessionId,
    userId: session.user.id,
  });

  if (!linkSession) {
    return new Response('Session not found', { status: 404 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: Record<string, unknown>) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      // Send initial state
      sendEvent('init', {
        sessionId: linkSession._id.toString(),
        status: linkSession.status,
        pairingCode: linkSession.pairingCode,
      });

      if (linkSession.lastPhoto && linkSession.lastPhoto.result) {
        sendEvent('photo-result', {
          type: linkSession.lastPhoto.type,
          result: linkSession.lastPhoto.result,
          timestamp: linkSession.lastPhoto.timestamp,
        });
      }

      // Poll MongoDB for changes (simple approach, works without change streams)
      let lastStatus = linkSession.status;
      let lastPhotoTimestamp = linkSession.lastPhoto?.timestamp?.getTime() || 0;

      const pollInterval = setInterval(async () => {
        if (closed) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const current = await LinkSession.findById(sessionId).lean();

          if (!current) {
            sendEvent('session-expired', { reason: 'Session deleted' });
            closed = true;
            clearInterval(pollInterval);
            controller.close();
            return;
          }

          // Check for status change
          if (current.status !== lastStatus) {
            if (current.status === 'connected') {
              sendEvent('phone-connected', {
                phoneUserAgent: current.phoneUserAgent,
              });
            } else if (current.status === 'expired') {
              sendEvent('session-expired', { reason: 'Session expired' });
              closed = true;
              clearInterval(pollInterval);
              controller.close();
              return;
            }
            lastStatus = current.status;
          }

          // Check for new photo result
          const currentPhotoTs = current.lastPhoto?.timestamp
            ? new Date(current.lastPhoto.timestamp).getTime()
            : 0;

          if (currentPhotoTs > lastPhotoTimestamp) {
            sendEvent('photo-result', {
              type: current.lastPhoto.type,
              result: current.lastPhoto.result,
              timestamp: current.lastPhoto.timestamp,
            });
            lastPhotoTimestamp = currentPhotoTs;
          }
        } catch (err) {
          console.error('SSE poll error:', err);
        }
      }, 2000); // Poll every 2 seconds

      // Heartbeat every 15 seconds
      const heartbeatInterval = setInterval(() => {
        if (closed) {
          clearInterval(heartbeatInterval);
          return;
        }
        sendEvent('heartbeat', { time: Date.now() });
      }, 15000);

      // Cleanup when client disconnects
      req.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
