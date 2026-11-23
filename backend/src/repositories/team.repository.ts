import { db } from '../config/supabase.js';
import type { Team, TeamMember, TeamRole, Profile, TeamSnippet } from '../types/backend.types.js';

export const teamRepository = {
  async findByUserId(userId: string): Promise<Team[]> {
    const { data: memberRows, error: memberError } = await db()
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

    const { data: teamRows, error: teamError } = await db()
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
    const { data, error } = await db()
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
    const { data, error } = await db()
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

    const { data: updated, error } = await db()
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
    // post_logs, facebook_groups, team_members and team_snippets cascade on team_id
    const { data, error } = await db()
      .from('teams')
      .delete()
      .eq('team_id', teamId)
      .select('team_id');

    if (error) {
      console.error('Error deleting team:', error);
      throw new Error(error.message);
    }

    // RLS silently skips rows it blocks
    if (!data || data.length === 0) {
      const err = new Error('Only team owners can delete this workspace');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }
  },

  async updatePromoText(teamId: string, promoText: string): Promise<void> {
    const { data, error } = await db()
      .from('teams')
      .update({ promo_text: promoText, updated_at: new Date().toISOString() })
      .eq('team_id', teamId)
      .select('team_id');

    if (error) {
      console.error('Error updating promo text:', error);
      throw new Error(error.message);
    }

    // RLS silently skips rows it blocks
    if (!data || data.length === 0) {
      const err = new Error('Only team admins can edit the promo text');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }
  },

  async getMemberRole(teamId: string, userId: string): Promise<TeamRole | null> {
    const { data, error } = await db()
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
    const { data: memberRows, error: memberError } = await db()
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);

    if (memberError) {
      console.error('Error getting members:', memberError);
      throw new Error(memberError.message);
    }

    if (!memberRows || memberRows.length === 0) return [];

    const userIds = memberRows.map((m) => m.user_id);
    const { data: profiles, error: profileError } = await db()
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
    // Insert and read back separately: when a creator adds themselves, the SELECT
    // policy (is_team_member) can't see the new row inside the same INSERT ... RETURNING
    const { error: insertError } = await db()
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: role,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        const err = new Error('This user is already a member of this team.');
        (err as unknown as { status: number }).status = 409;
        throw err;
      }
      console.error('Error adding member:', insertError);
      throw new Error(insertError.message || 'Failed to add team member');
    }

    const { data, error } = await db()
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error reading back new member:', error);
      throw new Error(error?.message || 'Failed to add team member');
    }

    const { data: profile } = await db()
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
    const { data, error } = await db()
      .from('team_members')
      .update({ role: newRole })
      .eq('team_member_id', teamMemberId)
      .select('team_member_id');

    if (error) {
      console.error('Error updating member role:', error);
      throw new Error(error.message);
    }

    // RLS silently skips rows it blocks
    if (!data || data.length === 0) {
      const err = new Error('You do not have permission to change this member role');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }
  },

  async updateMemberRoleByUser(teamId: string, userId: string, newRole: TeamRole): Promise<void> {
    const { data, error } = await db()
      .from('team_members')
      .update({ role: newRole })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select('team_member_id');

    if (error) {
      console.error('Error updating member role:', error);
      throw new Error(error.message);
    }

    // RLS silently skips rows it blocks
    if (!data || data.length === 0) {
      const err = new Error('You do not have permission to change this member role');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }
  },

  async removeMember(teamMemberId: string): Promise<void> {
    const { data, error } = await db()
      .from('team_members')
      .delete()
      .eq('team_member_id', teamMemberId)
      .select('team_member_id');

    if (error) {
      console.error('Error removing member:', error);
      throw new Error(error.message);
    }

    // RLS silently skips rows it blocks
    if (!data || data.length === 0) {
      const err = new Error('You do not have permission to remove this member');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }
  },

  async getMemberById(teamMemberId: string): Promise<TeamMember | null> {
    const { data, error } = await db()
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

  async getSnippets(teamId: string): Promise<TeamSnippet[]> {
    const { data, error } = await db()
      .from('team_snippets')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching snippets:', error);
      throw new Error(error.message);
    }
    return (data || []) as TeamSnippet[];
  },

  async createSnippet(snippetData: {
    team_id: string;
    user_id: string;
    title: string;
    content: string;
  }): Promise<TeamSnippet> {
    const { data, error } = await db()
      .from('team_snippets')
      .insert({
        team_id: snippetData.team_id,
        user_id: snippetData.user_id,
        title: snippetData.title,
        content: snippetData.content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating snippet:', error);
      throw new Error(error.message);
    }
    return data as TeamSnippet;
  },

  async updateSnippet(
    snippetId: string,
    snippetData: { title?: string; content?: string }
  ): Promise<TeamSnippet> {
    const { data, error } = await db()
      .from('team_snippets')
      .update({
        ...snippetData,
        updated_at: new Date().toISOString(),
      })
      .eq('team_snippet_id', snippetId)
      .select()
      .single();

    if (error) {
      console.error('Error updating snippet:', error);
      throw new Error(error.message);
    }
    return data as TeamSnippet;
  },

  async deleteSnippet(snippetId: string): Promise<void> {
    const { data, error } = await db()
      .from('team_snippets')
      .delete()
      .eq('team_snippet_id', snippetId)
      .select('team_snippet_id');

    if (error) {
      console.error('Error deleting snippet:', error);
      throw new Error(error.message);
    }

    // RLS silently skips rows it blocks
    if (!data || data.length === 0) {
      const err = new Error('You do not have permission to delete this snippet');
      (err as unknown as { status: number }).status = 403;
      throw err;
    }
  },

  async getSnippetById(snippetId: string): Promise<TeamSnippet | null> {
    const { data, error } = await db()
      .from('team_snippets')
      .select('*')
      .eq('team_snippet_id', snippetId)
      .maybeSingle();

    if (error) {
      console.error('Error getting snippet by id:', error);
      throw new Error(error.message);
    }
    return (data as TeamSnippet) || null;
  },
};
