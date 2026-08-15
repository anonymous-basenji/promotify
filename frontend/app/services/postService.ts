import { apiFetch } from './apiClient';
import type { PostLog } from '~/types/promotify';

export const postService = {
  async getTeamPostLogsToday(
    teamId: string,
    dateStr: string
  ): Promise<Record<string, PostLog>> {
    return await apiFetch<Record<string, PostLog>>(
      `/api/teams/${teamId}/posts/today?date=${encodeURIComponent(dateStr)}`
    );
  },

  async getTeamPostCounts(teamId: string): Promise<Record<string, number>> {
    return await apiFetch<Record<string, number>>(`/api/teams/${teamId}/posts/counts`);
  },

  async getGroupPostHistory(groupId: string): Promise<PostLog[]> {
    return await apiFetch<PostLog[]>(`/api/groups/${groupId}/history`);
  },

  async logPost(
    groupId: string,
    teamId: string,
    _userId: string,
    dateStr: string,
    notes?: string,
    postUrl?: string
  ): Promise<PostLog> {
    return await apiFetch<PostLog>(`/api/teams/${teamId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ groupId, dateStr, notes, postUrl }),
    });
  },

  async removePostLog(postLogId: string): Promise<void> {
    await apiFetch<{ success: boolean }>(`/api/posts/${postLogId}`, {
      method: 'DELETE',
    });
  },
};
