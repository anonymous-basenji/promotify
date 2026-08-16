export type DayOfWeek = 
  | 'Sunday' 
  | 'Monday' 
  | 'Tuesday' 
  | 'Wednesday' 
  | 'Thursday' 
  | 'Friday' 
  | 'Saturday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export type TeamRole = 'owner' | 'admin' | 'member';

export interface Profile {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  team_id: string;
  user_id: string | null; // Creator user_id
  name: string;
  description?: string | null;
  promo_text: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  user_role?: TeamRole;
}

export interface TeamMember {
  team_member_id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  profile?: Profile;
}

export interface FacebookGroup {
  facebook_group_id: string;
  team_id: string;
  user_id: string | null; // User who added the group
  name: string;
  group_url?: string | null;
  notes?: string | null;
  allowed_days: DayOfWeek[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_profile?: Profile | null;
  // Computed client-side helper fields
  today_post?: PostLog | null;
  post_count?: number;
}

export interface LegacyFacebookGroup {
  id: string;
  name: string;
  days: Record<DayOfWeek, boolean>;
  notes?: string;
  groupUrl?: string;
  lastPostedDate?: string;
}

export interface PostLog {
  post_log_id: string;
  facebook_group_id: string;
  team_id: string;
  user_id: string | null; // User who posted
  posted_date: string;
  post_url?: string | null;
  notes?: string | null;
  created_at: string;
  poster_profile?: Profile | null;
}

export type ViewFilter = 'today' | DayOfWeek | 'all';
