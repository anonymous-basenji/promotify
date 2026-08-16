import type { Response } from 'express';
import { teamService } from '../services/team.service';
import type { AuthenticatedRequest } from '../types/backend.types';

export const teamController = {
  async getTeams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.user_id;
      const teams = await teamService.getUserTeams(userId);
      res.json(teams);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async getTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const team = await teamService.getTeamById(teamId, userId);
      res.json(team);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async createTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, description, promoText } = req.body;
      const userId = req.user!.user_id;
      const newTeam = await teamService.createTeam(
        name,
        description,
        promoText,
        userId
      );
      res.status(201).json(newTeam);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async updateTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const { name, description } = req.body;
      const userId = req.user!.user_id;
      const updated = await teamService.updateTeam(
        teamId,
        { name, description },
        userId
      );
      res.json(updated);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async deleteTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      await teamService.deleteTeam(teamId, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async updatePromo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const { promoText } = req.body;
      const userId = req.user!.user_id;
      await teamService.updatePromoText(teamId, promoText || '', userId);
      res.json({ success: true });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async getMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const userId = req.user!.user_id;
      const members = await teamService.getTeamMembers(teamId, userId);
      res.json(members);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async addMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const { email, role } = req.body;
      const userId = req.user!.user_id;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const newMember = await teamService.addMemberByEmail(
        teamId,
        email,
        role || 'member',
        userId
      );
      res.status(201).json(newMember);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },

  async updateMemberRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamId = req.params.teamId as string;
      const memberId = req.params.memberId as string;
      const { role } = req.body;
      const userId = req.user!.user_id;

      if (!role || !['owner', 'admin', 'member'].includes(role)) {
        res.status(400).json({ error: 'Valid role is required (owner, admin, member)' });
        return;
      }

      await teamService.updateMemberRole(teamId, memberId, role, userId);
      res.json({ success: true });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
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
      const status = (err as { status?: number }).status || 500;
      res.status(status).json({ error: (err as Error).message });
    }
  },
};
