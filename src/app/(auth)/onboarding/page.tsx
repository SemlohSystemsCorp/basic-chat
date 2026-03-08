'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
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
      router.push('/dashboard');
      return;
    }

    // If there's an invite code in the URL, go straight to join page
    if (inviteParam) {
      router.push(`/onboarding/join?invite=${inviteParam}`);
      return;
    }

    // Check for pending invites for this user's email
    const { data: invites } = await supabase
      .from('invites')
      .select('id, box_id, code, box:boxes(name, slug)')
      .eq('email', user.email)
      .eq('status', 'pending');

    if (invites && invites.length > 0) {
      if (invites.length === 1) {
        await joinBox(invites[0].box_id, invites[0].id);
        return;
      }
      setPendingInvites(invites as unknown as PendingInvite[]);
    }

    setLoading(false);
  }

  async function joinBox(boxId: string, inviteId?: string) {
    setJoining(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: joinError } = await supabase
      .from('box_members')
      .insert({ box_id: boxId, user_id: user.id, role: 'member' });

    if (joinError) {
      setJoining(false);
      return;
    }

    if (inviteId) {
      await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);
    }

    router.push('/dashboard');
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className="auth-card">
            <div className={styles.loadingState}>
              <div className="spinner" />
              <p className={styles.loadingText}>Setting things up...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
          <h1 className="auth-title" style={{ textAlign: 'center', fontSize: 26 }}>
            Welcome to Chatterbox
          </h1>
          <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: 0 }}>
            Get started by joining an existing workspace or creating your own.
          </p>
        </div>

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Pending invitations</h3>
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
            </div>

            <div className="auth-divider">or get started another way</div>
          </div>
        )}

        {/* Two option cards */}
        <div className={styles.optionGrid}>
          <Link href="/onboarding/join" className={styles.optionCard}>
            <div className={styles.optionIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h3 className={styles.optionTitle}>Join a Box</h3>
            <p className={styles.optionDesc}>
              Have an invite code? Enter it to join your team&apos;s workspace.
            </p>
            <span className={styles.optionAction}>Enter invite code &rarr;</span>
          </Link>

          <Link href="/create/box" className={styles.optionCard}>
            <div className={styles.optionIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h3 className={styles.optionTitle}>Create a Box</h3>
            <p className={styles.optionDesc}>
              Start a new workspace for your team, project, or community.
            </p>
            <span className={styles.optionAction}>Set up your workspace &rarr;</span>
          </Link>
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
