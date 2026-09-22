import type { Response } from 'express';
import { z } from 'zod';
import { postService } from '../services/post.service.js';
import type { AuthenticatedRequest } from '../types/backend.types.js';

function handleError(res: Response, err: unknown): void {
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

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const logPostSchema = z.object({
  groupId: z.string().min(1, 'groupId is required'),
  dateStr: z.string().regex(dateRegex, 'Invalid date format (YYYY-MM-DD)').optional(),
  notes: z.string().trim().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable(),
  postUrl: z.string().trim().max(1000, 'Post URL cannot exceed 1000 characters').optional().nullable(),
});

export const postController = {
  async getTodayPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const userId = req.user!.user_id;
      const posts = await postService.getTodayPosts(teamId, dateStr, userId);
      res.json(posts);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async getPostCounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const counts = await postService.getPostCounts(teamId, userId);
      res.json(counts);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async getGroupHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as string;
      const userId = req.user!.user_id;
      const history = await postService.getGroupHistory(groupId, userId);
      res.json(history);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async logPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const { groupId, dateStr, notes, postUrl } = logPostSchema.parse(req.body);
      const userId = req.user!.user_id;
      const effectiveDate = dateStr || new Date().toISOString().split('T')[0];

      const newPost = await postService.logPost(
        groupId,
        teamId,
        userId,
        effectiveDate,
        notes ?? undefined,
        postUrl ?? undefined
      );
      res.status(201).json(newPost);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postLogId = req.params.postLogId as string;
      const userId = req.user!.user_id;
      await postService.removePostLog(postLogId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async resetTeamPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      await postService.resetTeamPosts(teamId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async resetGroupPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as string;
      const userId = req.user!.user_id;
      await postService.resetGroupPosts(groupId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      handleError(res, err);
    }
  },
};
