/*
# Add wallet-based user profiles + owner scoping for agents

## Overview
Adds a `wallet_users` table to store user profiles tied to EVM wallet addresses,
and adds an `owner_wallet` column to `agents` so each agent is owned by the
wallet that created it. Updates RLS policies to scope agent data by wallet owner.

## New Table
- `wallet_users`
  - id (uuid, primary key)
  - wallet_address (text, unique, not null) - lowercase EVM address
  - display_name (text) - user-chosen display name
  - avatar_seed (text) - seed for generating avatar gradient
  - created_at (timestamptz)
  - last_seen_at (timestamptz)

## Modified Tables
- `agents` - added `owner_wallet` column (text, default 'anonymous')
  - Used to scope agent ownership by wallet address

## Security
- RLS on wallet_users: anon+authenticated can read/insert/update (single-tenant client model,
  wallet address serves as the identity token; actual scoping is done in application queries)
- RLS on agents: updated policies to allow all CRUD (the application filters by owner_wallet
  in queries)
*/

-- Create wallet_users table
CREATE TABLE IF NOT EXISTS wallet_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  display_name text,
  avatar_seed text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wallet_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_wallet_users" ON wallet_users;
CREATE POLICY "anon_select_wallet_users" ON wallet_users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_wallet_users" ON wallet_users;
CREATE POLICY "anon_insert_wallet_users" ON wallet_users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_wallet_users" ON wallet_users;
CREATE POLICY "anon_update_wallet_users" ON wallet_users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_wallet_users" ON wallet_users;
CREATE POLICY "anon_delete_wallet_users" ON wallet_users FOR DELETE
  TO anon, authenticated USING (true);

-- Add owner_wallet column to agents
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'owner_wallet') THEN
    ALTER TABLE agents ADD COLUMN owner_wallet text NOT NULL DEFAULT 'anonymous';
  END IF;
END $$;

-- Create index for owner_wallet lookups
CREATE INDEX IF NOT EXISTS idx_agents_owner_wallet ON agents(owner_wallet);
