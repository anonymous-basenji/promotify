import type { Response } from 'express';
import { z } from 'zod';
import { groupService } from '../services/group.service.js';
import type { AuthenticatedRequest } from '../types/backend.types.js';
import { handleError } from '../utils/handle-error.js';

const daysOfWeekEnum = z.enum([
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]);

const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(150, 'Group name cannot exceed 150 characters'),
  group_url: z.string().trim().max(1000, 'URL cannot exceed 1000 characters').nullish().transform(val => val ?? undefined),
  notes: z.string().trim().max(2000, 'Notes cannot exceed 2000 characters').nullish().transform(val => val ?? undefined),
  member_count: z.number().int().nonnegative().nullish().transform(val => val ?? null),
  allowed_days: z.array(daysOfWeekEnum).optional().default([
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]),
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name cannot be empty').max(150, 'Group name cannot exceed 150 characters').optional(),
  group_url: z.string().trim().max(1000, 'URL cannot exceed 1000 characters').nullish().transform(val => val ?? undefined),
  notes: z.string().trim().max(2000, 'Notes cannot exceed 2000 characters').nullish().transform(val => val ?? undefined),
  member_count: z.number().int().nonnegative().nullish().transform(val => val ?? null),
  allowed_days: z.array(daysOfWeekEnum).optional(),
});

export const groupController = {
  async getTeamGroups(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const groups = await groupService.getTeamGroups(teamId, userId);
      res.json(groups);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async createGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const validated = createGroupSchema.parse(req.body);

      const newGroup = await groupService.createGroup(teamId, userId, validated);
      res.status(201).json(newGroup);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async updateGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as string;
      const userId = req.user!.user_id;
      const validated = updateGroupSchema.parse(req.body);

      await groupService.updateGroup(groupId, userId, validated);
      res.json({ success: true });
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async deleteGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const groupId = req.params.groupId as string;
      const userId = req.user!.user_id;
      await groupService.deleteGroup(groupId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      handleError(res, err);
    }
  },
};
