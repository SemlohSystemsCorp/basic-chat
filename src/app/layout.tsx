import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chatterbox — Communication for everything important',
  description:
    'The ultimate communication platform that blends the best of Slack and Discord. Chatrooms, real-time messaging, and powerful collaboration tools.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
