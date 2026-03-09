import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Access Denied | Chatterbox',
  description: 'Your IP address has been blocked from accessing Chatterbox.',
};

export default function IpBannedPage() {
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
          background: 'rgba(229, 107, 107, 0.1)',
          color: 'var(--color-error, #E56B6B)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="4.5" y1="4.5" x2="19.5" y2="19.5"/></svg>
        </div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--color-heading)',
          marginBottom: 8,
        }}>
          Access denied
        </h1>
        <p style={{
          fontSize: 15,
          color: 'var(--color-muted)',
          lineHeight: 1.6,
          marginBottom: 12,
        }}>
          Your IP address has been blocked from accessing Chatterbox due to suspicious activity or a terms of service violation.
        </p>
        <p style={{
          fontSize: 14,
          color: 'var(--color-muted)',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          If you believe this is a mistake, please contact support at <a href="mailto:support@chatterbox.app" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>support@chatterbox.app</a>.
        </p>
      </div>
    </div>
  );
}
