import { postRepository } from '../repositories/post.repository.js';
import { teamRepository } from '../repositories/team.repository.js';
import { groupRepository } from '../repositories/group.repository.js';
import type { PostLog } from '../types/backend.types.js';

export const postService = {
  async getTodayPosts(
    teamId: string,
    dateStr: string,
    userId: string
  ): Promise<Record<string, PostLog[]>> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    return await postRepository.findTodayByTeam(teamId, dateStr);
  },

  async getPostCounts(
    teamId: string,
    userId: string
  ): Promise<Record<string, number>> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    return await postRepository.getPostCountsByTeam(teamId);
  },

  async getGroupHistory(groupId: string, userId: string): Promise<PostLog[]> {
    const group = await groupRepository.findById(groupId);
    if (!group) {
      const err = new Error('Group not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    const role = await teamRepository.getMemberRole(group.team_id, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    return await postRepository.findHistoryByGroup(groupId);
  },

  async logPost(
    groupId: string,
    teamId: string,
    userId: string,
    dateStr: string,
    notes?: string,
    postUrl?: string
  ): Promise<PostLog> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    return await postRepository.create({
      groupId,
      teamId,
      userId,
      dateStr,
      notes,
      postUrl,
    });
  },

  async removePostLog(postLogId: string, userId: string): Promise<void> {
    const log = await postRepository.findById(postLogId);
    if (!log) {
      const err = new Error('Post log entry not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    const role = await teamRepository.getMemberRole(log.team_id, userId);
    const isOwner = log.user_id === userId;
    const isAdmin = role === 'owner' || role === 'admin';

    if (!isOwner && !isAdmin) {
      const err = new Error('You do not have permission to delete this post log');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    await postRepository.delete(postLogId);
  },

  async resetTeamPosts(teamId: string, userId: string): Promise<void> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role || (role !== 'owner' && role !== 'admin')) {
      const err = new Error('Only team admins can reset post counts');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    await postRepository.deleteAllByTeam(teamId);
  },

  async resetGroupPosts(groupId: string, userId: string): Promise<void> {
    const group = await groupRepository.findById(groupId);
    if (!group) {
      const err = new Error('Group not found');
      (err as unknown as { status: number }).status = 404;
      throw err;
    }

    const role = await teamRepository.getMemberRole(group.team_id, userId);
    if (!role || (role !== 'owner' && role !== 'admin')) {
      const err = new Error('Only team admins can reset post counts for this group');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    await postRepository.deleteAllByGroup(groupId);
  },
};
