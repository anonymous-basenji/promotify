import type { Response } from 'express';
import { postService } from '../services/post.service';
import type { AuthenticatedRequest } from '../types/backend.types';

export const postController = {
  async getTodayPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const userId = req.user!.user_id;
      const posts = await postService.getTodayPosts(teamId, dateStr, userId);
      res.json(posts);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async getPostCounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const counts = await postService.getPostCounts(teamId, userId);
      res.json(counts);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async getGroupHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as string;
      const userId = req.user!.user_id;
      const history = await postService.getGroupHistory(groupId, userId);
      res.json(history);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async logPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const { groupId, dateStr, notes, postUrl } = req.body;
      const userId = req.user!.user_id;
      const effectiveDate = dateStr || new Date().toISOString().split('T')[0];

      if (!groupId) {
        res.status(400).json({ error: 'groupId is required' });
        return;
      }

      const newPost = await postService.logPost(
        groupId,
        teamId,
        userId,
        effectiveDate,
        notes,
        postUrl
      );
      res.status(201).json(newPost);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postLogId = req.params.postLogId as string;
      const userId = req.user!.user_id;
      await postService.removePostLog(postLogId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async resetTeamPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      await postService.resetTeamPosts(teamId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async resetGroupPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as string;
      const userId = req.user!.user_id;
      await postService.resetGroupPosts(groupId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },
};
