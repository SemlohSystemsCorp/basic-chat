'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '../workspace-context';
import styles from '@/app/(dashboard)/dashboard/settings/settings.module.css';

type Section = 'general' | 'members' | 'roles' | 'invites' | 'permissions' | 'import' | 'danger';

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { box, members, user, isAdmin, refreshMembers } = useWorkspace();
  const supabase = createClient();

  const [activeSection, setActiveSection] = useState<Section>('general');

  // General
  const [boxName, setBoxName] = useState('');
  const [boxDescription, setBoxDescription] = useState('');

  // Permissions
  const [allowMemberInvites, setAllowMemberInvites] = useState(true);
  const [allowMemberChannels, setAllowMemberChannels] = useState(true);

  // Save state
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [sectionMsg, setSectionMsg] = useState<Record<string, string>>({});

  // Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  // Member management
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);

  // Import
  const [slackConnection, setSlackConnection] = useState<{ slack_team_name: string; connected_at: string } | null>(null);
  const [loadingSlackStatus, setLoadingSlackStatus] = useState(false);
  const [slackChannels, setSlackChannels] = useState<{ id: string; name: string; purpose: string; num_members: number }[]>([]);
  const [selectedSlackChannels, setSelectedSlackChannels] = useState<Set<string>>(new Set());
  const [loadingSlackChannels, setLoadingSlackChannels] = useState(false);
  const [importingSlack, setImportingSlack] = useState(false);
  const [slackImportResult, setSlackImportResult] = useState<{
    channelsCreated: number;
    messagesImported: number;
    channelsSkipped: number;
    errors: string[];
  } | null>(null);
  const [slackImportError, setSlackImportError] = useState('');

  useEffect(() => {
    if (box) {
      setBoxName(box.name || '');
      setBoxDescription(((box as unknown) as Record<string, unknown>).description as string || '');
    }
  }, [box]);

  useEffect(() => {
    if (box) loadPermissions();
  }, [box]);

  async function loadPermissions() {
    if (!box) return;
    const { data } = await supabase
      .from('boxes')
      .select('allow_member_invites, allow_member_channels')
      .eq('id', box.id)
      .single();
    if (data) {
      setAllowMemberInvites(data.allow_member_invites ?? true);
      setAllowMemberChannels(data.allow_member_channels ?? true);
    }
  }

  useEffect(() => {
    if (box) checkSlackConnection();
  }, [box]);

  async function checkSlackConnection() {
    if (!box) return;
    setLoadingSlackStatus(true);
    try {
      const res = await fetch(`/api/import/slack?boxId=${box.id}`);
      const data = await res.json();
      if (data.connected && data.connection) {
        setSlackConnection(data.connection);
      }
    } catch { /* ignore */ }
    setLoadingSlackStatus(false);
  }

  async function loadSlackChannels() {
    if (!box) return;
    setLoadingSlackChannels(true);
    setSlackImportError('');
    try {
      const res = await fetch('/api/import/slack', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId: box.id }),
      });
      const data = await res.json();
      if (data.channels) {
        setSlackChannels(data.channels);
        setSelectedSlackChannels(new Set(data.channels.map((ch: { id: string }) => ch.id)));
      }
    } catch {
      setSlackImportError('Failed to load Slack channels.');
    }
    setLoadingSlackChannels(false);
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>You don&apos;t have permission to access workspace settings.</p>
          <Link href={`/w/${slug}/c/general`} className="btn btn-secondary btn-sm">Back to workspace</Link>
        </div>
      </div>
    );
  }

  function showMsg(section: string, msg: string) {
    setSectionMsg((prev) => ({ ...prev, [section]: msg }));
    setTimeout(() => setSectionMsg((prev) => ({ ...prev, [section]: '' })), 3000);
  }

  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    if (!box || !boxName.trim()) return;
    setSavingSection('general');
    const { error } = await supabase
      .from('boxes')
      .update({ name: boxName.trim(), description: boxDescription.trim() })
      .eq('id', box.id);
    setSavingSection(null);
    if (error) { showMsg('general', 'Failed to save'); return; }
    showMsg('general', 'Saved');
  }

  async function handleSavePermissions(e: React.FormEvent) {
    e.preventDefault();
    if (!box) return;
    setSavingSection('permissions');
    const { error } = await supabase
      .from('boxes')
      .update({ allow_member_invites: allowMemberInvites, allow_member_channels: allowMemberChannels })
      .eq('id', box.id);
    setSavingSection(null);
    if (error) { showMsg('permissions', 'Failed to save'); return; }
    showMsg('permissions', 'Saved');
  }

  async function copyInviteCode() {
    if (!box) return;
    await navigator.clipboard.writeText(box.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!box) return;
    setInviteError('');
    setInviteSuccess('');
    setInviting(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail.trim())
      .single();

    if (!profile) {
      setInviteError('No user found with that email.');
      setInviting(false);
      return;
    }

    const { data: existing } = await supabase
      .from('box_members')
      .select('id')
      .eq('box_id', box.id)
      .eq('user_id', profile.id)
      .single();

    if (existing) {
      setInviteError('This user is already a member.');
      setInviting(false);
      return;
    }

    const { error } = await supabase
      .from('box_members')
      .insert({ box_id: box.id, user_id: profile.id, role: 'member' });

    setInviting(false);
    if (error) { setInviteError('Failed to invite user.'); return; }
    setInviteSuccess(`Invited ${inviteEmail.trim()}!`);
    setInviteEmail('');
    await refreshMembers();
  }

  async function handleChangeRole(memberId: string, userId: string, newRole: string) {
    if (!box) return;
    setUpdatingMember(userId);
    await supabase
      .from('box_members')
      .update({ role: newRole })
      .eq('box_id', box.id)
      .eq('user_id', userId);
    await refreshMembers();
    setUpdatingMember(null);
  }

  async function handleRemoveMember(userId: string) {
    if (!box) return;
    if (!window.confirm('Remove this member from the workspace?')) return;
    setUpdatingMember(userId);
    await supabase
      .from('box_members')
      .delete()
      .eq('box_id', box.id)
      .eq('user_id', userId);
    await refreshMembers();
    setUpdatingMember(null);
  }

  async function handleRegenerateInviteCode() {
    if (!box) return;
    if (!window.confirm('Regenerate the invite code? The old code will stop working.')) return;
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    await supabase.from('boxes').update({ invite_code: newCode }).eq('id', box.id);
    showMsg('invites', 'Invite code regenerated');
    window.location.reload();
  }

  async function handleSlackImport() {
    if (!box) return;

    setImportingSlack(true);
    setSlackImportError('');
    setSlackImportResult(null);

    try {
      const res = await fetch('/api/import/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boxId: box.id,
          channelIds: Array.from(selectedSlackChannels),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSlackImportError(data.error || 'Import failed.');
        setImportingSlack(false);
        return;
      }

      setSlackImportResult(data.results);
    } catch {
      setSlackImportError('Import failed. Please try again.');
    }

    setImportingSlack(false);
  }

  async function handleDeleteWorkspace() {
    if (!box || !user) return;
    if (box.owner_id !== user.id) {
      alert('Only the workspace owner can delete the workspace.');
      return;
    }
    const confirmed = window.confirm(`Delete "${box.name}"? This action cannot be undone. All channels, messages, and data will be permanently removed.`);
    if (!confirmed) return;
    const doubleConfirm = window.confirm('Are you absolutely sure? This is irreversible.');
    if (!doubleConfirm) return;

    await supabase.from('box_members').delete().eq('box_id', box.id);
    await supabase.from('channels').delete().eq('box_id', box.id);
    await supabase.from('boxes').delete().eq('id', box.id);
    router.push('/dashboard');
  }

  function SaveBar({ section, saving }: { section: string; saving: boolean }) {
    const msg = sectionMsg[section];
    return (
      <div className={styles.saveBar}>
        {msg && <span className={msg === 'Saved' ? styles.saveSuccess : styles.saveError}>{msg}</span>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    );
  }

  const sections: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'General', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    { key: 'members', label: 'Members', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { key: 'invites', label: 'Invites', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> },
    { key: 'permissions', label: 'Permissions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { key: 'import', label: 'Import Data', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
    { key: 'danger', label: 'Danger Zone', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  ];

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href={`/w/${slug}/c/general`} className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to {box?.name || 'workspace'}
          </Link>
          <div className={styles.sidebarTitle}>Workspace Settings</div>
        </div>
        <nav className={styles.sidebarNav}>
          {sections.map((s) => (
            <button
              key={s.key}
              className={`${styles.sidebarItem} ${activeSection === s.key ? styles.sidebarItemActive : ''}`}
              onClick={() => setActiveSection(s.key)}
            >
              <span className={styles.sidebarItemIcon}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.contentInner}>
          {activeSection === 'general' && (
            <>
              <h2 className={styles.heading}>General</h2>
              <p className={styles.headingDesc}>Basic workspace information.</p>

              <div className={styles.card}>
                <form onSubmit={handleSaveGeneral}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="boxName">Workspace name</label>
                    <input id="boxName" type="text" className="input" value={boxName} onChange={(e) => setBoxName(e.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="boxDesc">Description</label>
                    <textarea id="boxDesc" className="input" value={boxDescription} onChange={(e) => setBoxDescription(e.target.value)} placeholder="What is this workspace for?" rows={3} maxLength={256} style={{ resize: 'vertical' }} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Slug</label>
                    <input type="text" className="input" value={slug} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Plan</label>
                    <input type="text" className="input" value={box?.plan === 'pro' ? 'Pro' : 'Free'} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <SaveBar section="general" saving={savingSection === 'general'} />
                </form>
              </div>
            </>
          )}

          {activeSection === 'members' && (
            <>
              <h2 className={styles.heading}>Members</h2>
              <p className={styles.headingDesc}>Manage who has access to this workspace.</p>

              <div className={styles.card}>
                {members.map((m) => {
                  const isCurrentUser = m.user_id === user?.id;
                  const isOwner = m.role === 'owner';
                  return (
                    <div key={m.user_id}>
                      <div className={styles.settingRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className={styles.avatar} style={{ width: 32, height: 32, fontSize: 13 }}>
                            {m.user?.display_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className={styles.settingLabel}>
                              {m.user?.display_name || m.user?.email}
                              {isCurrentUser && <span style={{ fontSize: 12, color: 'var(--color-muted)', marginLeft: 6 }}>(you)</span>}
                            </div>
                            <div className={styles.settingDesc}>{m.user?.email}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isOwner ? (
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-primary)', padding: '2px 8px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius)' }}>Owner</span>
                          ) : (
                            <>
                              <select
                                className="input"
                                style={{ width: 100, fontSize: 13, padding: '4px 8px' }}
                                value={m.role}
                                onChange={(e) => handleChangeRole(m.id, m.user_id, e.target.value)}
                                disabled={isCurrentUser || updatingMember === m.user_id}
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                              {!isCurrentUser && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: 12, color: 'var(--color-error)' }}
                                  onClick={() => handleRemoveMember(m.user_id)}
                                  disabled={updatingMember === m.user_id}
                                >
                                  Remove
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className={styles.divider} />
                    </div>
                  );
                })}
                <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </div>
              </div>
            </>
          )}

          {activeSection === 'invites' && (
            <>
              <h2 className={styles.heading}>Invites</h2>
              <p className={styles.headingDesc}>Invite new people to your workspace.</p>

              <div className={styles.card}>
                <div className={styles.settingRow}>
                  <div>
                    <div className={styles.settingLabel}>Invite code</div>
                    <div className={styles.settingDesc}>Share this code with people to let them join.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                  <code style={{ flex: 1, fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>{box?.invite_code}</code>
                  <button className="btn btn-secondary btn-sm" onClick={copyInviteCode}>
                    {codeCopied ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleRegenerateInviteCode}>
                    Regenerate
                  </button>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.settingLabel} style={{ marginBottom: 8 }}>Invite by email</div>
                <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    className="input"
                    style={{ flex: 1 }}
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={inviting}>
                    {inviting ? '...' : 'Invite'}
                  </button>
                </form>
                {inviteError && <p style={{ fontSize: 13, color: 'var(--color-error)', marginTop: 8 }}>{inviteError}</p>}
                {inviteSuccess && <p style={{ fontSize: 13, color: 'var(--color-success)', marginTop: 8 }}>{inviteSuccess}</p>}
              </div>
            </>
          )}

          {activeSection === 'permissions' && (
            <>
              <h2 className={styles.heading}>Permissions</h2>
              <p className={styles.headingDesc}>Control what members can do in this workspace.</p>

              <form onSubmit={handleSavePermissions}>
                <div className={styles.card}>
                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Allow members to invite</div>
                      <div className={styles.settingDesc}>Let non-admin members invite new people to the workspace.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${allowMemberInvites ? styles.toggleOn : ''}`} onClick={() => setAllowMemberInvites(!allowMemberInvites)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Allow members to create channels</div>
                      <div className={styles.settingDesc}>Let non-admin members create new channels.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${allowMemberChannels ? styles.toggleOn : ''}`} onClick={() => setAllowMemberChannels(!allowMemberChannels)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>
                </div>

                <SaveBar section="permissions" saving={savingSection === 'permissions'} />
              </form>
            </>
          )}

          {activeSection === 'import' && (
            <>
              <h2 className={styles.heading}>Import Data</h2>
              <p className={styles.headingDesc}>Import channels and messages from Slack via OAuth.</p>

              <div className={styles.card}>
                <div className={styles.settingRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <svg width="28" height="28" viewBox="0 0 127 127" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                      <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A"/>
                      <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0"/>
                      <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D"/>
                      <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E"/>
                    </svg>
                    <div>
                      <div className={styles.settingLabel}>Import from Slack</div>
                      <div className={styles.settingDesc}>
                        {slackConnection
                          ? `Connected to ${slackConnection.slack_team_name}`
                          : 'Connect your Slack workspace to import channels and messages.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  {loadingSlackStatus ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                      <span className="spinner spinner-sm" />
                      <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Checking connection...</span>
                    </div>
                  ) : slackConnection ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(0, 208, 132, 0.08)', border: '1px solid rgba(0, 208, 132, 0.2)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a8a5a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span style={{ fontSize: 13, color: '#0a8a5a' }}>
                          Connected to <strong>{slackConnection.slack_team_name}</strong>
                        </span>
                      </div>

                      {slackChannels.length === 0 && !loadingSlackChannels && (
                        <button className="btn btn-primary btn-sm" onClick={loadSlackChannels}>
                          Load Slack channels
                        </button>
                      )}

                      {loadingSlackChannels && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                          <span className="spinner spinner-sm" />
                          <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Loading channels from Slack...</span>
                        </div>
                      )}

                      {slackChannels.length > 0 && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-heading)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={selectedSlackChannels.size === slackChannels.length}
                                onChange={() => {
                                  if (selectedSlackChannels.size === slackChannels.length) {
                                    setSelectedSlackChannels(new Set());
                                  } else {
                                    setSelectedSlackChannels(new Set(slackChannels.map(ch => ch.id)));
                                  }
                                }}
                                style={{ accentColor: 'var(--color-primary)' }}
                              />
                              Select all ({slackChannels.length})
                            </label>
                          </div>
                          <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
                            {slackChannels.map(ch => (
                              <label key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedSlackChannels.has(ch.id)}
                                  onChange={() => {
                                    setSelectedSlackChannels(prev => {
                                      const next = new Set(prev);
                                      if (next.has(ch.id)) next.delete(ch.id);
                                      else next.add(ch.id);
                                      return next;
                                    });
                                  }}
                                  style={{ accentColor: 'var(--color-primary)' }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-heading)' }}># {ch.name}</div>
                                  {ch.purpose && <div style={{ fontSize: 12, color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.purpose}</div>}
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{ch.num_members}</span>
                              </label>
                            ))}
                          </div>

                          <button
                            className="btn btn-primary btn-sm"
                            style={{ marginTop: 12 }}
                            onClick={handleSlackImport}
                            disabled={importingSlack || selectedSlackChannels.size === 0}
                          >
                            {importingSlack ? (
                              <><span className="spinner spinner-sm" /> Importing...</>
                            ) : (
                              `Import ${selectedSlackChannels.size} channel${selectedSlackChannels.size !== 1 ? 's' : ''}`
                            )}
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <a
                      href={`/api/import/slack/oauth?boxId=${box?.id}&returnTo=/w/${slug}/settings`}
                      className="btn btn-primary btn-sm"
                    >
                      Connect to Slack
                    </a>
                  )}

                  {slackImportError && (
                    <p style={{ fontSize: 13, color: 'var(--color-error)', marginTop: 8 }}>{slackImportError}</p>
                  )}

                  {slackImportResult && (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(0, 208, 132, 0.08)', border: '1px solid rgba(0, 208, 132, 0.2)', borderRadius: 'var(--radius)', fontSize: 13, color: '#0a8a5a' }}>
                      Import complete: {slackImportResult.channelsCreated} channels created, {slackImportResult.messagesImported} messages imported.
                      {slackImportResult.channelsSkipped > 0 && ` ${slackImportResult.channelsSkipped} skipped.`}
                      {slackImportResult.errors.length > 0 && (
                        <div style={{ marginTop: 6, color: 'var(--color-error)' }}>
                          {slackImportResult.errors.slice(0, 3).map((err, i) => (
                            <div key={i}>{err}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeSection === 'danger' && (
            <>
              <h2 className={styles.heading}>Danger Zone</h2>
              <p className={styles.headingDesc}>Irreversible actions. Proceed with caution.</p>

              <div className={styles.card} style={{ borderColor: 'var(--color-error)' }}>
                <div className={styles.settingRow}>
                  <div>
                    <div className={styles.settingLabel}>Delete workspace</div>
                    <div className={styles.settingDesc}>Permanently delete this workspace and all of its data. This cannot be undone.</div>
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--color-error)', color: '#fff', border: 'none' }}
                    onClick={handleDeleteWorkspace}
                  >
                    Delete workspace
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
