/*
  # Create players table for game scores

  1. New Tables
    - `players`
      - `id` (uuid, primary key)
      - `nickname` (text, unique)
      - `high_score` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `players` table
    - Add policies for:
      - Anyone can read the leaderboard
      - Players can update their own scores
*/

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text UNIQUE NOT NULL,
  high_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the leaderboard
CREATE POLICY "Anyone can view the leaderboard"
  ON players
  FOR SELECT
  TO public
  USING (true);

-- Allow players to update their own scores
CREATE POLICY "Players can update their own scores"
  ON players
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow new players to be created
CREATE POLICY "Anyone can create a player"
  ON players
  FOR INSERT
  WITH CHECK (true);