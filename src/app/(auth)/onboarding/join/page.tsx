'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../onboarding.module.css';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteParam = searchParams.get('invite');

  const [inviteCode, setInviteCode] = useState(inviteParam || '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function joinBox(boxId: string, inviteId?: string) {
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

    if (inviteId) {
      await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);
    }

    router.push('/dashboard');
  }

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <div className={styles.page}>
      <div className={styles.container} style={{ maxWidth: 420 }}>
        <div className="auth-card">
          <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>Join a Box</h1>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>
            Enter the invite code your team admin shared with you.
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
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
        </div>

        <p className="auth-footer">
          <Link href="/onboarding">&larr; Back</Link>
          {' '}&middot;{' '}
          <Link href="/create/box">Create a Box instead</Link>
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.container} style={{ maxWidth: 420 }}>
            <div className="auth-card">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0' }}>
                <div className="spinner" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
