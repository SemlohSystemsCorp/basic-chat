import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { boxId, channelId, title } = await request.json();

    if (!boxId) {
      return NextResponse.json({ error: 'boxId is required' }, { status: 400 });
    }

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Verify membership
    const { data: membership } = await supabase
      .from('box_members')
      .select('role')
      .eq('box_id', boxId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this box' }, { status: 403 });
    }

    // Create Daily.co room via API if key is configured
    const roomSuffix = Math.random().toString(36).slice(2, 10);
    const roomName = `cb${roomSuffix}`;
    let roomUrl = '';

    const dailyDomain = process.env.NEXT_PUBLIC_DAILY_DOMAIN;
    const dailyKey = process.env.DAILY_API_KEY;

    if (dailyKey && dailyDomain) {
      try {
        const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dailyKey}`,
          },
          body: JSON.stringify({
            name: roomName,
            properties: {
              enable_chat: true,
              enable_screenshare: true,
              max_participants: 50,
              exp: Math.floor(Date.now() / 1000) + 86400, // 24h expiry
            },
          }),
        });

        if (dailyRes.ok) {
          const dailyRoom = await dailyRes.json();
          roomUrl = dailyRoom.url;
        } else {
          const errBody = await dailyRes.text();
          console.error('Daily.co error:', dailyRes.status, errBody);
          roomUrl = `https://${dailyDomain}/${roomName}`;
        }
      } catch (err) {
        console.error('Daily.co room creation failed:', err);
        roomUrl = `https://${dailyDomain}/${roomName}`;
      }
    }

    // Insert call record
    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert({
        box_id: boxId,
        channel_id: channelId || null,
        created_by: user.id,
        room_name: roomName,
        room_url: roomUrl,
        title: title || null,
      })
      .select('id, call_code, room_name, room_url, title, status, started_at')
      .single();

    if (callError) {
      return NextResponse.json({ error: callError.message }, { status: 500 });
    }

    // Add creator as first participant
    await supabase.from('call_participants').insert({
      call_id: call.id,
      user_id: user.id,
    });

    return NextResponse.json({ call });
  } catch (error) {
    console.error('Create call error:', error);
    return NextResponse.json({ error: 'Failed to create call' }, { status: 500 });
  }
}
