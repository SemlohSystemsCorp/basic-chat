'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWorkspace } from './workspace-context';

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { loading, channels } = useWorkspace();

  useEffect(() => {
    if (loading) return;
    if (channels.length > 0) {
      router.replace(`/w/${slug}/c/${channels[0].slug}`);
    }
  }, [loading, channels, slug, router]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      {!loading && channels.length === 0 ? (
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>No channels found</p>
      ) : (
        <div className="spinner" />
      )}
    </div>
  );
}
