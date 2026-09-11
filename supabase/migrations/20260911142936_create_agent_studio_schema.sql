/*
# Create Agentic Studio Schema (Web3/DeFi Agent Management)

## Overview
Creates the database tables for an agentic studio where users can create and manage
AI agents that perform Web3/DeFi operations such as providing liquidity, yield farming,
arbitrage, and portfolio rebalancing.

## New Tables

1. `agents` - Stores agent configurations
   - id (uuid, primary key)
   - name (text) - display name for the agent
   - description (text) - what the agent does
   - agent_type (text) - type: 'liquidity', 'yield', 'arbitrage', 'sniper', 'rebalancer', 'custom'
   - status (text) - current state: 'active', 'idle', 'paused', 'error'
   - protocol (text) - target DeFi protocol (e.g. 'Uniswap V3', 'Aave', 'Curve')
   - chain (text) - blockchain network (e.g. 'Ethereum', 'Arbitrum', 'Base')
   - config (jsonb) - agent-specific configuration parameters
   - risk_level (text) - 'low', 'medium', 'high'
   - total_tasks (integer) - count of tasks executed
   - successful_tasks (integer) - count of successful tasks
   - total_value (numeric) - total value managed in USD
   - last_active_at (timestamptz) - last activity timestamp
   - created_at (timestamptz)
   - updated_at (timestamptz)

2. `tasks` - Stores tasks assigned to agents
   - id (uuid, primary key)
   - agent_id (uuid, foreign key to agents)
   - title (text) - task title
   - description (text) - task details
   - task_type (text) - 'liquidity_provision', 'withdrawal', 'rebalance', 'harvest', 'swap', 'custom'
   - status (text) - 'pending', 'running', 'completed', 'failed', 'queued'
   - priority (text) - 'low', 'medium', 'high', 'critical'
   - input_params (jsonb) - task input parameters
   - output_result (jsonb) - task execution result
   - gas_estimate (numeric) - estimated gas cost in USD
   - tx_hash (text) - transaction hash if executed on-chain
   - error_message (text) - error details if failed
   - created_at (timestamptz)
   - started_at (timestamptz)
   - completed_at (timestamptz)

3. `activity_logs` - Stores activity log entries for agents
   - id (uuid, primary key)
   - agent_id (uuid, foreign key to agents)
   - task_id (uuid, foreign key to tasks, nullable)
   - message (text) - log message
   - level (text) - 'info', 'warning', 'error', 'success'
   - metadata (jsonb) - additional structured data
   - created_at (timestamptz)

## Security
- Single-tenant app (no auth). RLS enabled on all tables.
- Policies allow anon + authenticated full CRUD since data is intentionally shared.
*/

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  agent_type text NOT NULL DEFAULT 'custom',
  status text NOT NULL DEFAULT 'idle',
  protocol text,
  chain text NOT NULL DEFAULT 'Ethereum',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_level text NOT NULL DEFAULT 'medium',
  total_tasks integer NOT NULL DEFAULT 0,
  successful_tasks integer NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_agents" ON agents;
CREATE POLICY "anon_select_agents" ON agents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_agents" ON agents;
CREATE POLICY "anon_insert_agents" ON agents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_agents" ON agents;
CREATE POLICY "anon_update_agents" ON agents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_agents" ON agents;
CREATE POLICY "anon_delete_agents" ON agents FOR DELETE
  TO anon, authenticated USING (true);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'custom',
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  input_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_result jsonb,
  gas_estimate numeric DEFAULT 0,
  tx_hash text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  message text NOT NULL,
  level text NOT NULL DEFAULT 'info',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_activity_logs" ON activity_logs;
CREATE POLICY "anon_select_activity_logs" ON activity_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_activity_logs" ON activity_logs;
CREATE POLICY "anon_insert_activity_logs" ON activity_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_activity_logs" ON activity_logs;
CREATE POLICY "anon_update_activity_logs" ON activity_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_activity_logs" ON activity_logs;
CREATE POLICY "anon_delete_activity_logs" ON activity_logs FOR DELETE
  TO anon, authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_agent_id ON activity_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Add updated_at trigger for agents
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agents_updated_at ON agents;
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
