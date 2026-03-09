import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Service Unavailable | Chatterbox',
  description: 'Chatterbox is not available in your region.',
};

export default function UnavailablePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: 32,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--color-heading)',
          marginBottom: 8,
        }}>
          Not available in your country
        </h1>
        <p style={{
          fontSize: 15,
          color: 'var(--color-muted)',
          lineHeight: 1.6,
          marginBottom: 12,
        }}>
          Chatterbox is not currently available in your region. We&apos;re working on expanding to more countries.
        </p>
        <p style={{
          fontSize: 14,
          color: 'var(--color-muted)',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          For updates on availability, contact us at <a href="mailto:support@chatterbox.app" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>support@chatterbox.app</a>.
        </p>
      </div>
    </div>
  );
}
