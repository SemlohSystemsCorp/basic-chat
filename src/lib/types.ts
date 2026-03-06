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
  recording_enabled: boolean;
  created_at: string;
  host?: Profile;
};

export type Workspace = {
  id: number;
  name: string;
  slug: string;
  icon_url: string | null;
  owner_id: string;
  created_at: string;
};

export type WorkspaceMember = {
  id: number;
  workspace_id: number;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profile?: Profile;
};

export type Channel = {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
};

export type ChannelMessage = {
  id: number;
  channel_id: number;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender?: Profile;
};

export type DirectMessage = {
  id: number;
  workspace_id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
};

export type Subscription = {
  id: number;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "free" | "pro" | "team";
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};
