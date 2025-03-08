/*
  # Create cases table

  1. New Tables
    - `cases`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `status` (text, default: 'open')
      - `created_at` (timestamp with timezone)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `cases` table
    - Add policies for:
      - Users can read their own cases
      - Users can create cases
      - Users can update their own cases
*/

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own cases
CREATE POLICY "Users can read own cases"
  ON cases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create cases
CREATE POLICY "Users can create cases"
  ON cases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cases
CREATE POLICY "Users can update own cases"
  ON cases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);