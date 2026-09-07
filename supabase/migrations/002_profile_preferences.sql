ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferences_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS favorite_artists text[] NOT NULL DEFAULT '{}';
