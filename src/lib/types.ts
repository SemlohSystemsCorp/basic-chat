export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Box {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  icon_url: string | null;
  invite_code: string;
  plan: 'free' | 'pro';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  box_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  edited_at: string | null;
  created_at: string;
  user?: User;
}

export interface BoxMember {
  id: string;
  box_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: User;
}

export interface Invite {
  id: string;
  box_id: string;
  email: string;
  invited_by: string;
  code: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  box?: Box;
}
