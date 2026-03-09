import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user signed in via OAuth (Slack, Google, etc.)
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.app_metadata?.provider && user.app_metadata.provider !== 'email') {
        // Check if profile is already set up (has display_name)
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        // If display_name is just the email prefix or empty, send to OAuth onboarding
        const emailPrefix = user.email?.split('@')[0] || '';
        const needsOnboarding = !profile?.display_name || profile.display_name === emailPrefix;

        if (needsOnboarding) {
          return NextResponse.redirect(`${origin}/onboarding/oauth/${user.app_metadata.provider}`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
