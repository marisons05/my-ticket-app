-- Messages table for event groupchats
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_event_id_created_idx ON messages (event_id, created_at);

-- Groupchat membership: any logged-in user can join any event's groupchat
CREATE TABLE IF NOT EXISTS groupchat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS groupchat_members_user_idx ON groupchat_members (user_id);
CREATE INDEX IF NOT EXISTS groupchat_members_event_idx ON groupchat_members (event_id);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE groupchat_members ENABLE ROW LEVEL SECURITY;

-- groupchat_members: any logged-in user can join and see members of chats they're in
CREATE POLICY "users can join groupchats" ON groupchat_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "members can view membership" ON groupchat_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can leave groupchats" ON groupchat_members
  FOR DELETE USING (auth.uid() = user_id);

-- messages: only members of the groupchat can read/write
CREATE POLICY "authenticated users can read messages" ON messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "members can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM groupchat_members gm
      WHERE gm.event_id = messages.event_id
        AND gm.user_id = auth.uid()
    )
  );
