import { supabaseAdmin } from '../config/supabase.js';
import type { FacebookGroup, DayOfWeek, Profile } from '../types/backend.types.js';

export interface CreateGroupDTO {
  name: string;
  group_url?: string;
  notes?: string;
  allowed_days: DayOfWeek[];
}

export const groupRepository = {
  async findByTeamId(teamId: string): Promise<FacebookGroup[]> {
    const { data: groupRows, error: groupError } = await supabaseAdmin
      .from('facebook_groups')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (groupError) {
      console.error('Error fetching groups:', groupError);
      throw new Error(groupError.message);
    }

    if (!groupRows || groupRows.length === 0) return [];

    const userIds = Array.from(
      new Set(groupRows.map((g) => g.user_id).filter(Boolean))
    );

    const profileMap: Record<string, Profile> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      (profiles || []).forEach((p) => {
        profileMap[p.user_id] = p as Profile;
      });
    }

    return groupRows.map((row) => ({
      facebook_group_id: row.facebook_group_id,
      team_id: row.team_id,
      user_id: row.user_id,
      name: row.name,
      group_url: row.group_url,
      notes: row.notes,
      allowed_days: row.allowed_days as DayOfWeek[],
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator_profile: row.user_id ? profileMap[row.user_id] : undefined,
    }));
  },

  async findById(groupId: string): Promise<FacebookGroup | null> {
    const { data, error } = await supabaseAdmin
      .from('facebook_groups')
      .select('*')
      .eq('facebook_group_id', groupId)
      .maybeSingle();

    if (error) {
      console.error('Error finding group by id:', error);
      throw new Error(error.message);
    }
    if (!data) return null;

    let creatorProfile: Profile | undefined;
    if (data.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', data.user_id)
        .maybeSingle();
      if (profile) creatorProfile = profile as Profile;
    }

    return {
      facebook_group_id: data.facebook_group_id,
      team_id: data.team_id,
      user_id: data.user_id,
      name: data.name,
      group_url: data.group_url,
      notes: data.notes,
      allowed_days: data.allowed_days as DayOfWeek[],
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      creator_profile: creatorProfile,
    };
  },

  async create(
    teamId: string,
    userId: string,
    dto: CreateGroupDTO
  ): Promise<FacebookGroup> {
    const { data, error } = await supabaseAdmin
      .from('facebook_groups')
      .insert({
        team_id: teamId,
        user_id: userId,
        name: dto.name.trim(),
        group_url: dto.group_url?.trim() || null,
        notes: dto.notes?.trim() || null,
        allowed_days: dto.allowed_days,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating group:', error);
      throw new Error(error?.message || 'Failed to create group');
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      facebook_group_id: data.facebook_group_id,
      team_id: data.team_id,
      user_id: data.user_id,
      name: data.name,
      group_url: data.group_url,
      notes: data.notes,
      allowed_days: data.allowed_days as DayOfWeek[],
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      creator_profile: (profile as Profile) || undefined,
    };
  },

  async update(
    groupId: string,
    updates: Partial<CreateGroupDTO>
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.group_url !== undefined) payload.group_url = updates.group_url.trim() || null;
    if (updates.notes !== undefined) payload.notes = updates.notes.trim() || null;
    if (updates.allowed_days !== undefined) payload.allowed_days = updates.allowed_days;

    const { error } = await supabaseAdmin
      .from('facebook_groups')
      .update(payload)
      .eq('facebook_group_id', groupId);

    if (error) {
      console.error('Error updating group:', error);
      throw new Error(error.message);
    }
  },

  async delete(groupId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('facebook_groups')
      .delete()
      .eq('facebook_group_id', groupId);

    if (error) {
      console.error('Error deleting group:', error);
      throw new Error(error.message);
    }
  },
};
