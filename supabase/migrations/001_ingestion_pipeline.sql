DROP TABLE IF EXISTS music_events CASCADE;
DROP TABLE IF EXISTS events CASCADE;

CREATE TABLE venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL,
  address text,
  city text NOT NULL DEFAULT 'Riga',
  lat numeric(9,6),
  lng numeric(9,6),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX venues_normalized_name_idx ON venues (normalized_name);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  normalized_title text NOT NULL,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  genre_tags text[] NOT NULL DEFAULT '{}',
  ticket_url text,
  image_url text,
  description text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','stale','cancelled')),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_dedup_idx ON events (normalized_title, venue_id, starts_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE event_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source text NOT NULL,
  external_id text NOT NULL,
  url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX event_sources_event_id_idx ON event_sources (event_id);

CREATE TABLE events_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  normalized_title text NOT NULL,
  venue_name text,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  genre_tags text[] NOT NULL DEFAULT '{}',
  ticket_url text,
  image_url text,
  description text,
  source text NOT NULL,
  external_id text NOT NULL,
  url text,
  raw_payload jsonb,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX staging_review_status_idx ON events_staging (review_status)
  WHERE review_status = 'pending';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
