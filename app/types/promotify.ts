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

export interface FacebookGroup {
  id: string;
  name: string;
  days: Record<DayOfWeek, boolean>;
  notes?: string;
  groupUrl?: string;
  lastPostedDate?: string;
}

export type ViewFilter = 'today' | DayOfWeek | 'all';
