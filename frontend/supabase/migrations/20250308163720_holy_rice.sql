/*
  # Create cases table and security policies

  1. New Tables
    - `cases`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `status` (text, default: 'open')
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `cases` table
    - Add policies for authenticated users to:
      - Create their own cases
      - Read their own cases
      - Update their own cases
*/

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own cases"
  ON cases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own cases"
  ON cases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
  ON cases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);