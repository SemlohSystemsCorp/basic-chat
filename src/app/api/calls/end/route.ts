import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { callId } = await request.json();

    if (!callId) {
      return NextResponse.json({ error: 'callId is required' }, { status: 400 });
    }

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Verify call exists and user is the creator
    const { data: call } = await supabase
      .from('calls')
      .select('id, created_by, room_name')
      .eq('id', callId)
      .single();

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (call.created_by !== user.id) {
      return NextResponse.json({ error: 'Only the call creator can end the call' }, { status: 403 });
    }

    // End the call
    await supabase
      .from('calls')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', callId);

    // Mark all participants as left
    await supabase
      .from('call_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('call_id', callId)
      .is('left_at', null);

    // Mark pending invites as missed
    await supabase
      .from('call_invites')
      .update({ status: 'missed' })
      .eq('call_id', callId)
      .eq('status', 'pending');

    // Delete Daily.co room if API key is configured
    if (process.env.DAILY_API_KEY && process.env.DAILY_API_KEY !== 'your_daily_api_key') {
      try {
        await fetch(`https://api.daily.co/v1/rooms/${call.room_name}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
        });
      } catch {
        // Non-critical, room will expire anyway
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End call error:', error);
    return NextResponse.json({ error: 'Failed to end call' }, { status: 500 });
  }
}
