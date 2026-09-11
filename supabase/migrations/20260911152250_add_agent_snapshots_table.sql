/*
# Add agent_snapshots table for performance tracking

## Overview
Creates a table that stores periodic performance snapshots for each agent,
enabling time-series charts for value, P&L, task success rate, and gas costs.

## New Table
- `agent_snapshots`
  - id (uuid, primary key)
  - agent_id (uuid, foreign key to agents, cascade delete)
  - recorded_at (timestamptz) - when the snapshot was taken
  - total_value (numeric) - total value managed at that point in USD
  - pnl (numeric) - profit/loss since previous snapshot in USD
  - pnl_percent (numeric) - P&L as percentage
  - apy_estimate (numeric) - current estimated APY
  - gas_spent (numeric) - gas costs since last snapshot in USD
  - fees_earned (numeric) - fees/rewards earned since last snapshot in USD
  - position_count (integer) - number of active positions
  - task_success_rate (numeric) - rolling success rate at that point

## Security
- Single-tenant app (no auth). RLS enabled.
- anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS agent_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  total_value numeric NOT NULL DEFAULT 0,
  pnl numeric NOT NULL DEFAULT 0,
  pnl_percent numeric NOT NULL DEFAULT 0,
  apy_estimate numeric NOT NULL DEFAULT 0,
  gas_spent numeric NOT NULL DEFAULT 0,
  fees_earned numeric NOT NULL DEFAULT 0,
  position_count integer NOT NULL DEFAULT 1,
  task_success_rate numeric NOT NULL DEFAULT 0
);

ALTER TABLE agent_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_agent_snapshots" ON agent_snapshots;
CREATE POLICY "anon_select_agent_snapshots" ON agent_snapshots FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_agent_snapshots" ON agent_snapshots;
CREATE POLICY "anon_insert_agent_snapshots" ON agent_snapshots FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_agent_snapshots" ON agent_snapshots;
CREATE POLICY "anon_update_agent_snapshots" ON agent_snapshots FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_agent_snapshots" ON agent_snapshots;
CREATE POLICY "anon_delete_agent_snapshots" ON agent_snapshots FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_agent_snapshots_agent_id ON agent_snapshots(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_snapshots_recorded_at ON agent_snapshots(recorded_at DESC);
