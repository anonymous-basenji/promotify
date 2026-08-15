import { groupRepository, type CreateGroupDTO } from '../repositories/group.repository';
import { teamRepository } from '../repositories/team.repository';
import type { FacebookGroup } from '../types/backend.types';

export const groupService = {
  async getTeamGroups(teamId: string, userId: string): Promise<FacebookGroup[]> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    return await groupRepository.findByTeamId(teamId);
  },

  async createGroup(
    teamId: string,
    userId: string,
    dto: CreateGroupDTO
  ): Promise<FacebookGroup> {
    const role = await teamRepository.getMemberRole(teamId, userId);
    if (!role) {
      const err = new Error('You are not a member of this team');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }

    if (!dto.name || !dto.name.trim()) {
      const err = new Error('Group name is required');
      (err as unknown as { status: number }).status = 400;
      throw err;
    }

    return await groupRepository.create(teamId, userId, dto);
  },

  async updateGroup(
    groupId: string,
    userId: string,
    updates: Partial<CreateGroupDTO>
  ): Promise<void> {
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

    await groupRepository.update(groupId, updates);
  },

  async deleteGroup(groupId: string, userId: string): Promise<void> {
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

    await groupRepository.delete(groupId);
  },
};
