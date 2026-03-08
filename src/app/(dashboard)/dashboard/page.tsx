'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
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
  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState<BoxWithMembership[]>([]);
  const [userName, setUserName] = useState('');

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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserName(profile.display_name);
    }

    // Get all boxes user is a member of
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
        <div className={styles.header}>
          <div>
            <div className={styles.logo}>Chatterbox</div>
            <h1 className={styles.greeting}>
              {userName ? `Welcome back, ${userName}` : 'Welcome back'}
            </h1>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
            Sign out
          </button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Boxes</h2>
            <Link href="/create/box" className="btn btn-primary btn-sm">
              + New Box
            </Link>
          </div>

          {boxes.length === 0 ? (
            <div className={styles.emptyState}>
              <p>You&apos;re not a member of any Boxes yet.</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
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
      </div>
    </div>
  );
}
