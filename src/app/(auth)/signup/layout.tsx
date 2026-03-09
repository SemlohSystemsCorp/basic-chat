import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free Chatterbox account. Start collaborating with your team in seconds with real-time messaging, channels, and workspaces.',
  openGraph: {
    title: 'Sign Up for Chatterbox — Free',
    description: 'Create your free Chatterbox account. Start collaborating with your team in seconds.',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
