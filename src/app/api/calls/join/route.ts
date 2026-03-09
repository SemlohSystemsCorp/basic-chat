import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { callCode } = await request.json();

    if (!callCode) {
      return NextResponse.json({ error: 'callCode is required' }, { status: 400 });
    }

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Find the call by code
    const { data: call } = await supabase
      .from('calls')
      .select('id, box_id, call_code, room_name, room_url, title, status, started_at, channel_id')
      .eq('call_code', callCode.trim().toLowerCase())
      .single();

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (call.status === 'ended') {
      return NextResponse.json({ error: 'This call has already ended' }, { status: 400 });
    }

    // Verify user is a member of the box
    const { data: membership } = await supabase
      .from('box_members')
      .select('role')
      .eq('box_id', call.box_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 });
    }

    // Add as participant (upsert — they may rejoin)
    await supabase
      .from('call_participants')
      .upsert({
        call_id: call.id,
        user_id: user.id,
        joined_at: new Date().toISOString(),
        left_at: null,
      }, { onConflict: 'call_id,user_id' });

    // Get participants with profile info
    const { data: participants } = await supabase
      .from('call_participants')
      .select('user_id, joined_at, user:profiles(display_name, avatar_url)')
      .eq('call_id', call.id)
      .is('left_at', null);

    // Get the box slug for redirect
    const { data: box } = await supabase
      .from('boxes')
      .select('slug')
      .eq('id', call.box_id)
      .single();

    return NextResponse.json({
      call,
      participants: participants || [],
      boxSlug: box?.slug || null,
    });
  } catch (error) {
    console.error('Join call error:', error);
    return NextResponse.json({ error: 'Failed to join call' }, { status: 500 });
  }
}
