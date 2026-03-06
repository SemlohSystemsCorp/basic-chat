export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type Meeting = {
  id: number;
  title: string;
  room_name: string;
  room_url: string;
  host_id: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  host?: Profile;
};
