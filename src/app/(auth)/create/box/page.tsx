'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import styles from './create-box.module.css';

type Source = 'fresh' | 'slack' | null;

interface CreatedBox {
  id: string;
  slug: string;
  name: string;
  invite_code: string;
}

interface SlackChannel {
  id: string;
  name: string;
  purpose: string;
  num_members: number;
}

function CreateBoxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'source' | 'name' | 'import' | 'invite'>('source');
  const [source, setSource] = useState<Source>(null);
  const [boxName, setBoxName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Slack import state
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackTeamName, setSlackTeamName] = useState('');
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    channelsCreated: number;
    messagesImported: number;
    channelsSkipped: number;
    errors: string[];
  } | null>(null);
  const [importError, setImportError] = useState('');

  // Invite step state
  const [box, setBox] = useState<CreatedBox | null>(null);
  const [generalChannelSlug, setGeneralChannelSlug] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  // Check if returning from Slack OAuth
  useEffect(() => {
    const connected = searchParams.get('slack_connected');
    const team = searchParams.get('slack_team');
    const slackError = searchParams.get('slack_error');

    if (connected === '1' && team) {
      setSlackConnected(true);
      setSlackTeamName(team);
      setSource('slack');
      const savedBox = sessionStorage.getItem('chatterbox_creating_box');
      if (savedBox) {
        const parsed = JSON.parse(savedBox);
        setBox(parsed.box);
        setGeneralChannelSlug(parsed.generalChannelSlug);
        setStep('import');
        loadSlackChannels(parsed.box.id);
        sessionStorage.removeItem('chatterbox_creating_box');
      }
    }

    if (slackError) {
      setError(`Slack connection failed: ${slackError}`);
    }
  }, [searchParams]);

  function selectSource(s: Source) {
    setSource(s);
    setStep('name');
  }

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
    setCreating(false);

    if (source === 'slack') {
      sessionStorage.setItem('chatterbox_creating_box', JSON.stringify({
        box: data.box,
        generalChannelSlug: data.generalChannelSlug || '',
      }));
      window.location.href = `/api/import/slack/oauth?boxId=${data.box.id}&returnTo=/create/box`;
    } else {
      setStep('invite');
    }
  }

  async function loadSlackChannels(boxId: string) {
    setLoadingChannels(true);
    try {
      const res = await fetch('/api/import/slack', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId }),
      });
      const data = await res.json();
      if (data.channels) {
        setSlackChannels(data.channels);
        setSelectedChannels(new Set(data.channels.map((ch: SlackChannel) => ch.id)));
      }
    } catch {
      setImportError('Failed to load Slack channels.');
    }
    setLoadingChannels(false);
  }

  function toggleChannel(channelId: string) {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  }

  function toggleAll() {
    if (selectedChannels.size === slackChannels.length) {
      setSelectedChannels(new Set());
    } else {
      setSelectedChannels(new Set(slackChannels.map(ch => ch.id)));
    }
  }

  async function handleImport() {
    if (!box) return;
    setImporting(true);
    setImportError('');
    setImportResult(null);

    try {
      const res = await fetch('/api/import/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boxId: box.id,
          channelIds: Array.from(selectedChannels),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || 'Import failed.');
      } else {
        setImportResult(data.results);
      }
    } catch {
      setImportError('Import failed. Please try again.');
    }
    setImporting(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviting(true);

    const email = inviteEmail.trim().toLowerCase();
    if (!email) { setInviteError('Email is required.'); setInviting(false); return; }
    if (invitedEmails.includes(email)) { setInviteError('Already invited.'); setInviting(false); return; }
    if (!box) return;

    const res = await fetch('/api/invites/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, boxId: box.id }),
    });
    const data = await res.json();
    if (!res.ok) { setInviteError(data.error || 'Failed to send invite.'); setInviting(false); return; }

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

  // Step 1: Choose source
  if (step === 'source') {
    return (
      <div className={styles.page}>
        <div className={styles.containerWide}>
          <div className={styles.header}>
            <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
            <h1 className="auth-title" style={{ textAlign: 'center' }}>Create a Box</h1>
            <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: 0 }}>
              How would you like to get started?
            </p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <div className={styles.sourceGrid}>
            <button className={styles.sourceCard} onClick={() => selectSource('fresh')}>
              <div className={styles.sourceIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className={styles.sourceTitle}>Start fresh</div>
              <div className={styles.sourceDesc}>
                Create an empty workspace and set everything up from scratch.
              </div>
            </button>

            <button className={styles.sourceCard} onClick={() => selectSource('slack')}>
              <div className={styles.sourceIconBrand}>
                <svg width="40" height="40" viewBox="0 0 127 127" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A"/>
                  <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0"/>
                  <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D"/>
                  <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E"/>
                </svg>
              </div>
              <div className={styles.sourceTitle}>Migrate from Slack</div>
              <div className={styles.sourceDesc}>
                Connect your Slack workspace and import channels and messages.
              </div>
            </button>
          </div>

          <p className="auth-footer">
            <Link href="/onboarding">&larr; Back to onboarding</Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Name
  if (step === 'name') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className="auth-card">
            <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
            <h1 className="auth-title" style={{ textAlign: 'center' }}>Name your Box</h1>
            <p className="auth-subtitle" style={{ textAlign: 'center' }}>
              {source === 'fresh'
                ? 'Give your workspace a name to get started.'
                : 'Name your workspace, then connect your Slack.'}
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleCreateBox}>
              <div className="field">
                <label className="label" htmlFor="boxName">Box name</label>
                <input
                  id="boxName"
                  type="text"
                  className="input"
                  placeholder={source === 'slack' ? 'e.g. My Slack Workspace' : 'My Company'}
                  value={boxName}
                  onChange={(e) => setBoxName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={creating}>
                {creating ? (
                  <><span className="spinner spinner-sm" /> Creating...</>
                ) : source === 'slack' ? (
                  'Create & Connect Slack'
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            <button
              className="btn btn-ghost btn-full"
              style={{ marginTop: 8 }}
              onClick={() => { setStep('source'); setError(''); }}
            >
              &larr; Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3 (Slack): Select & import channels
  if (step === 'import') {
    return (
      <div className={styles.page}>
        <div className={styles.containerWide}>
          <div className="auth-card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
            <h1 className="auth-title" style={{ textAlign: 'center' }}>Import from Slack</h1>

            {slackConnected && (
              <div className={styles.connectedBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Connected to <strong>{slackTeamName}</strong>
              </div>
            )}

            <p className="auth-subtitle" style={{ textAlign: 'center' }}>
              Select which channels to import into your workspace.
            </p>

            {loadingChannels ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                <span className="spinner" />
              </div>
            ) : slackChannels.length > 0 ? (
              <>
                <div className={styles.channelListHeader}>
                  <label className={styles.selectAll}>
                    <input
                      type="checkbox"
                      checked={selectedChannels.size === slackChannels.length}
                      onChange={toggleAll}
                    />
                    Select all ({slackChannels.length} channels)
                  </label>
                </div>
                <div className={styles.channelList}>
                  {slackChannels.map(ch => (
                    <label key={ch.id} className={styles.channelItem}>
                      <input
                        type="checkbox"
                        checked={selectedChannels.has(ch.id)}
                        onChange={() => toggleChannel(ch.id)}
                      />
                      <div className={styles.channelInfo}>
                        <span className={styles.channelName}># {ch.name}</span>
                        {ch.purpose && <span className={styles.channelPurpose}>{ch.purpose}</span>}
                      </div>
                      <span className={styles.channelMembers}>{ch.num_members}</span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <div className="alert alert-info">
                No channels found. Make sure the Slack app has access to your channels.
              </div>
            )}

            {importError && <div className="alert alert-error" style={{ marginTop: 12 }}>{importError}</div>}

            {importResult && (
              <div className="alert alert-success" style={{ marginTop: 12 }}>
                Import complete: {importResult.channelsCreated} channels created, {importResult.messagesImported} messages imported.
                {importResult.channelsSkipped > 0 && ` ${importResult.channelsSkipped} skipped.`}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {!importResult && slackChannels.length > 0 && (
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleImport}
                  disabled={importing || selectedChannels.size === 0}
                >
                  {importing ? (
                    <><span className="spinner spinner-sm" /> Importing...</>
                  ) : (
                    `Import ${selectedChannels.size} channel${selectedChannels.size !== 1 ? 's' : ''}`
                  )}
                </button>
              )}
              <button
                className={importResult ? 'btn btn-primary btn-full' : 'btn btn-ghost btn-full'}
                onClick={() => setStep('invite')}
              >
                {importResult ? 'Continue' : 'Skip import'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Invite
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className="auth-card">
          <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>{box?.name} is ready</h1>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>
            Invite your team, or skip this and do it later.
          </p>

          <div className={styles.codeSection}>
            <label className="label">Invite code</label>
            <div className={styles.codeBox}>
              <code className={styles.code}>{box?.invite_code}</code>
              <button className="btn btn-secondary btn-sm" onClick={copyInviteCode}>
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="field-hint">Anyone with this code can join your Box.</p>
          </div>

          <div className="auth-divider">or invite by email</div>

          <form onSubmit={handleInvite} className={styles.inviteForm}>
            <input type="email" className="input" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            <button type="submit" className="btn btn-primary" disabled={inviting}>{inviting ? '...' : 'Invite'}</button>
          </form>
          {inviteError && <p className={styles.errorText}>{inviteError}</p>}

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
            <button className="btn btn-primary btn-full" onClick={() => router.push(generalChannelSlug ? `/w/${box?.slug}/c/${generalChannelSlug}` : `/w/${box?.slug}`)}>
              {invitedEmails.length > 0 ? 'Go to your Box' : 'Skip for now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateBoxPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <span className="spinner" />
        </div>
      </div>
    }>
      <CreateBoxContent />
    </Suspense>
  );
}
