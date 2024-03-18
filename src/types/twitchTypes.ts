export interface TwitchApiResponse<T> {
  data: T[];
  pagination?: Pagination;
}

export interface Pagination {
  cursor: string;
}

export interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface Broadcaster {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
  created_at: string;
}

export type TwitchBroadcasterResponse = TwitchApiResponse<Broadcaster>;

export interface ScheduleCategory {
  id: string;
  name: string;
}

export interface Segment {
  id: string;
  start_time: Date;
  end_time: Date;
  title: string;
  canceled_until: null;
  category: ScheduleCategory;
  is_recurring: boolean;
}

export interface Vacation {
  start_time: Date;
  end_time: Date;
}

export interface ScheduleData {
  segments: Segment[];
  broadcaster_id: string;
  broadcaster_name: string;
  broadcaster_login: string;
  vacation: Vacation;
}

export type TwitchScheduleResponse = {
  data: ScheduleData;
  pagination: Pagination;
};

export interface Category {
  id: string;
  name: string;
  box_art_url: string;
}

export type TwitchCategoriesResponse = TwitchApiResponse<Category>;
