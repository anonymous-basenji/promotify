import { supabaseAdmin } from '../config/supabase';
import type { Team, TeamMember, TeamRole, Profile } from '../types/backend.types';

export const teamRepository = {
  async findByUserId(userId: string): Promise<Team[]> {
    const { data: memberRows, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error fetching team_members:', memberError);
      throw new Error(memberError.message);
    }

    if (!memberRows || memberRows.length === 0) return [];

    const roleMap: Record<string, TeamRole> = {};
    const teamIds = memberRows.map((r) => {
      roleMap[r.team_id] = r.role as TeamRole;
      return r.team_id;
    });

    const { data: teamRows, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .in('team_id', teamIds);

    if (teamError) {
      console.error('Error fetching teams:', teamError);
      throw new Error(teamError.message);
    }

    return (teamRows || []).map((t) => ({
      ...(t as Team),
      user_role: roleMap[t.team_id] || 'member',
    }));
  },

  async findById(teamId: string): Promise<Team | null> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('team_id', teamId)
      .maybeSingle();

    if (error) {
      console.error('Error finding team by id:', error);
      throw new Error(error.message);
    }
    return (data as Team) || null;
  },

  async create(teamData: {
    name: string;
    description?: string | null;
    promo_text?: string;
    user_id: string;
  }): Promise<Team> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name: teamData.name.trim(),
        description: teamData.description?.trim() || null,
        promo_text: teamData.promo_text || '',
        user_id: teamData.user_id,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating team:', error);
      throw new Error(error?.message || 'Failed to create team');
    }
    return data as Team;
  },

  async update(
    teamId: string,
    data: { name?: string; description?: string | null; promo_text?: string }
  ): Promise<Team> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.description !== undefined) {
      updatePayload.description = data.description?.trim() || null;
    }
    if (data.promo_text !== undefined) updatePayload.promo_text = data.promo_text;

    const { data: updated, error } = await supabaseAdmin
      .from('teams')
      .update(updatePayload)
      .eq('team_id', teamId)
      .select()
      .single();

    if (error || !updated) {
      console.error('Error updating team:', error);
      throw new Error(error?.message || 'Failed to update team');
    }
    return updated as Team;
  },

  async delete(teamId: string): Promise<void> {
    await supabaseAdmin.from('post_logs').delete().eq('team_id', teamId);
    await supabaseAdmin.from('facebook_groups').delete().eq('team_id', teamId);
    await supabaseAdmin.from('team_members').delete().eq('team_id', teamId);

    const { error } = await supabaseAdmin
      .from('teams')
      .delete()
      .eq('team_id', teamId);

    if (error) {
      console.error('Error deleting team:', error);
      throw new Error(error.message);
    }
  },

  async updatePromoText(teamId: string, promoText: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('teams')
      .update({ promo_text: promoText, updated_at: new Date().toISOString() })
      .eq('team_id', teamId);

    if (error) {
      console.error('Error updating promo text:', error);
      throw new Error(error.message);
    }
  },

  async getMemberRole(teamId: string, userId: string): Promise<TeamRole | null> {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error getting member role:', error);
      throw new Error(error.message);
    }
    return data ? (data.role as TeamRole) : null;
  },

  async getMembers(teamId: string): Promise<TeamMember[]> {
    const { data: memberRows, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);

    if (memberError) {
      console.error('Error getting members:', memberError);
      throw new Error(memberError.message);
    }

    if (!memberRows || memberRows.length === 0) return [];

    const userIds = memberRows.map((m) => m.user_id);
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    if (profileError) {
      console.warn('Error getting member profiles:', profileError);
    }

    const profileMap: Record<string, Profile> = {};
    (profiles || []).forEach((p) => {
      profileMap[p.user_id] = p as Profile;
    });

    return memberRows.map((row) => ({
      team_member_id: row.team_member_id,
      team_id: row.team_id,
      user_id: row.user_id,
      role: row.role as TeamRole,
      joined_at: row.joined_at,
      profile: profileMap[row.user_id],
    }));
  },

  async addMember(
    teamId: string,
    userId: string,
    role: TeamRole = 'member'
  ): Promise<TeamMember> {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: role,
      })
      .select()
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        throw new Error('This user is already a member of this team.');
      }
      console.error('Error adding member:', error);
      throw new Error(error?.message || 'Failed to add team member');
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      team_member_id: data.team_member_id,
      team_id: data.team_id,
      user_id: data.user_id,
      role: data.role as TeamRole,
      joined_at: data.joined_at,
      profile: (profile as Profile) || undefined,
    };
  },

  async updateMemberRole(teamMemberId: string, newRole: TeamRole): Promise<void> {
    const { error } = await supabaseAdmin
      .from('team_members')
      .update({ role: newRole })
      .eq('team_member_id', teamMemberId);

    if (error) {
      console.error('Error updating member role:', error);
      throw new Error(error.message);
    }
  },

  async removeMember(teamMemberId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('team_member_id', teamMemberId);

    if (error) {
      console.error('Error removing member:', error);
      throw new Error(error.message);
    }
  },

  async getMemberById(teamMemberId: string): Promise<TeamMember | null> {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .maybeSingle();

    if (error) {
      console.error('Error getting member by id:', error);
      throw new Error(error.message);
    }
    return (data as TeamMember) || null;
  },
};
