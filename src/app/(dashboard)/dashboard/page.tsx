'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/theme-context';
import styles from './dashboard.module.css';

interface BoxWithMembership {
  box_id: string;
  role: string;
  box: {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
    plan: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState<BoxWithMembership[]>([]);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUserEmail(user.email || '');

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserName(profile.display_name);
    }

    const { data: memberships } = await supabase
      .from('box_members')
      .select('box_id, role, box:boxes(id, name, slug, icon_url, plan)')
      .eq('user_id', user.id);

    if (memberships) {
      setBoxes(memberships as unknown as BoxWithMembership[]);
    }

    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }


  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>Chatterbox</div>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.themeBtn} onClick={toggleTheme} title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>
            <Link href="/dashboard/settings" className={styles.headerAvatar} title="Settings">
              {userName?.charAt(0)?.toUpperCase() || '?'}
            </Link>
          </div>
        </div>

        {/* Greeting */}
        <div className={styles.greetingSection}>
          <h1 className={styles.greeting}>
            {getGreeting()}, {userName || 'there'}
          </h1>
          <p className={styles.greetingSub}>{userEmail}</p>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <Link href="/create/box" className={styles.quickAction}>
            <div className={styles.quickActionIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <div>
              <div className={styles.quickActionTitle}>Create a Box</div>
              <div className={styles.quickActionDesc}>Start a new workspace</div>
            </div>
          </Link>
          <Link href="/join/call" className={styles.quickAction}>
            <div className={styles.quickActionIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <div>
              <div className={styles.quickActionTitle}>Join a Call</div>
              <div className={styles.quickActionDesc}>Enter a call code</div>
            </div>
          </Link>
          <Link href="/dashboard/settings" className={styles.quickAction}>
            <div className={styles.quickActionIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <div>
              <div className={styles.quickActionTitle}>Settings</div>
              <div className={styles.quickActionDesc}>Account & preferences</div>
            </div>
          </Link>
        </div>

        {/* Your Boxes */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Boxes</h2>
            <Link href="/create/box" className="btn btn-primary btn-sm">
              + New Box
            </Link>
          </div>

          {boxes.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <p className={styles.emptyTitle}>No Boxes yet</p>
              <p className={styles.emptyDesc}>Create a new Box or join one with an invite code.</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
                <Link href="/create/box" className="btn btn-primary">
                  Create a Box
                </Link>
                <Link href="/onboarding/join" className="btn btn-secondary">
                  Join with code
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.boxGrid}>
              {boxes.map((membership) => (
                <Link
                  key={membership.box_id}
                  href={`/w/${membership.box?.slug}`}
                  className={styles.boxCard}
                >
                  <div className={styles.boxIcon}>
                    {membership.box?.name?.charAt(0)?.toUpperCase() || 'B'}
                  </div>
                  <div className={styles.boxInfo}>
                    <div className={styles.boxName}>{membership.box?.name}</div>
                    <div className={styles.boxMeta}>
                      {membership.role === 'owner' ? 'Owner' : membership.role === 'admin' ? 'Admin' : 'Member'}
                      {' '}&middot;{' '}
                      {membership.box?.plan === 'pro' ? 'Pro' : 'Free'}
                    </div>
                  </div>
                  <span className={styles.boxArrow}>&rarr;</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.dashFooter}>
          <div className={styles.footerNav}>
            <Link href="/dashboard/settings" className={styles.footerLink}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Profile
            </Link>
            <Link href="/dashboard/settings/billing" className={styles.footerLink}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Billing
            </Link>
            <button className={styles.footerLink} onClick={handleSignOut}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log out
            </button>
          </div>
          <div className={styles.footerCopy}>&copy; {new Date().getFullYear()} Chatterbox</div>
        </div>
      </div>
    </div>
  );
}
