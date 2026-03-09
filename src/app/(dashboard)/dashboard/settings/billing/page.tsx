'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../settings.module.css';

interface BoxWithMembership {
  box_id: string;
  role: string;
  box: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

export default function BillingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState<BoxWithMembership[]>([]);
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setEmail(user.email || '');

    const { data: memberships } = await supabase
      .from('box_members')
      .select('box_id, role, box:boxes(id, name, slug, plan)')
      .eq('user_id', user.id);

    if (memberships) {
      setBoxes(memberships as unknown as BoxWithMembership[]);
    }
    setLoading(false);
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

  const ownedBoxes = boxes.filter((b) => b.role === 'owner');

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
          <Link href="/dashboard/settings" className={styles.sidebarItem}>
            <span className={styles.sidebarItemIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            Profile
          </Link>
          <Link href="/dashboard/settings" className={styles.sidebarItem}>
            <span className={styles.sidebarItemIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </span>
            Appearance
          </Link>
          <Link href="/dashboard/settings" className={styles.sidebarItem}>
            <span className={styles.sidebarItemIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </span>
            Notifications
          </Link>
          <div className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>
            <span className={styles.sidebarItemIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </span>
            Billing
          </div>
        </nav>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.contentInner}>
          <h2 className={styles.heading}>Billing</h2>
          <p className={styles.headingDesc}>Manage subscriptions for your workspaces.</p>

          <div className={styles.card}>
            <div className={styles.settingRow}>
              <div>
                <div className={styles.settingLabel}>Account email</div>
                <div className={styles.settingDesc}>{email}</div>
              </div>
            </div>
          </div>

          {ownedBoxes.length > 0 ? (
            <>
              <h3 className={styles.heading} style={{ fontSize: 16, marginTop: 24 }}>Your workspaces</h3>
              {ownedBoxes.map((b) => (
                <div key={b.box_id} className={styles.card} style={{ marginBottom: 12 }}>
                  <div className={styles.settingRow}>
                    <div>
                      <div className={styles.settingLabel}>{b.box?.name}</div>
                      <div className={styles.settingDesc}>
                        Current plan: {b.box?.plan === 'pro' ? 'Pro' : 'Free'}
                      </div>
                    </div>
                    {b.box?.plan !== 'pro' ? (
                      <button className="btn btn-primary btn-sm">
                        Upgrade to Pro
                      </button>
                    ) : (
                      <span style={{ fontSize: 13, color: 'var(--color-success)', fontWeight: 500 }}>Active</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className={styles.card} style={{ textAlign: 'center', padding: 32 }}>
              <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>
                You don&apos;t own any workspaces yet. Billing is managed per workspace by owners.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
