'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CallData {
  id: string;
  call_code: string;
  room_url: string;
  title: string | null;
  status: string;
  started_at: string;
  channel_id: string | null;
}

interface Participant {
  user_id: string;
  joined_at: string;
  user: { display_name: string; avatar_url: string | null };
}

export default function JoinCallPage() {
  const router = useRouter();
  const [callCode, setCallCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [call, setCall] = useState<CallData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [boxSlug, setBoxSlug] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!callCode.trim()) return;

    setLoading(true);
    setError('');

    const res = await fetch('/api/calls/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callCode: callCode.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Failed to join call');
      return;
    }

    setCall(data.call);
    setParticipants(data.participants);
    setBoxSlug(data.boxSlug);
    setJoined(true);
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function formatDuration(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just started';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }

  function copyCode() {
    if (!call) return;
    navigator.clipboard.writeText(call.call_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {!joined ? (
            <>
              <div className="auth-logo">Chatterbox</div>
              <h1 className="auth-title">Join a call</h1>
              <p className="auth-subtitle">Enter a call code to join a video call.</p>

              <form onSubmit={handleJoin}>
                <div className="field">
                  <label className="label" htmlFor="callCode">Call code</label>
                  <input
                    id="callCode"
                    type="text"
                    className="input"
                    placeholder="e.g. a1b2c3d4"
                    value={callCode}
                    onChange={(e) => setCallCode(e.target.value)}
                    required
                    autoFocus
                    autoComplete="off"
                    style={{ letterSpacing: '1px', fontFamily: "'SF Mono', 'Fira Code', monospace" }}
                  />
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading || !callCode.trim()}
                >
                  {loading ? 'Joining...' : 'Join call'}
                </button>
              </form>

              <div className="auth-divider">or</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/dashboard" className="btn btn-secondary btn-full">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  Go to dashboard
                </Link>
                <Link href="/login" className="btn btn-ghost btn-full" style={{ fontSize: 13 }}>
                  Sign in to another account
                </Link>
              </div>
            </>
          ) : call ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <h1 className="auth-title" style={{ marginBottom: 0 }}>
                  {call.title || 'Video Call'}
                </h1>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  Started {formatTime(call.started_at)} · {formatDuration(call.started_at)}
                </span>
                <button
                  onClick={copyCode}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'var(--color-primary-light)',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    letterSpacing: '1px',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    fontSize: 12,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {call.call_code}
                  {codeCopied ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  )}
                </button>
              </div>

              {participants.length > 0 && (
                <div style={{ marginBottom: 16, padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-muted)', marginBottom: 8 }}>
                    In this call ({participants.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {participants.map((p) => (
                      <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm">
                          {p.user?.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-heading)' }}>
                            {p.user?.display_name}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--color-muted)', marginLeft: 6 }}>
                            joined {formatTime(p.joined_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {call.room_url && (
                  <a
                    href={call.room_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-full"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    Open video call
                  </a>
                )}

                {boxSlug && (
                  <button
                    className="btn btn-secondary btn-full"
                    onClick={() => router.push(`/w/${boxSlug}`)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Open in workspace
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>
                  Dashboard
                </Link>
                <span style={{ color: 'var(--color-border)' }}>·</span>
                <Link href="/join/call" onClick={() => { setJoined(false); setCall(null); setCallCode(''); }} style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>
                  Join another call
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
