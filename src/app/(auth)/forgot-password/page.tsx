'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
            <h1 className="auth-title" style={{ textAlign: 'center' }}>Check your email</h1>
            <p className="auth-subtitle" style={{ textAlign: 'center' }}>
              We sent a password reset link to <strong style={{ color: 'var(--color-heading)' }}>{email}</strong>.
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Click the link in your email to reset your password. If you don&apos;t see it, check your spam folder.
            </p>
          </div>

          <p className="auth-footer">
            <Link href="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo" style={{ textAlign: 'center' }}>Chatterbox</div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>Reset your password</h1>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" /> Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>
        </div>

        <p className="auth-footer">
          Remember your password? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
