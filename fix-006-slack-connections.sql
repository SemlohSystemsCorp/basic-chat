-- Slack OAuth connections table
-- Stores access tokens for connected Slack workspaces

CREATE TABLE IF NOT EXISTS slack_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  box_id UUID NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
  slack_team_id TEXT NOT NULL,
  slack_team_name TEXT NOT NULL DEFAULT '',
  access_token TEXT NOT NULL,
  connected_by UUID NOT NULL REFERENCES profiles(id),
  connected_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT slack_connections_box_id_key UNIQUE (box_id)
);

-- RLS
ALTER TABLE slack_connections ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can see their box's Slack connection
CREATE POLICY "Admins can view slack connections"
  ON slack_connections FOR SELECT
  USING (box_id IN (SELECT get_user_admin_box_ids()));

-- Only admins/owners can insert/update
CREATE POLICY "Admins can manage slack connections"
  ON slack_connections FOR ALL
  USING (box_id IN (SELECT get_user_admin_box_ids()));
