import type { Response } from 'express';
import { z } from 'zod';
import { teamService } from '../services/team.service.js';
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

const createTeamSchema = z.object({
  name: z.string().trim().min(1, 'Team name is required').max(100, 'Team name cannot exceed 100 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  promoText: z.string().max(5000, 'Promo text cannot exceed 5000 characters').optional().default(''),
});

const updateTeamSchema = z.object({
  name: z.string().trim().min(1, 'Team name cannot be empty').max(100, 'Team name cannot exceed 100 characters').optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
});

const updatePromoSchema = z.object({
  promoText: z.string().max(5000, 'Promo text cannot exceed 5000 characters').optional().default(''),
});

const addMemberSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'member']).optional().default('member'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member'], { message: 'Valid role is required (owner, admin, member)' }),
});

const createSnippetSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title cannot exceed 150 characters'),
  content: z.string().trim().min(1, 'Content is required').max(10000, 'Content cannot exceed 10000 characters'),
});

const updateSnippetSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(150, 'Title cannot exceed 150 characters').optional(),
  content: z.string().trim().min(1, 'Content cannot be empty').max(10000, 'Content cannot exceed 10000 characters').optional(),
});

export const teamController = {
  async getTeams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;
      const teams = await teamService.getUserTeams(userId);
      res.json(teams);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async getTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const team = await teamService.getTeamById(teamId, userId);
      res.json(team);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async createTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, description, promoText } = createTeamSchema.parse(req.body);
      const userId = req.user!.user_id;
      const newTeam = await teamService.createTeam(
        name,
        description ?? null,
        promoText,
        userId
      );
      res.status(201).json(newTeam);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async updateTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const validated = updateTeamSchema.parse(req.body);
      const userId = req.user!.user_id;
      const updated = await teamService.updateTeam(
        teamId,
        validated,
        userId
      );
      res.json(updated);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async deleteTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      await teamService.deleteTeam(teamId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async updatePromo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const { promoText } = updatePromoSchema.parse(req.body);
      const userId = req.user!.user_id;
      await teamService.updatePromoText(teamId, promoText, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async getMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const members = await teamService.getTeamMembers(teamId, userId);
      res.json(members);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async addMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const { email, role } = addMemberSchema.parse(req.body);
      const userId = req.user!.user_id;

      const newMember = await teamService.addMemberByEmail(
        teamId,
        email,
        role,
        userId
      );
      res.status(201).json(newMember);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async updateMemberRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const memberId = req.params.memberId as string;
      const { role } = updateMemberRoleSchema.parse(req.body);
      const userId = req.user!.user_id;

      await teamService.updateMemberRole(teamId, memberId, role, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const memberId = req.params.memberId as string;
      const userId = req.user!.user_id;
      await teamService.removeMember(teamId, memberId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async getSnippets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const snippets = await teamService.getTeamSnippets(teamId, userId);
      res.json(snippets);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async createSnippet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const { title, content } = createSnippetSchema.parse(req.body);
      const snippet = await teamService.createSnippet(teamId, title, content, userId);
      res.status(201).json(snippet);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async updateSnippet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const snippetId = req.params.snippetId as string;
      const userId = req.user!.user_id;
      const data = updateSnippetSchema.parse(req.body);
      const updated = await teamService.updateSnippet(teamId, snippetId, data, userId);
      res.json(updated);
    } catch (err: unknown) {
      handleError(res, err);
    }
  },

  async deleteSnippet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const snippetId = req.params.snippetId as string;
      const userId = req.user!.user_id;
      await teamService.deleteSnippet(teamId, snippetId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      handleError(res, err);
    }
  },
};
