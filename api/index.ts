import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;
let initError: Error | null = null;

try {
  const backend = await import('../backend/src/index.js');
  app = backend.default;
} catch (err) {
  initError = err instanceof Error ? err : new Error(String(err));
  console.error('Failed to initialize backend:', initError);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (initError) {
    res.status(500).json({
      error: 'Backend initialization failed',
      message: initError.message,
      stack: initError.stack,
    });
    return;
  }
  return app(req, res);
}
