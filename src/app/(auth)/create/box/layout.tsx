import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Workspace',
  description: 'Create a new Chatterbox workspace for your team, company, or community.',
};

export default function CreateBoxLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
