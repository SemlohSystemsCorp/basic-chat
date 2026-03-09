import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Chatterbox',
    default: 'Chatterbox',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
