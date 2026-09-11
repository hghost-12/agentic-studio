import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Agent, Task, ActivityLog, AgentSnapshot, AgentConfig } from '@/types';

export function useAgents(ownerWallet: string | null) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    if (!ownerWallet) {
      setAgents([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('owner_wallet', ownerWallet)
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setAgents(data as Agent[]);
    }
    setLoading(false);
  }, [ownerWallet]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const createAgent = useCallback(async (
    params: Omit<Agent, 'id' | 'created_at' | 'updated_at' | 'total_tasks' | 'successful_tasks' | 'total_value' | 'last_active_at' | 'owner_wallet'>
  ) => {
    if (!ownerWallet) throw new Error('Wallet not connected');
    const { data, error } = await supabase
      .from('agents')
      .insert({
        name: params.name,
        description: params.description,
        agent_type: params.agent_type,
        status: params.status,
        protocol: params.protocol,
        chain: params.chain,
        config: params.config,
        risk_level: params.risk_level,
        owner_wallet: ownerWallet,
      })
      .select()
      .single();
    if (error) throw error;
    await fetchAgents();
    return data as Agent;
  }, [fetchAgents, ownerWallet]);

  const updateAgent = useCallback(async (id: string, updates: Partial<Agent>) => {
    const { error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    await fetchAgents();
  }, [fetchAgents]);

  const deleteAgent = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchAgents();
  }, [fetchAgents]);

  return { agents, loading, error, fetchAgents, createAgent, updateAgent, deleteAgent };
}

export function useAgent(agentId: string | null) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentId) {
      setAgent(null);
      return;
    }
    setLoading(true);
    supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load agent:', error.message);
          setAgent(null);
        } else {
          setAgent(data as Agent);
        }
        setLoading(false);
      });
  }, [agentId]);

  return { agent, loading };
}

export function useTasks(agentId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!agentId) {
      setTasks([]);
      return;
    }
    setLoading(true);
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
    query = query.eq('agent_id', agentId);
    const { data, error } = await query.limit(50);
    if (error) {
      console.error('Failed to load tasks:', error.message);
      setTasks([]);
    } else {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (
    agentId: string,
    params: { title: string; description?: string; task_type: Task['task_type']; priority: Task['priority']; input_params: Record<string, unknown> }
  ) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        agent_id: agentId,
        title: params.title,
        description: params.description ?? null,
        task_type: params.task_type,
        status: 'queued',
        priority: params.priority,
        input_params: params.input_params,
        gas_estimate: Math.random() * 50 + 5,
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from('activity_logs').insert({
      agent_id: agentId,
      task_id: (data as Task).id,
      message: `Task queued: ${params.title}`,
      level: 'info',
      metadata: { task_type: params.task_type, priority: params.priority },
    });

    await fetchTasks();
    return data as Task;
  }, [fetchTasks]);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status'], result?: Record<string, unknown>, errorMsg?: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'running') updates.started_at = new Date().toISOString();
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      if (result) updates.output_result = result;
    }
    if (status === 'failed') {
      updates.completed_at = new Date().toISOString();
      if (errorMsg) updates.error_message = errorMsg;
    }
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (error) throw error;
    await fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, fetchTasks, createTask, updateTaskStatus };
}

export function useAllTasks(ownerWallet: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!ownerWallet) {
      setTasks([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('tasks')
      .select('*, agents!inner(name)')
      .eq('agents.owner_wallet', ownerWallet)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error('Failed to load tasks:', error.message);
      setTasks([]);
    } else {
      setTasks(data as unknown as Task[]);
    }
    setLoading(false);
  }, [ownerWallet]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, fetchTasks };
}

export function useActivityLogs(agentId: string | null) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!agentId) {
      setLogs([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error('Failed to load logs:', error.message);
      setLogs([]);
    } else {
      setLogs(data as ActivityLog[]);
    }
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, fetchLogs };
}

export function useAllActivityLogs(ownerWallet: string | null) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerWallet) {
      setLogs([]);
      setLoading(false);
      return;
    }
    supabase
      .from('activity_logs')
      .select('*, agents!inner(name)')
      .eq('agents.owner_wallet', ownerWallet)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load logs:', error.message);
        } else {
          setLogs(data as unknown as ActivityLog[]);
        }
        setLoading(false);
      });
  }, [ownerWallet]);

  return { logs, loading };
}

export function useSnapshots(agentId: string | null, days = 30) {
  const [snapshots, setSnapshots] = useState<AgentSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentId) {
      setSnapshots([]);
      return;
    }
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - days);
    supabase
      .from('agent_snapshots')
      .select('*')
      .eq('agent_id', agentId)
      .gte('recorded_at', since.toISOString())
      .order('recorded_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load snapshots:', error.message);
          setSnapshots([]);
        } else {
          setSnapshots(data as AgentSnapshot[]);
        }
        setLoading(false);
      });
  }, [agentId, days]);

  return { snapshots, loading };
}

export function useAllSnapshots(ownerWallet: string | null, days = 30) {
  const [snapshots, setSnapshots] = useState<AgentSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerWallet) {
      setSnapshots([]);
      setLoading(false);
      return;
    }
    const since = new Date();
    since.setDate(since.getDate() - days);
    supabase
      .from('agent_snapshots')
      .select('*, agents!inner(name, agent_type)')
      .eq('agents.owner_wallet', ownerWallet)
      .gte('recorded_at', since.toISOString())
      .order('recorded_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load all snapshots:', error.message);
          setSnapshots([]);
        } else {
          setSnapshots(data as unknown as AgentSnapshot[]);
        }
        setLoading(false);
      });
  }, [ownerWallet, days]);

  return { snapshots, loading };
}

export type { AgentConfig };
