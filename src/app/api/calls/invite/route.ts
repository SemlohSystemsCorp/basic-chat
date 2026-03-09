import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { callId, userIds } = await request.json();

    if (!callId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'callId and userIds[] are required' }, { status: 400 });
    }

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Verify call exists and user is a participant
    const { data: call } = await supabase
      .from('calls')
      .select('id, box_id, status')
      .eq('id', callId)
      .single();

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (call.status === 'ended') {
      return NextResponse.json({ error: 'Call has ended' }, { status: 400 });
    }

    // Verify inviter is a box member
    const { data: membership } = await supabase
      .from('box_members')
      .select('role')
      .eq('box_id', call.box_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Create invites for each user
    const invites = userIds.map((uid: string) => ({
      call_id: callId,
      invited_by: user.id,
      invited_user_id: uid,
    }));

    const { data: createdInvites, error } = await supabase
      .from('call_invites')
      .insert(invites)
      .select('id, invited_user_id, status, created_at');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invites: createdInvites });
  } catch (error) {
    console.error('Call invite error:', error);
    return NextResponse.json({ error: 'Failed to send call invites' }, { status: 500 });
  }
}
