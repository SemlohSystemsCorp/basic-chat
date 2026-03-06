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
