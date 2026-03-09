import { readFileSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Chatterbox Privacy Policy — Learn how we collect, use, and protect your personal information on the Chatterbox platform.',
  openGraph: {
    title: 'Privacy Policy | Chatterbox',
    description: 'Learn how Chatterbox handles your data and protects your privacy.',
  },
};

function parseContent(text: string) {
  const lines = text.split('\n').filter(Boolean);
  const title = lines[0];
  const lastUpdated = lines[1];
  const body = lines.slice(2);

  const sections: { heading: string; paragraphs: string[] }[] = [];
  let current: { heading: string; paragraphs: string[] } | null = null;

  for (const line of body) {
    if (/^\d+\.\s/.test(line)) {
      if (current) sections.push(current);
      current = { heading: line, paragraphs: [] };
    } else if (current) {
      current.paragraphs.push(line);
    }
  }
  if (current) sections.push(current);

  return { title, lastUpdated, sections };
}

export default function PrivacyPage() {
  const raw = readFileSync(join(process.cwd(), 'public', 'privacy.txt'), 'utf-8');
  const { title, lastUpdated, sections } = parseContent(raw);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-muted)', textDecoration: 'none', marginBottom: 32 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Chatterbox
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-heading)', marginBottom: 4 }}>{title}</h1>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 40 }}>{lastUpdated}</p>

        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-heading)', marginBottom: 10 }}>{section.heading}</h2>
            {section.paragraphs.map((p, j) => (
              <p key={j} style={{ fontSize: 15, color: 'var(--color-body)', lineHeight: 1.7, marginBottom: 10 }}>{p}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
