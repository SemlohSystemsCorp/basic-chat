import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Sign in to your Chatterbox account. Access your workspaces, channels, and conversations.',
  openGraph: {
    title: 'Log In to Chatterbox',
    description: 'Sign in to your Chatterbox account. Access your workspaces, channels, and conversations.',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
