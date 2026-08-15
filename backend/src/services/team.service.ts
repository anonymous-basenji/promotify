import { teamRepository } from '../repositories/team.repository';
import { profileRepository } from '../repositories/profile.repository';
import type { Team, TeamMember, TeamRole } from '../types/backend.types';

export const teamService = {
  async getUserTeams(userId: string): Promise<Team[]> {
    return await teamRepository.findByUserId(userId);
  },

  async getTeamById(teamId: string, userId: string): Promise<Team> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      const err = new Error('Team not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role && team.user_id !== userId) {
      const err = new Error('You do not have permission to view this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    return {
      ...team,
      user_role: role || (team.user_id === userId ? 'owner' : 'member'),
    };
  },

  async createTeam(
    name: string,
    description: string | null,
    promoText: string,
    userId: string
  ): Promise<Team> {
    if (!name || !name.trim()) {
      const err = new Error('Team name is required');
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    const newTeam = await teamRepository.create({
      name: name.trim(),
      description: description?.trim() || null,
      promo_text: promoText || '',
      user_id: userId,
    });

    await teamRepository.addMember(newTeam.team_id, userId, 'owner');

    return {
      ...newTeam,
      user_role: 'owner',
    };
  },

  async updatePromoText(
    teamId: string,
    promoText: string,
    userId: string
  ): Promise<void> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    await teamRepository.updatePromoText(teamId, promoText);
  },

  async getTeamMembers(teamId: string, userId: string): Promise<TeamMember[]> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    return await teamRepository.getMembers(teamId);
  },

  async addMemberByEmail(
    teamId: string,
    email: string,
    role: TeamRole,
    requestingUserId: string
  ): Promise<TeamMember> {
    const requesterRole = await teamRepository.getMemberRole(teamId, requestingUserId);
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      const err = new Error('Only team admins can invite members');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();
    const profile = await profileRepository.findByEmail(cleanEmail);

    if (!profile) {
      const err = new Error(
        `User with email "${cleanEmail}" has not signed in to Promotify One yet. Ask them to sign in once first!`
      );
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    return await teamRepository.addMember(teamId, profile.user_id, role);
  },

  async updateMemberRole(
    teamId: string,
    teamMemberId: string,
    newRole: TeamRole,
    requestingUserId: string
  ): Promise<void> {
    const requesterRole = await teamRepository.getMemberRole(teamId, requestingUserId);
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      const err = new Error('Only team admins can update roles');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    await teamRepository.updateMemberRole(teamMemberId, newRole);
  },

  async removeMember(
    teamId: string,
    teamMemberId: string,
    requestingUserId: string
  ): Promise<void> {
    const requesterRole = await teamRepository.getMemberRole(teamId, requestingUserId);
    const member = await teamRepository.getMemberById(teamMemberId);

    if (!member) {
      const err = new Error('Member not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    const isSelf = member.user_id === requestingUserId;
    const isAdmin = requesterRole === 'owner' || requesterRole === 'admin';

    if (!isSelf && !isAdmin) {
      const err = new Error('You do not have permission to remove this member');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    await teamRepository.removeMember(teamMemberId);
  },
};
