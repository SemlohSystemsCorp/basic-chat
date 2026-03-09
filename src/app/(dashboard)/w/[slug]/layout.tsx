'use client';

import { useParams } from 'next/navigation';
import { WorkspaceProvider } from './workspace-context';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <WorkspaceProvider slug={slug}>
      {children}
    </WorkspaceProvider>
  );
}
