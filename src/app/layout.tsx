import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme-context';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    template: '%s | Chatterbox',
    default: 'Chatterbox — Communication for everything important',
  },
  description:
    'The communication platform that blends the best of Slack and Discord. Real-time channels, organized threads, and seamless collaboration for teams that move fast.',
  keywords: [
    'chatterbox', 'team chat', 'communication platform', 'real-time messaging',
    'collaboration', 'channels', 'workspaces', 'slack alternative', 'discord alternative',
    'team communication', 'business messaging', 'group chat', 'direct messages',
  ],
  authors: [{ name: 'Chatterbox' }],
  creator: 'Chatterbox',
  publisher: 'Chatterbox',
  metadataBase: new URL('https://chatterbox.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Chatterbox',
    title: 'Chatterbox — Communication for everything important',
    description: 'Real-time channels, organized threads, and seamless collaboration for teams that move fast. Free to start.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chatterbox — Communication for everything important',
    description: 'Real-time channels, organized threads, and seamless collaboration for teams that move fast.',
    creator: '@chatterbox',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
