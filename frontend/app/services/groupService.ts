import { apiFetch } from './apiClient';
import type { FacebookGroup, DayOfWeek } from '~/types/promotify';

export interface CreateGroupInput {
  name: string;
  group_url?: string;
  notes?: string;
  allowed_days: DayOfWeek[];
}

export const groupService = {
  async getTeamGroups(teamId: string): Promise<FacebookGroup[]> {
    return await apiFetch<FacebookGroup[]>(`/api/groups/team/${teamId}`);
  },

  async createGroup(
    teamId: string,
    _userId: string,
    input: CreateGroupInput
  ): Promise<FacebookGroup> {
    return await apiFetch<FacebookGroup>(`/api/groups/team/${teamId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateGroup(
    groupId: string,
    input: Partial<CreateGroupInput>
  ): Promise<void> {
    await apiFetch<{ success: boolean }>(`/api/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async deleteGroup(groupId: string): Promise<void> {
    await apiFetch<{ success: boolean }>(`/api/groups/${groupId}`, {
      method: 'DELETE',
    });
  },
};
