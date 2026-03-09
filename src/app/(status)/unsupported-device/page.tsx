import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Device Not Supported | Chatterbox',
  description: 'Chatterbox is not available on this device. Please use a desktop or laptop computer.',
};

export default function UnsupportedDevicePage() {
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
        </div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--color-heading)',
          marginBottom: 8,
        }}>
          Device not supported
        </h1>
        <p style={{
          fontSize: 15,
          color: 'var(--color-muted)',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          Chatterbox is currently optimized for desktop and laptop computers. Mobile apps are coming soon. Please switch to a desktop device for the best experience.
        </p>
        <a href="/" className="btn btn-primary">
          Go home
        </a>
      </div>
    </div>
  );
}
