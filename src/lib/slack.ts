// Slack OAuth + API helpers

export const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID!;
export const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET!;
export const SLACK_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/import/slack/callback`;

// Scopes needed to read channels, messages, and users
export const SLACK_SCOPES = [
  'channels:history',
  'channels:read',
  'users:read',
  'users:read.email',
  'team:read',
].join(',');

export function getSlackOAuthURL(state: string): string {
  const params = new URLSearchParams({
    client_id: SLACK_CLIENT_ID,
    scope: SLACK_SCOPES,
    redirect_uri: SLACK_REDIRECT_URI,
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeSlackCode(code: string): Promise<{
  ok: boolean;
  access_token?: string;
  team?: { id: string; name: string };
  error?: string;
}> {
  const res = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code,
      redirect_uri: SLACK_REDIRECT_URI,
    }),
  });
  return res.json();
}

// Generic Slack API caller
export async function slackAPI(token: string, method: string, params: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const url = new URL(`https://slack.com/api/${method}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// Fetch all public channels
export async function fetchSlackChannels(token: string): Promise<{
  id: string;
  name: string;
  purpose: string;
  num_members: number;
  is_archived: boolean;
}[]> {
  const channels: { id: string; name: string; purpose: string; num_members: number; is_archived: boolean }[] = [];
  let cursor = '';

  do {
    const params: Record<string, string> = { types: 'public_channel', limit: '200' };
    if (cursor) params.cursor = cursor;

    const data = await slackAPI(token, 'conversations.list', params) as {
      ok: boolean;
      channels?: { id: string; name: string; purpose?: { value?: string }; num_members?: number; is_archived?: boolean }[];
      response_metadata?: { next_cursor?: string };
    };

    if (!data.ok || !data.channels) break;

    for (const ch of data.channels) {
      channels.push({
        id: ch.id,
        name: ch.name,
        purpose: ch.purpose?.value || '',
        num_members: ch.num_members || 0,
        is_archived: ch.is_archived || false,
      });
    }

    cursor = data.response_metadata?.next_cursor || '';
  } while (cursor);

  return channels;
}

// Fetch channel message history
export async function fetchSlackMessages(token: string, channelId: string, limit = 1000): Promise<{
  user?: string;
  text?: string;
  ts?: string;
  subtype?: string;
}[]> {
  const messages: { user?: string; text?: string; ts?: string; subtype?: string }[] = [];
  let cursor = '';
  let fetched = 0;

  do {
    const params: Record<string, string> = { channel: channelId, limit: '200' };
    if (cursor) params.cursor = cursor;

    const data = await slackAPI(token, 'conversations.history', params) as {
      ok: boolean;
      messages?: { user?: string; text?: string; ts?: string; subtype?: string }[];
      response_metadata?: { next_cursor?: string };
    };

    if (!data.ok || !data.messages) break;

    messages.push(...data.messages);
    fetched += data.messages.length;
    cursor = data.response_metadata?.next_cursor || '';
  } while (cursor && fetched < limit);

  return messages.reverse(); // oldest first
}

// Fetch all users
export async function fetchSlackUsers(token: string): Promise<Map<string, string>> {
  const userMap = new Map<string, string>();
  let cursor = '';

  do {
    const params: Record<string, string> = { limit: '200' };
    if (cursor) params.cursor = cursor;

    const data = await slackAPI(token, 'users.list', params) as {
      ok: boolean;
      members?: { id: string; name: string; real_name?: string; profile?: { display_name?: string } }[];
      response_metadata?: { next_cursor?: string };
    };

    if (!data.ok || !data.members) break;

    for (const u of data.members) {
      userMap.set(u.id, u.profile?.display_name || u.real_name || u.name);
    }

    cursor = data.response_metadata?.next_cursor || '';
  } while (cursor);

  return userMap;
}

// Fetch team info
export async function fetchSlackTeam(token: string): Promise<{ name: string; id: string } | null> {
  const data = await slackAPI(token, 'team.info') as {
    ok: boolean;
    team?: { name: string; id: string };
  };
  if (!data.ok || !data.team) return null;
  return data.team;
}
