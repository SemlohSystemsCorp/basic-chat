# Slack Migration Guide

Import your Slack workspace into Chatterbox using Slack's OAuth API — no manual exports needed.

## Setup (One-Time)

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Name it something like `Chatterbox Importer`
4. Select the Slack workspace you want to import from
5. Click **Create App**

### 2. Configure OAuth Scopes

1. In your Slack App settings, go to **OAuth & Permissions**
2. Under **Scopes** → **User Token Scopes**, add:
   - `channels:history` — read messages from public channels
   - `channels:read` — list public channels
   - `users:read` — read user display names
   - `users:read.email` — read user emails
   - `team:read` — read workspace info
3. Click **Save Changes**

### 3. Set the Redirect URL

1. Still in **OAuth & Permissions**, scroll to **Redirect URLs**
2. Add your callback URL:
   - **Local dev:** `http://localhost:3000/api/import/slack/callback`
   - **Production:** `https://yourdomain.com/api/import/slack/callback`
3. Click **Save URLs**

### 4. Get Your Credentials

1. Go to **Basic Information** in your Slack App settings
2. Under **App Credentials**, copy:
   - **Client ID**
   - **Client Secret**
3. Add them to your `.env.local`:

```env
SLACK_CLIENT_ID=your_client_id_here
SLACK_CLIENT_SECRET=your_client_secret_here
```

### 5. Run the SQL Migration

Run the SQL in `fix-006-slack-connections.sql` in your Supabase SQL editor to create the `slack_connections` table.

---

## How It Works

### Flow

1. User clicks **Migrate from Slack** (during box creation or from workspace settings)
2. User is redirected to Slack's OAuth consent screen
3. User authorizes Chatterbox to read their workspace data
4. Slack redirects back with an access token
5. Token is stored securely in the `slack_connections` table
6. User sees a list of their Slack channels with checkboxes
7. User selects which channels to import and clicks **Import**
8. Chatterbox pulls channels and messages via the Slack API

### What Gets Imported

| Data | Imported? |
|------|-----------|
| Public channels | Yes |
| Channel messages | Yes |
| User display names | Yes (shown as `[Name]` prefix) |
| Archived channels | Skipped |
| Private channels | No (requires additional scopes) |
| Direct messages | No |
| Files/attachments | No |
| User accounts | No (users sign up separately) |

### Two Import Paths

**A) During workspace creation:**
1. Create a Box → choose **Migrate from Slack**
2. Name your workspace → click **Create & Connect Slack**
3. Authorize on Slack
4. Select channels → Import
5. Invite your team

**B) From workspace settings (existing workspace):**
1. Go to **Settings** → **Import Data**
2. Click **Connect to Slack**
3. Authorize on Slack
4. Click **Load Slack channels**
5. Select channels → Import

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/import/slack/oauth` | GET | Initiates Slack OAuth (redirects to Slack) |
| `/api/import/slack/callback` | GET | Handles OAuth callback, stores token |
| `/api/import/slack` | GET | Check connection status |
| `/api/import/slack` | PUT | Preview available Slack channels |
| `/api/import/slack` | POST | Run the import for selected channels |

---

## Troubleshooting

**"Slack connection failed: invalid_code"**
The OAuth code expired. Try connecting again — codes are single-use and expire quickly.

**"Slack not connected"**
The OAuth flow didn't complete. Click "Connect to Slack" again.

**"Must be workspace owner or admin"**
Only workspace admins/owners can import data.

**No channels appear**
Make sure the Slack app has the `channels:read` scope and was installed to the correct workspace.

**"not_in_channel" errors on import**
The Slack bot needs to be a member of channels to read their history. For public channels, `channels:history` should work. If you still get errors, try joining the bot to those channels in Slack first.

## Security

- Access tokens are stored in the `slack_connections` table with RLS policies
- Only workspace admins/owners can view or use the stored token
- Tokens are scoped to read-only access (no write permissions on Slack)
- Each workspace can only have one Slack connection at a time
