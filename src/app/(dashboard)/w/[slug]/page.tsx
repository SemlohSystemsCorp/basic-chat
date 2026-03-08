'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './workspace.module.css';

interface BoxData {
  id: string;
  name: string;
  slug: string;
  invite_code: string;
  plan: string;
  owner_id: string;
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

interface InviteData {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [box, setBox] = useState<BoxData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [userRole, setUserRole] = useState('member');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadWorkspace();
  }, [slug]);

  async function loadWorkspace() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Get box by slug
    const { data: boxData } = await supabase
      .from('boxes')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!boxData) {
      router.push('/dashboard');
      return;
    }

    setBox(boxData);

    // Get user's role
    const { data: membership } = await supabase
      .from('box_members')
      .select('role')
      .eq('box_id', boxData.id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      router.push('/dashboard');
      return;
    }

    setUserRole(membership.role);

    // Get members
    const { data: memberData } = await supabase
      .from('box_members')
      .select('id, user_id, role, user:profiles(display_name, email, avatar_url)')
      .eq('box_id', boxData.id);

    if (memberData) {
      setMembers(memberData as unknown as MemberData[]);
    }

    // Get pending invites (if admin/owner)
    if (membership.role === 'owner' || membership.role === 'admin') {
      const { data: inviteData } = await supabase
        .from('invites')
        .select('id, email, status, created_at')
        .eq('box_id', boxData.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (inviteData) {
        setInvites(inviteData);
      }
    }

    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviting(true);

    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setInviteError('Email is required.');
      setInviting(false);
      return;
    }

    if (!box) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if already a member
    const existingMember = members.find(
      (m) => m.user?.email === email
    );
    if (existingMember) {
      setInviteError('This person is already a member.');
      setInviting(false);
      return;
    }

    // Check for existing pending invite
    const existingInvite = invites.find((i) => i.email === email);
    if (existingInvite) {
      setInviteError('An invite has already been sent to this email.');
      setInviting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('invites')
      .insert({
        box_id: box.id,
        email,
        invited_by: user.id,
      });

    if (insertError) {
      setInviteError(insertError.message);
      setInviting(false);
      return;
    }

    setInviteSuccess(`Invite sent to ${email}`);
    setInviteEmail('');
    setInviting(false);

    // Reload invites
    const { data: inviteData } = await supabase
      .from('invites')
      .select('id, email, status, created_at')
      .eq('box_id', box.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (inviteData) {
      setInvites(inviteData);
    }
  }

  function copyInviteCode() {
    if (!box) return;
    navigator.clipboard.writeText(box.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (!box) return null;

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/dashboard" className={styles.backLink}>&larr; Dashboard</Link>
            <div className={styles.boxHeader}>
              <div className={styles.boxIcon}>
                {box.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className={styles.boxName}>{box.name}</h1>
                <p className={styles.boxMeta}>
                  w/{box.slug} &middot; {box.plan === 'pro' ? 'Pro' : 'Free'} &middot; {members.length} member{members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Code */}
        {isAdmin && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Invite Code</h2>
            <div className={styles.inviteCodeBox}>
              <code className={styles.inviteCode}>{box.invite_code}</code>
              <button className="btn btn-secondary btn-sm" onClick={copyInviteCode}>
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className={styles.hint}>Share this code with anyone you want to invite.</p>
          </div>
        )}

        {/* Invite by Email */}
        {isAdmin && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Invite by Email</h2>
            <form onSubmit={handleInvite} className={styles.inviteForm}>
              <input
                type="email"
                className="input"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={inviting}
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
            {inviteError && <p className={styles.errorText}>{inviteError}</p>}
            {inviteSuccess && <p className={styles.successText}>{inviteSuccess}</p>}

            {invites.length > 0 && (
              <div className={styles.pendingList}>
                <p className={styles.pendingTitle}>Pending invites</p>
                {invites.map((invite) => (
                  <div key={invite.id} className={styles.pendingItem}>
                    <span>{invite.email}</span>
                    <span className="badge badge-primary">Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Members</h2>
          <div className={styles.memberList}>
            {members.map((member) => (
              <div key={member.id} className={styles.memberItem}>
                <div className="avatar">
                  {member.user?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>{member.user?.display_name}</div>
                  <div className={styles.memberEmail}>{member.user?.email}</div>
                </div>
                <span className={`badge ${member.role === 'owner' ? 'badge-primary' : 'badge-success'}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
