import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { fetchSlackChannels, fetchSlackMessages, fetchSlackUsers } from '@/lib/slack';

export async function GET(request: NextRequest) {
  // Check connection status
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const boxId = request.nextUrl.searchParams.get('boxId');
  if (!boxId) {
    return NextResponse.json({ error: 'Missing boxId' }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data: connection } = await supabase
    .from('slack_connections')
    .select('slack_team_id, slack_team_name, connected_at')
    .eq('box_id', boxId)
    .single();

  return NextResponse.json({ connected: !!connection, connection });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boxId, channelIds } = await request.json();

    if (!boxId) {
      return NextResponse.json({ error: 'Missing boxId' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Verify admin/owner
    const { data: membership } = await supabase
      .from('box_members')
      .select('role')
      .eq('box_id', boxId)
      .eq('user_id', user.id)
      .single();

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Must be workspace owner or admin' }, { status: 403 });
    }

    // Get stored Slack token
    const { data: connection } = await supabase
      .from('slack_connections')
      .select('access_token')
      .eq('box_id', boxId)
      .single();

    if (!connection?.access_token) {
      return NextResponse.json({ error: 'Slack not connected. Please connect to Slack first.' }, { status: 400 });
    }

    const token = connection.access_token;

    // Fetch Slack users for name mapping
    const userMap = await fetchSlackUsers(token);

    // Fetch channels from Slack
    const slackChannels = await fetchSlackChannels(token);

    // Filter to selected channels if specified, otherwise import all non-archived
    const channelsToImport = channelIds && channelIds.length > 0
      ? slackChannels.filter(ch => channelIds.includes(ch.id) && !ch.is_archived)
      : slackChannels.filter(ch => !ch.is_archived);

    const results = {
      channelsCreated: 0,
      messagesImported: 0,
      channelsSkipped: 0,
      errors: [] as string[],
    };

    for (const ch of channelsToImport) {
      const channelName = ch.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').substring(0, 80);

      // Check if channel exists
      const { data: existing } = await supabase
        .from('channels')
        .select('id')
        .eq('box_id', boxId)
        .eq('name', channelName)
        .single();

      let channelId: string;

      if (existing) {
        channelId = existing.id;
        results.channelsSkipped++;
      } else {
        const { data: newChannel, error: chError } = await supabase
          .from('channels')
          .insert({
            box_id: boxId,
            name: channelName,
            description: ch.purpose.substring(0, 256),
            created_by: user.id,
          })
          .select('id')
          .single();

        if (chError) {
          results.errors.push(`Failed to create #${channelName}: ${chError.message}`);
          continue;
        }
        channelId = newChannel.id;
        results.channelsCreated++;
      }

      // Fetch messages from Slack API
      const slackMessages = await fetchSlackMessages(token, ch.id);

      const messagesToInsert = slackMessages
        .filter(m => m.text && !m.subtype)
        .map(m => {
          const senderName = m.user ? userMap.get(m.user) || m.user : 'Unknown';
          const timestamp = m.ts
            ? new Date(parseFloat(m.ts) * 1000).toISOString()
            : new Date().toISOString();

          return {
            channel_id: channelId,
            user_id: user.id,
            content: `**[${senderName}]** ${m.text}`,
            created_at: timestamp,
          };
        });

      // Batch insert
      for (let i = 0; i < messagesToInsert.length; i += 500) {
        const batch = messagesToInsert.slice(i, i + 500);
        const { error: insertError } = await supabase
          .from('messages')
          .insert(batch);

        if (insertError) {
          results.errors.push(`Failed to import messages for #${channelName}: ${insertError.message}`);
        } else {
          results.messagesImported += batch.length;
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Slack import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}

// Preview available channels
export async function PUT(request: NextRequest) {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boxId } = await request.json();
    if (!boxId) {
      return NextResponse.json({ error: 'Missing boxId' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: connection } = await supabase
      .from('slack_connections')
      .select('access_token')
      .eq('box_id', boxId)
      .single();

    if (!connection?.access_token) {
      return NextResponse.json({ error: 'Slack not connected' }, { status: 400 });
    }

    const channels = await fetchSlackChannels(connection.access_token);

    return NextResponse.json({
      channels: channels
        .filter(ch => !ch.is_archived)
        .map(ch => ({
          id: ch.id,
          name: ch.name,
          purpose: ch.purpose,
          num_members: ch.num_members,
        })),
    });
  } catch (error) {
    console.error('Slack channels preview error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}
