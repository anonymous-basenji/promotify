import type { Response } from 'express';
import { z } from 'zod';

export function handleError(res: Response, err: unknown): void {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: err.issues[0]?.message || 'Validation error' });
    return;
  }
  const status = (err as { status?: number }).status || 500;
  if (status >= 500) {
    console.error('Internal server error:', err);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
  res.status(status).json({ error: (err as Error).message || 'An error occurred' });
}
