import { supabaseAdmin } from '../config/supabase';
import type { PostLog, Profile } from '../types/backend.types';

export const postRepository = {
  async findTodayByTeam(
    teamId: string,
    dateStr: string
  ): Promise<Record<string, PostLog[]>> {
    const { data: postRows, error: postError } = await supabaseAdmin
      .from('post_logs')
      .select('*')
      .eq('team_id', teamId)
      .eq('posted_date', dateStr)
      .order('created_at', { ascending: false });

    if (postError) {
      console.error('Error fetching today posts:', postError);
      throw new Error(postError.message);
    }

    if (!postRows || postRows.length === 0) return {};

    const userIds = Array.from(
      new Set(postRows.map((p) => p.user_id).filter(Boolean))
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

    const map: Record<string, PostLog[]> = {};
    postRows.forEach((row) => {
      if (!map[row.facebook_group_id]) {
        map[row.facebook_group_id] = [];
      }
      map[row.facebook_group_id].push({
        post_log_id: row.post_log_id,
        facebook_group_id: row.facebook_group_id,
        team_id: row.team_id,
        user_id: row.user_id,
        posted_date: row.posted_date,
        post_url: row.post_url,
        notes: row.notes,
        created_at: row.created_at,
        poster_profile: row.user_id ? profileMap[row.user_id] : undefined,
      });
    });

    return map;
  },

  async getPostCountsByTeam(teamId: string): Promise<Record<string, number>> {
    const { data, error } = await supabaseAdmin
      .from('post_logs')
      .select('facebook_group_id')
      .eq('team_id', teamId);

    if (error) {
      console.error('Error getting post counts:', error);
      throw new Error(error.message);
    }

    const counts: Record<string, number> = {};
    (data || []).forEach((row) => {
      counts[row.facebook_group_id] = (counts[row.facebook_group_id] || 0) + 1;
    });

    return counts;
  },

  async findHistoryByGroup(groupId: string): Promise<PostLog[]> {
    const { data: postRows, error: postError } = await supabaseAdmin
      .from('post_logs')
      .select('*')
      .eq('facebook_group_id', groupId)
      .order('created_at', { ascending: false });

    if (postError) {
      console.error('Error fetching group post history:', postError);
      throw new Error(postError.message);
    }

    if (!postRows || postRows.length === 0) return [];

    const userIds = Array.from(
      new Set(postRows.map((p) => p.user_id).filter(Boolean))
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

    return postRows.map((row) => ({
      post_log_id: row.post_log_id,
      facebook_group_id: row.facebook_group_id,
      team_id: row.team_id,
      user_id: row.user_id,
      posted_date: row.posted_date,
      post_url: row.post_url,
      notes: row.notes,
      created_at: row.created_at,
      poster_profile: row.user_id ? profileMap[row.user_id] : undefined,
    }));
  },

  async create(postData: {
    groupId: string;
    teamId: string;
    userId: string;
    dateStr: string;
    notes?: string;
    postUrl?: string;
  }): Promise<PostLog> {
    const { data, error } = await supabaseAdmin
      .from('post_logs')
      .insert({
        facebook_group_id: postData.groupId,
        team_id: postData.teamId,
        user_id: postData.userId,
        posted_date: postData.dateStr,
        notes: postData.notes?.trim() || null,
        post_url: postData.postUrl?.trim() || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating post log:', error);
      throw new Error(error?.message || 'Failed to log post');
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', postData.userId)
      .maybeSingle();

    return {
      post_log_id: data.post_log_id,
      facebook_group_id: data.facebook_group_id,
      team_id: data.team_id,
      user_id: data.user_id,
      posted_date: data.posted_date,
      post_url: data.post_url,
      notes: data.notes,
      created_at: data.created_at,
      poster_profile: (profile as Profile) || undefined,
    };
  },

  async delete(postLogId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('post_logs')
      .delete()
      .eq('post_log_id', postLogId);

    if (error) {
      console.error('Error deleting post log:', error);
      throw new Error(error.message);
    }
  },

  async findById(postLogId: string): Promise<PostLog | null> {
    const { data, error } = await supabaseAdmin
      .from('post_logs')
      .select('*')
      .eq('post_log_id', postLogId)
      .maybeSingle();

    if (error) {
      console.error('Error finding post log by id:', error);
      throw new Error(error.message);
    }
    return (data as PostLog) || null;
  },

  async deleteAllByTeam(teamId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('post_logs')
      .delete()
      .eq('team_id', teamId);

    if (error) {
      console.error('Error resetting team post logs:', error);
      throw new Error(error.message);
    }
  },

  async deleteAllByGroup(groupId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('post_logs')
      .delete()
      .eq('facebook_group_id', groupId);

    if (error) {
      console.error('Error resetting group post logs:', error);
      throw new Error(error.message);
    }
  },
};
