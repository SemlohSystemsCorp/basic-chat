'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface BoxData {
  id: string;
  name: string;
  slug: string;
  invite_code: string;
  plan: string;
  owner_id: string;
}

interface ChannelData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface MemberData {
  id: string;
  user_id: string;
  role: string;
  user: {
    display_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface UserData {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

interface WorkspaceContextValue {
  loading: boolean;
  box: BoxData | null;
  channels: ChannelData[];
  members: MemberData[];
  user: UserData | null;
  isAdmin: boolean;
  addChannel: (channel: ChannelData) => void;
  refreshMembers: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}

export function WorkspaceProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [box, setBox] = useState<BoxData | null>(null);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [user, setUser] = useState<UserData | null>(null);

  const supabase = createClient();

  useEffect(() => {
    load();
  }, [slug]);

  async function load() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.push('/login'); return; }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', authUser.id)
      .single();

    // Get box
    const { data: boxData } = await supabase
      .from('boxes')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!boxData) { router.push('/dashboard'); return; }
    setBox(boxData);

    // Verify membership
    const { data: membership } = await supabase
      .from('box_members')
      .select('role')
      .eq('box_id', boxData.id)
      .eq('user_id', authUser.id)
      .single();

    if (!membership) { router.push('/dashboard'); return; }

    setUser({
      id: authUser.id,
      displayName: profile?.display_name || authUser.email?.split('@')[0] || '',
      email: authUser.email || '',
      role: membership.role,
    });

    // Load channels
    const { data: channelData } = await supabase
      .from('channels')
      .select('id, name, slug, description')
      .eq('box_id', boxData.id)
      .order('created_at', { ascending: true });

    if (channelData) setChannels(channelData);

    // Load members
    const { data: memberData } = await supabase
      .from('box_members')
      .select('id, user_id, role, user:profiles(display_name, email, avatar_url)')
      .eq('box_id', boxData.id);

    if (memberData) setMembers(memberData as unknown as MemberData[]);

    setLoading(false);
  }

  const addChannel = useCallback((channel: ChannelData) => {
    setChannels((prev) => [...prev, channel]);
  }, []);

  const refreshMembers = useCallback(async () => {
    if (!box) return;
    const { data: memberData } = await supabase
      .from('box_members')
      .select('id, user_id, role, user:profiles(display_name, email, avatar_url)')
      .eq('box_id', box.id);
    if (memberData) setMembers(memberData as unknown as MemberData[]);
  }, [box]);

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  return (
    <WorkspaceContext.Provider value={{ loading, box, channels, members, user, isAdmin, addChannel, refreshMembers }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
