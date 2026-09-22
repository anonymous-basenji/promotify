import { teamRepository } from '../repositories/team.repository.js';
import { profileRepository } from '../repositories/profile.repository.js';
import type { Team, TeamMember, TeamRole, TeamSnippet } from '../types/backend.types.js';

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

  async updateTeam(
    teamId: string,
    data: { name?: string; description?: string | null },
    userId: string
  ): Promise<Team> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (role !== 'owner' && role !== 'admin') {
      const err = new Error('Only team admins can edit workspace details');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    if (data.name !== undefined && !data.name.trim()) {
      const err = new Error('Team name cannot be empty');
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    const updated = await teamRepository.update(teamId, data);
    return {
      ...updated,
      user_role: role,
    };
  },

  async deleteTeam(teamId: string, userId: string): Promise<void> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (role !== 'owner') {
      const err = new Error('Only team owners can delete this workspace');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    await teamRepository.delete(teamId);
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

    const targetMember = await teamRepository.getMemberById(teamMemberId);
    if (!targetMember) {
      const err = new Error('Member not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    if (targetMember.team_id !== teamId) {
      const err = new Error('Member does not belong to this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    if (targetMember.user_id === requestingUserId) {
      const err = new Error('You cannot change your own role');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    if (newRole === 'owner' && requesterRole !== 'owner') {
      const err = new Error('Only the team owner can transfer ownership');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    if (targetMember.role === 'owner' && requesterRole !== 'owner') {
      const err = new Error('Admins cannot change the owner role');
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

    if (member.team_id !== teamId) {
      const err = new Error('Member does not belong to this team');
      (err as unknown as { status: number }).status = 403;
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

  async getTeamSnippets(teamId: string, userId: string): Promise<TeamSnippet[]> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }
    return await teamRepository.getSnippets(teamId);
  },

  async createSnippet(
    teamId: string,
    title: string,
    content: string,
    userId: string
  ): Promise<TeamSnippet> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    if (!title || !title.trim()) {
      const err = new Error('Title is required');
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    if (!content || !content.trim()) {
      const err = new Error('Content is required');
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    return await teamRepository.createSnippet({
      team_id: teamId,
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
    });
  },

  async updateSnippet(
    teamId: string,
    snippetId: string,
    data: { title?: string; content?: string },
    userId: string
  ): Promise<TeamSnippet> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    const snippet = await teamRepository.getSnippetById(snippetId);
    if (!snippet) {
      const err = new Error('Snippet not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    if (snippet.team_id !== teamId) {
      const err = new Error('Snippet does not belong to this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    return await teamRepository.updateSnippet(snippetId, {
      title: data.title !== undefined ? data.title.trim() : undefined,
      content: data.content !== undefined ? data.content.trim() : undefined,
    });
  },

  async deleteSnippet(
    teamId: string,
    snippetId: string,
    userId: string
  ): Promise<void> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    const snippet = await teamRepository.getSnippetById(snippetId);
    if (!snippet) {
      const err = new Error('Snippet not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    if (snippet.team_id !== teamId) {
      const err = new Error('Snippet does not belong to this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    await teamRepository.deleteSnippet(snippetId);
  },
};
