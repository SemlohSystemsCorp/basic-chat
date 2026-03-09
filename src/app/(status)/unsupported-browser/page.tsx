import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browser Not Supported | Chatterbox',
  description: 'Your browser is not supported by Chatterbox. Please upgrade to a modern browser.',
};

export default function UnsupportedBrowserPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: 32,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
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
          Browser not supported
        </h1>
        <p style={{
          fontSize: 15,
          color: 'var(--color-muted)',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          Chatterbox requires a modern browser to work properly. Please update to the latest version of Chrome, Firefox, Safari, or Edge.
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'none' }}>
            Chrome
          </a>
          <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'none' }}>
            Firefox
          </a>
          <a href="https://www.apple.com/safari/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'none' }}>
            Safari
          </a>
          <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'none' }}>
            Edge
          </a>
        </div>
      </div>
    </div>
  );
}
