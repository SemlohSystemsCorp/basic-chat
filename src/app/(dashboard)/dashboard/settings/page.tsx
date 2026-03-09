'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/theme-context';
import styles from './settings.module.css';

type Section = 'profile' | 'appearance' | 'notifications' | 'messages' | 'privacy' | 'password' | 'account';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Amsterdam', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
  'Australia/Sydney', 'Pacific/Auckland',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ko', label: 'Korean' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [userId, setUserId] = useState('');

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [muteAll, setMuteAll] = useState(false);

  // Messages
  const [compactMode, setCompactMode] = useState(false);
  const [sendOnEnter, setSendOnEnter] = useState(true);
  const [showLinkPreviews, setShowLinkPreviews] = useState(true);
  const [convertEmoticons, setConvertEmoticons] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);

  // Privacy
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  // Generic save state per section
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [sectionMsg, setSectionMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);
    setEmail(user.email || '');

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, status, bio, timezone, language, message_preview, show_online_status, email_notifications, desktop_notifications, notification_sound, compact_mode, send_on_enter, show_link_previews, convert_emoticons, mute_all')
      .eq('id', user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name);
      setStatus(profile.status || '');
      setBio(profile.bio || '');
      setTimezone(profile.timezone || 'UTC');
      setLanguage(profile.language || 'en');
      setMessagePreview(profile.message_preview ?? true);
      setShowOnlineStatus(profile.show_online_status ?? true);
      setEmailNotifications(profile.email_notifications ?? true);
      setDesktopNotifications(profile.desktop_notifications ?? true);
      setNotificationSound(profile.notification_sound ?? true);
      setCompactMode(profile.compact_mode ?? false);
      setSendOnEnter(profile.send_on_enter ?? true);
      setShowLinkPreviews(profile.show_link_previews ?? true);
      setConvertEmoticons(profile.convert_emoticons ?? true);
      setMuteAll(profile.mute_all ?? false);
    }

    setLoading(false);
  }

  function showMsg(section: string, msg: string) {
    setSectionMsg((prev) => ({ ...prev, [section]: msg }));
    setTimeout(() => setSectionMsg((prev) => ({ ...prev, [section]: '' })), 3000);
  }

  async function saveSection(section: string, data: Record<string, unknown>) {
    setSavingSection(section);
    const { error } = await supabase.from('profiles').update(data).eq('id', userId);
    setSavingSection(null);
    if (error) { showMsg(section, 'Failed to save'); return; }
    showMsg(section, 'Saved');
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    await saveSection('profile', { display_name: displayName.trim(), status, bio, timezone, language });
  }

  async function handleSaveNotifications(e: React.FormEvent) {
    e.preventDefault();
    await saveSection('notifications', { email_notifications: emailNotifications, desktop_notifications: desktopNotifications, notification_sound: notificationSound, mute_all: muteAll });
  }

  async function handleSaveMessages(e: React.FormEvent) {
    e.preventDefault();
    await saveSection('messages', { send_on_enter: sendOnEnter, message_preview: messagePreview, show_link_previews: showLinkPreviews, convert_emoticons: convertEmoticons, compact_mode: compactMode });
  }

  async function handleSavePrivacy(e: React.FormEvent) {
    e.preventDefault();
    await saveSection('privacy', { show_online_status: showOnlineStatus });
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword.length < 6) { setPasswordMsg('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg('Passwords do not match'); return; }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) { setPasswordMsg(error.message); return; }
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg('Password updated');
    setTimeout(() => setPasswordMsg(''), 3000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const sections: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { key: 'appearance', label: 'Appearance', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> },
    { key: 'notifications', label: 'Notifications', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
    { key: 'messages', label: 'Messages & Media', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { key: 'privacy', label: 'Privacy', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
    { key: 'password', label: 'Password', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { key: 'account', label: 'Account', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ];

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

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </Link>
          <div className={styles.sidebarTitle}>Settings</div>
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
          {activeSection === 'profile' && (
            <>
              <h2 className={styles.heading}>Profile</h2>
              <p className={styles.headingDesc}>Manage how you appear to others in Chatterbox.</p>

              <div className={styles.card}>
                <div className={styles.profileHeader}>
                  <div className={styles.avatar}>
                    {displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className={styles.profileName}>{displayName || 'No name'}</div>
                    <div className={styles.profileEmail}>{email}</div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="displayName">Display name</label>
                      <input id="displayName" type="text" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Email</label>
                      <input type="email" className="input" value={email} disabled style={{ opacity: 0.6 }} />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="status">Status</label>
                    <input id="status" type="text" className="input" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="What are you up to?" maxLength={80} />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="bio">Bio</label>
                    <textarea id="bio" className="input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself" rows={3} maxLength={256} style={{ resize: 'vertical' }} />
                  </div>

                  <div className={styles.fieldGroup}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="timezone">Timezone</label>
                      <select id="timezone" className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                        {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="language">Language</label>
                      <select id="language" className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <SaveBar section="profile" saving={savingSection === 'profile'} />
                </form>
              </div>
            </>
          )}

          {activeSection === 'appearance' && (
            <>
              <h2 className={styles.heading}>Appearance</h2>
              <p className={styles.headingDesc}>Customize how Chatterbox looks on your device.</p>

              <form onSubmit={(e) => { e.preventDefault(); saveSection('appearance', { compact_mode: compactMode }); }}>
                <div className={styles.card}>
                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Theme</div>
                      <div className={styles.settingDesc}>Switch between light and dark mode.</div>
                    </div>
                    <div className={styles.themeToggle}>
                      <button type="button" className={`${styles.themeOption} ${theme === 'light' ? styles.themeOptionActive : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                        Light
                      </button>
                      <button type="button" className={`${styles.themeOption} ${theme === 'dark' ? styles.themeOptionActive : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        Dark
                      </button>
                    </div>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Compact mode</div>
                      <div className={styles.settingDesc}>Reduce spacing between messages to fit more on screen.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${compactMode ? styles.toggleOn : ''}`} onClick={() => setCompactMode(!compactMode)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>
                </div>

                <SaveBar section="appearance" saving={savingSection === 'appearance'} />
              </form>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <h2 className={styles.heading}>Notifications</h2>
              <p className={styles.headingDesc}>Control how and when you get notified.</p>

              <form onSubmit={handleSaveNotifications}>
                <div className={styles.card}>
                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Mute all notifications</div>
                      <div className={styles.settingDesc}>Temporarily stop all notifications.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${muteAll ? styles.toggleOn : ''}`} onClick={() => setMuteAll(!muteAll)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Email notifications</div>
                      <div className={styles.settingDesc}>Receive mentions and direct messages via email.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${emailNotifications ? styles.toggleOn : ''}`} onClick={() => setEmailNotifications(!emailNotifications)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Desktop notifications</div>
                      <div className={styles.settingDesc}>Show browser push notifications for new messages.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${desktopNotifications ? styles.toggleOn : ''}`} onClick={() => setDesktopNotifications(!desktopNotifications)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Notification sound</div>
                      <div className={styles.settingDesc}>Play a sound when you receive a notification.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${notificationSound ? styles.toggleOn : ''}`} onClick={() => setNotificationSound(!notificationSound)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>
                </div>

                <SaveBar section="notifications" saving={savingSection === 'notifications'} />
              </form>
            </>
          )}

          {activeSection === 'messages' && (
            <>
              <h2 className={styles.heading}>Messages & Media</h2>
              <p className={styles.headingDesc}>Customize your messaging experience.</p>

              <form onSubmit={handleSaveMessages}>
                <div className={styles.card}>
                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Send on Enter</div>
                      <div className={styles.settingDesc}>Press Enter to send messages. When off, use Ctrl+Enter instead.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${sendOnEnter ? styles.toggleOn : ''}`} onClick={() => setSendOnEnter(!sendOnEnter)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Message preview</div>
                      <div className={styles.settingDesc}>Show message content in notifications.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${messagePreview ? styles.toggleOn : ''}`} onClick={() => setMessagePreview(!messagePreview)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Show link previews</div>
                      <div className={styles.settingDesc}>Automatically expand URLs into rich previews.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${showLinkPreviews ? styles.toggleOn : ''}`} onClick={() => setShowLinkPreviews(!showLinkPreviews)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Convert emoticons</div>
                      <div className={styles.settingDesc}>Automatically convert text like :) to emoji.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${convertEmoticons ? styles.toggleOn : ''}`} onClick={() => setConvertEmoticons(!convertEmoticons)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>
                </div>

                <SaveBar section="messages" saving={savingSection === 'messages'} />
              </form>
            </>
          )}

          {activeSection === 'privacy' && (
            <>
              <h2 className={styles.heading}>Privacy</h2>
              <p className={styles.headingDesc}>Control your visibility and data sharing.</p>

              <form onSubmit={handleSavePrivacy}>
                <div className={styles.card}>
                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>Show online status</div>
                      <div className={styles.settingDesc}>Let others see when you are online.</div>
                    </div>
                    <button type="button" className={`${styles.toggle} ${showOnlineStatus ? styles.toggleOn : ''}`} onClick={() => setShowOnlineStatus(!showOnlineStatus)}>
                      <span className={styles.toggleDot} />
                    </button>
                  </div>
                </div>

                <SaveBar section="privacy" saving={savingSection === 'privacy'} />
              </form>
            </>
          )}

          {activeSection === 'password' && (
            <>
              <h2 className={styles.heading}>Password</h2>
              <p className={styles.headingDesc}>Update your password to keep your account secure.</p>

              <div className={styles.card}>
                <form onSubmit={handleChangePassword}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="newPassword">New password</label>
                    <input id="newPassword" type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="confirmPassword">Confirm password</label>
                    <input id="confirmPassword" type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your new password" required />
                  </div>
                  {passwordMsg && <div className={`alert ${passwordMsg.includes('updated') ? 'alert-success' : 'alert-error'}`}>{passwordMsg}</div>}
                  <div className={styles.saveBar}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={passwordSaving || !newPassword || !confirmPassword}>
                      {passwordSaving ? 'Updating...' : 'Update password'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {activeSection === 'account' && (
            <>
              <h2 className={styles.heading}>Account</h2>
              <p className={styles.headingDesc}>Manage your account and session.</p>

              <div className={styles.card}>
                <div className={styles.settingRow}>
                  <div>
                    <div className={styles.settingLabel}>Sign out</div>
                    <div className={styles.settingDesc}>Sign out of your account on this device.</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleSignOut}>
                    Sign out
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
