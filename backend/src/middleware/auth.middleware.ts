import type { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import type { AuthenticatedRequest } from '../types/backend.types';

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or malformed Authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Token missing' });
      return;
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: error?.message || 'Invalid or expired session token' });
      return;
    }

    req.user = {
      user_id: user.id,
      email: user.email || '',
    };

    next();
  } catch (err: unknown) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal auth verification error' });
  }
}
