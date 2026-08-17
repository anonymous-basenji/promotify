import type { Response } from 'express';
import { groupService } from '../services/group.service.js';
import type { AuthenticatedRequest } from '../types/backend.types.js';

export const groupController = {
  async getTeamGroups(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const groups = await groupService.getTeamGroups(teamId, userId);
      res.json(groups);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async createGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const { name, group_url, notes, allowed_days } = req.body;

      const newGroup = await groupService.createGroup(teamId, userId, {
        name,
        group_url,
        notes,
        allowed_days: allowed_days || [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
      });
      res.status(201).json(newGroup);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async updateGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as string;
      const userId = req.user!.user_id;
      const { name, group_url, notes, allowed_days } = req.body;

      await groupService.updateGroup(groupId, userId, {
        name,
        group_url,
        notes,
        allowed_days,
      });
      res.json({ success: true });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async deleteGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as string;
      const userId = req.user!.user_id;
      await groupService.deleteGroup(groupId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },
};
