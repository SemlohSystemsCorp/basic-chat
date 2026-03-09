'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          background: 'var(--color-error, #E56B6B)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--color-heading)',
          marginBottom: 8,
        }}>
          Something went wrong
        </h1>
        <p style={{
          fontSize: 15,
          color: 'var(--color-muted)',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <a href="/" className="btn btn-secondary">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
