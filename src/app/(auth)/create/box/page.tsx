'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './create-box.module.css';

interface CreatedBox {
  id: string;
  slug: string;
  name: string;
  invite_code: string;
}

export default function CreateBoxPage() {
  const router = useRouter();
  const [step, setStep] = useState<'name' | 'invite'>('name');
  const [boxName, setBoxName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Invite step state
  const [box, setBox] = useState<CreatedBox | null>(null);
  const [generalChannelSlug, setGeneralChannelSlug] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  async function handleCreateBox(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreating(true);

    const name = boxName.trim();
    if (!name) {
      setError('Box name is required.');
      setCreating(false);
      return;
    }

    const res = await fetch('/api/boxes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to create box.');
      setCreating(false);
      return;
    }

    setBox(data.box);
    setGeneralChannelSlug(data.generalChannelSlug || '');
    setStep('invite');
    setCreating(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviting(true);

    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setInviteError('Email is required.');
      setInviting(false);
      return;
    }

    if (invitedEmails.includes(email)) {
      setInviteError('Already invited.');
      setInviting(false);
      return;
    }

    if (!box) return;

    const res = await fetch('/api/invites/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, boxId: box.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      setInviteError(data.error || 'Failed to send invite.');
      setInviting(false);
      return;
    }

    setInvitedEmails([...invitedEmails, email]);
    setInviteEmail('');
    setInviting(false);
  }

  function copyInviteCode() {
    if (!box) return;
    navigator.clipboard.writeText(box.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  // Step 1: Name
  if (step === 'name') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className="auth-card">
            <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
            <h1 className="auth-title" style={{ textAlign: 'center' }}>Create a Box</h1>
            <p className="auth-subtitle" style={{ textAlign: 'center' }}>
              Give your workspace a name to get started.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

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
                  onChange={(e) => setBoxName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <span className="spinner spinner-sm" /> Creating...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          </div>

          <p className="auth-footer">
            <Link href="/onboarding">&larr; Back</Link>
            {' '}&middot;{' '}
            <Link href="/onboarding/join">Join a Box instead</Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Invite people
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className="auth-card">
          <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>
            {box?.name} is ready
          </h1>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>
            Invite your team, or skip this and do it later.
          </p>

          {/* Invite code */}
          <div className={styles.codeSection}>
            <label className="label">Invite code</label>
            <div className={styles.codeBox}>
              <code className={styles.code}>{box?.invite_code}</code>
              <button className="btn btn-secondary btn-sm" onClick={copyInviteCode}>
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="field-hint">
              Anyone with this code can join your Box.
            </p>
          </div>

          <div className="auth-divider">or invite by email</div>

          {/* Email invite form */}
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
              {inviting ? '...' : 'Invite'}
            </button>
          </form>
          {inviteError && <p className={styles.errorText}>{inviteError}</p>}

          {/* Invited list */}
          {invitedEmails.length > 0 && (
            <div className={styles.invitedList}>
              {invitedEmails.map((email) => (
                <div key={email} className={styles.invitedItem}>
                  <span>{email}</span>
                  <span className="badge badge-success">Invited</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button
              className="btn btn-primary btn-full"
              onClick={() => router.push(generalChannelSlug ? `/w/${box?.slug}/c/${generalChannelSlug}` : `/w/${box?.slug}`)}
            >
              {invitedEmails.length > 0 ? 'Go to your Box' : 'Skip for now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
