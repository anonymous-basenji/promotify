import { supabaseAdmin } from '../config/supabase';
import type { Profile } from '../types/backend.types';

export const profileRepository = {
  async findByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .ilike('email', email.trim())
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as Profile) || null;
  },

  async findById(userId: string): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as Profile) || null;
  },

  async upsert(profile: Profile): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Profile;
  },
};
