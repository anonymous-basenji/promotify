import { apiFetch } from './apiClient';
import type { Team, TeamMember, TeamRole } from '~/types/promotify';

export const teamService = {
  async getUserTeams(_userId?: string): Promise<Team[]> {
    return await apiFetch<Team[]>('/api/teams');
  },

  async getTeamById(teamId: string, _userId?: string): Promise<Team | null> {
    try {
      return await apiFetch<Team>(`/api/teams/${teamId}`);
    } catch (err) {
      console.error('Error fetching team from backend:', err);
      return null;
    }
  },

  async createTeam(
    name: string,
    description: string,
    promoText: string,
    _userId?: string
  ): Promise<Team> {
    return await apiFetch<Team>('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name, description, promoText }),
    });
  },

  async updateTeamPromoText(teamId: string, promoText: string): Promise<void> {
    await apiFetch<{ success: boolean }>(`/api/teams/${teamId}/promo`, {
      method: 'PATCH',
      body: JSON.stringify({ promoText }),
    });
  },

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await apiFetch<TeamMember[]>(`/api/teams/${teamId}/members`);
  },

  async addTeamMemberByEmail(
    teamId: string,
    email: string,
    role: TeamRole = 'member'
  ): Promise<TeamMember> {
    return await apiFetch<TeamMember>(`/api/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  },

  async updateMemberRole(teamMemberId: string, newRole: TeamRole): Promise<void> {
    await apiFetch<{ success: boolean }>(
      `/api/teams/current/members/${teamMemberId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      }
    );
  },

  async removeMember(teamMemberId: string): Promise<void> {
    await apiFetch<{ success: boolean }>(
      `/api/teams/current/members/${teamMemberId}`,
      {
        method: 'DELETE',
      }
    );
  },
};
