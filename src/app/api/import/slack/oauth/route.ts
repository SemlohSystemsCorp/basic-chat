import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSlackOAuthURL } from '@/lib/slack';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const boxId = request.nextUrl.searchParams.get('boxId');
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/dashboard';

  if (!boxId) {
    return NextResponse.json({ error: 'Missing boxId' }, { status: 400 });
  }

  // Encode state: userId|boxId|returnTo
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    boxId,
    returnTo,
  })).toString('base64url');

  const oauthURL = getSlackOAuthURL(state);

  return NextResponse.redirect(oauthURL);
}
