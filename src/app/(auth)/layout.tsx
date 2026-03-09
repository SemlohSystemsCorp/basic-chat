import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Chatterbox',
    default: 'Chatterbox — Communication for everything important',
  },
  description: 'The communication platform that blends the best of Slack and Discord. Real-time channels, organized threads, and seamless collaboration.',
  keywords: ['team chat', 'communication platform', 'messaging', 'collaboration', 'channels', 'workspaces', 'slack alternative', 'discord alternative'],
  openGraph: {
    type: 'website',
    siteName: 'Chatterbox',
    title: 'Chatterbox — Communication for everything important',
    description: 'Real-time channels, organized threads, and seamless collaboration for teams that move fast.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chatterbox — Communication for everything important',
    description: 'Real-time channels, organized threads, and seamless collaboration for teams that move fast.',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
