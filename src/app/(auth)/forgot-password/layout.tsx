import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your Chatterbox password. Enter your email to receive a password reset link.',
  openGraph: {
    title: 'Reset Your Chatterbox Password',
    description: 'Forgot your password? Enter your email to receive a reset link.',
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
