import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { exchangeSlackCode, fetchSlackTeam } from '@/lib/slack';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const stateParam = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    // User denied access
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL('/onboarding?error=slack_missing_code', request.url));
  }

  // Decode state
  let state: { userId: string; boxId: string; returnTo: string };
  try {
    state = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
  } catch {
    return NextResponse.redirect(new URL('/onboarding?error=slack_invalid_state', request.url));
  }

  // Verify the user is still logged in
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user || user.id !== state.userId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Exchange code for token
  const tokenData = await exchangeSlackCode(code);

  if (!tokenData.ok || !tokenData.access_token) {
    const returnUrl = new URL(state.returnTo, request.url);
    returnUrl.searchParams.set('slack_error', tokenData.error || 'oauth_failed');
    return NextResponse.redirect(returnUrl);
  }

  // Get Slack team info
  const team = await fetchSlackTeam(tokenData.access_token);

  // Store token in the database
  const supabase = await createServiceClient();

  await supabase.from('slack_connections').upsert({
    box_id: state.boxId,
    slack_team_id: tokenData.team?.id || team?.id || '',
    slack_team_name: tokenData.team?.name || team?.name || '',
    access_token: tokenData.access_token,
    connected_by: user.id,
    connected_at: new Date().toISOString(),
  }, {
    onConflict: 'box_id',
  });

  // Redirect back with success
  const returnUrl = new URL(state.returnTo, request.url);
  returnUrl.searchParams.set('slack_connected', '1');
  returnUrl.searchParams.set('slack_team', tokenData.team?.name || team?.name || 'Slack');
  return NextResponse.redirect(returnUrl);
}
