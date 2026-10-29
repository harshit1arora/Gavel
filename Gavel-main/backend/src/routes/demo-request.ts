import { Router, Request, Response } from 'express';
import {
  saveDemoRequest,
  getDemoRequests,
  updateDemoRequestStatus,
  getDemoRequestStats,
  demoEventEmitter,
  DemoRequestInput,
} from '../services/demo-request';

const router = Router();

/**
 * @api {post} /v1/public/demo-request Public Demo Request Submission
 * @access Public (No authentication token required, IP rate limited)
 */
router.post('/public', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      workEmail,
      company,
      phone,
      companySize,
      productInterest,
      preferredDay,
      preferredTime,
      message,
    } = req.body;

    // Basic Validation
    if (!fullName?.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!workEmail?.trim() || !workEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid work email is required' });
    }
    if (!company?.trim()) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    if (!productInterest) {
      return res.status(400).json({ error: 'Product interest selection is required' });
    }

    const input: DemoRequestInput = {
      fullName: fullName.trim(),
      workEmail: workEmail.trim().toLowerCase(),
      company: company.trim(),
      phone: phone?.trim(),
      companySize,
      productInterest,
      preferredDay,
      preferredTime,
      message: message?.trim(),
    };

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const savedRequest = await saveDemoRequest(input, { ipAddress, userAgent });

    res.status(201).json({
      success: true,
      id: savedRequest.id,
      message: 'Demo request received successfully! Our sales engineering team will reach out shortly.',
      request: savedRequest,
    });
  } catch (error: any) {
    console.error('Error submitting demo request:', error);
    res.status(500).json({ error: 'Failed to process demo request. Please try again.' });
  }
});

/**
 * @api {get} /v1/demo-request/stream Real-Time Server-Sent Events (SSE) Stream
 * Clients connect to this stream to receive instant notifications when a new demo request arrives
 */
router.get('/stream', (req: Request, res: Response) => {
  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Send initial snapshot of pending demo requests
  getDemoRequests({ limit: 10 }).then((requests) => {
    res.write(`event: initial_data\ndata: ${JSON.stringify(requests)}\n\n`);
  }).catch(console.error);

  // Real-time event listeners
  const onDemoCreated = (data: any) => {
    res.write(`event: demo_request_created\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onDemoUpdated = (data: any) => {
    res.write(`event: demo_request_updated\ndata: ${JSON.stringify(data)}\n\n`);
  };

  demoEventEmitter.on('demo_request_created', onDemoCreated);
  demoEventEmitter.on('demo_request_updated', onDemoUpdated);

  // Heartbeat ping every 20 seconds to keep SSE connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
  }, 20000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    demoEventEmitter.removeListener('demo_request_created', onDemoCreated);
    demoEventEmitter.removeListener('demo_request_updated', onDemoUpdated);
  });
});

/**
 * @api {get} /v1/demo-request Get List of Demo Requests
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search, limit } = req.query;
    const requests = await getDemoRequests({
      status: status as string,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error: any) {
    console.error('Error fetching demo requests:', error);
    res.status(500).json({ error: 'Failed to fetch demo requests' });
  }
});

/**
 * @api {get} /v1/demo-request/stats Get Demo Request Analytics & Summary
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getDemoRequestStats();
    res.status(200).json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching demo request stats:', error);
    res.status(500).json({ error: 'Failed to fetch demo request stats' });
  }
});

/**
 * @api {patch} /v1/demo-request/:id Update Demo Request Status / Notes
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, assignedTo } = req.body;

    const updated = await updateDemoRequestStatus(id, { status, notes, assignedTo });

    if (!updated) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    res.status(200).json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Error updating demo request:', error);
    res.status(500).json({ error: 'Failed to update demo request' });
  }
});

export default router;
