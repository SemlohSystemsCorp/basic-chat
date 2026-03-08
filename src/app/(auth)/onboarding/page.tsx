'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './onboarding.module.css';

interface PendingInvite {
  id: string;
  box_id: string;
  code: string;
  box: {
    name: string;
    slug: string;
  };
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteParam = searchParams.get('invite');

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [tab, setTab] = useState<'code' | 'create'>('code');
  const [inviteCode, setInviteCode] = useState(inviteParam || '');
  const [boxName, setBoxName] = useState('');
  const [boxSlug, setBoxSlug] = useState('');
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    checkUserAndInvites();
  }, []);

  async function checkUserAndInvites() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user already belongs to a box
    const { data: memberships } = await supabase
      .from('box_members')
      .select('box_id')
      .eq('user_id', user.id)
      .limit(1);

    if (memberships && memberships.length > 0) {
      router.push(`/box/${memberships[0].box_id}`);
      return;
    }

    // Check for pending invites for this user's email
    const { data: invites } = await supabase
      .from('invites')
      .select('id, box_id, code, box:boxes(name, slug)')
      .eq('email', user.email)
      .eq('status', 'pending');

    if (invites && invites.length > 0) {
      // Auto-join if there's exactly one invite
      if (invites.length === 1) {
        await joinBox(invites[0].box_id, invites[0].id);
        return;
      }
      setPendingInvites(invites as unknown as PendingInvite[]);
    }

    // If there's an invite code in the URL, pre-fill and auto-try
    if (inviteParam) {
      setTab('code');
    }

    setLoading(false);
  }

  async function joinBox(boxId: string, inviteId?: string) {
    setJoining(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: joinError } = await supabase
      .from('box_members')
      .insert({ box_id: boxId, user_id: user.id, role: 'member' });

    if (joinError) {
      setError(joinError.message);
      setJoining(false);
      return;
    }

    // Mark invite as accepted
    if (inviteId) {
      await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);
    }

    router.push(`/box/${boxId}`);
  }

  async function handleJoinWithCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setJoining(true);

    const code = inviteCode.trim();
    if (!code) {
      setError('Please enter an invite code.');
      setJoining(false);
      return;
    }

    // Try finding a box with this invite code
    const { data: box } = await supabase
      .from('boxes')
      .select('id')
      .eq('invite_code', code)
      .single();

    if (box) {
      await joinBox(box.id);
      return;
    }

    // Try finding an invite with this code
    const { data: invite } = await supabase
      .from('invites')
      .select('id, box_id')
      .eq('code', code)
      .eq('status', 'pending')
      .single();

    if (invite) {
      await joinBox(invite.box_id, invite.id);
      return;
    }

    setError('Invalid invite code. Please check and try again.');
    setJoining(false);
  }

  async function handleCreateBox(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setJoining(true);

    const name = boxName.trim();
    const slug = boxSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    if (!name) {
      setError('Box name is required.');
      setJoining(false);
      return;
    }

    if (!slug || slug.length < 3) {
      setError('URL must be at least 3 characters.');
      setJoining(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create the box
    const { data: box, error: createError } = await supabase
      .from('boxes')
      .insert({ name, slug, owner_id: user.id })
      .select('id')
      .single();

    if (createError) {
      if (createError.message.includes('duplicate') || createError.message.includes('unique')) {
        setError('That URL is already taken. Try a different one.');
      } else {
        setError(createError.message);
      }
      setJoining(false);
      return;
    }

    // Add owner as a member
    await supabase
      .from('box_members')
      .insert({ box_id: box.id, user_id: user.id, role: 'owner' });

    // Create a default #general channel
    await supabase
      .from('channels')
      .insert({ box_id: box.id, name: 'general', description: 'General discussion', created_by: user.id });

    router.push(`/box/${box.id}`);
  }

  function handleNameChange(value: string) {
    setBoxName(value);
    // Auto-generate slug from name
    const auto = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 32);
    setBoxSlug(auto);
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className={styles.loadingState}>
              <div className="spinner" />
              <p className={styles.loadingText}>Checking for invitations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Pending invites (shown above the card) */}
        {pendingInvites.length > 0 && (
          <div className={styles.inviteList}>
            {pendingInvites.map((invite) => (
              <div key={invite.id} className={styles.inviteItem}>
                <div className={styles.inviteInfo}>
                  <div className={styles.inviteIcon}>
                    {invite.box?.name?.charAt(0)?.toUpperCase() || 'B'}
                  </div>
                  <div>
                    <div className={styles.inviteName}>{invite.box?.name}</div>
                    <div className={styles.inviteMeta}>{invite.box?.slug}.chatterbox.io</div>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => joinBox(invite.box_id, invite.id)}
                  disabled={joining}
                >
                  {joining ? 'Joining...' : 'Join'}
                </button>
              </div>
            ))}

            <div className="auth-divider">or</div>
          </div>
        )}

        <div className="auth-card">
          <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>
            {pendingInvites.length > 0 ? 'You have invitations' : 'Join or create a Box'}
          </h1>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>
            {pendingInvites.length > 0
              ? 'Pick a workspace to join, or start your own.'
              : 'Enter an invite code to join a team, or create your own workspace.'}
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'code' ? styles.tabActive : ''}`}
              onClick={() => { setTab('code'); setError(''); }}
            >
              Join with code
            </button>
            <button
              className={`${styles.tab} ${tab === 'create' ? styles.tabActive : ''}`}
              onClick={() => { setTab('create'); setError(''); }}
            >
              Create a Box
            </button>
          </div>

          {/* Join with code */}
          {tab === 'code' && (
            <form onSubmit={handleJoinWithCode}>
              <div className="field">
                <label className="label" htmlFor="inviteCode">
                  Invite code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  className="input"
                  placeholder="e.g. a1b2c3d4"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  autoFocus
                />
                <p className="field-hint">
                  Ask your team admin for the invite code.
                </p>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={joining}
              >
                {joining ? (
                  <>
                    <span className="spinner spinner-sm" /> Joining...
                  </>
                ) : (
                  'Join Box'
                )}
              </button>
            </form>
          )}

          {/* Create a box */}
          {tab === 'create' && (
            <form onSubmit={handleCreateBox}>
              <div className="field">
                <label className="label" htmlFor="boxName">
                  Box name
                </label>
                <input
                  id="boxName"
                  type="text"
                  className="input"
                  placeholder="My Company"
                  value={boxName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="boxSlug">
                  URL
                </label>
                <input
                  id="boxSlug"
                  type="text"
                  className="input"
                  placeholder="my-company"
                  value={boxSlug}
                  onChange={(e) => setBoxSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                  minLength={3}
                />
                {boxSlug && (
                  <p className={styles.slugPreview}>
                    Your Box will be at <span>{boxSlug}.chatterbox.io</span>
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={joining}
              >
                {joining ? (
                  <>
                    <span className="spinner spinner-sm" /> Creating...
                  </>
                ) : (
                  'Create Box'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.container}>
            <div className="auth-card">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0' }}>
                <div className="spinner" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
