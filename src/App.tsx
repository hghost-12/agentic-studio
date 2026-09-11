import { useState, useCallback, useEffect } from 'react';
import { Sidebar, type View } from '@/components/Sidebar';
import { Dashboard } from '@/views/Dashboard';
import { BuildView } from '@/views/BuildView';
import { AgentsView } from '@/views/AgentsView';
import { AgentDetail } from '@/views/AgentDetail';
import { CreateAgentForm } from '@/views/CreateAgentForm';
import { TasksView } from '@/views/TasksView';
import { ActivityView } from '@/views/ActivityView';
import { SettingsView } from '@/views/SettingsView';
import { ConnectScreen } from '@/views/ConnectScreen';
import { useWallet } from '@/hooks/useWallet';
import { useAgents, useAgent, useTasks, useActivityLogs, useAllTasks, useAllActivityLogs, useSnapshots, useAllSnapshots } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { type AgentStatus } from '@/types';
import type { AgentSpec } from '@/lib/agentParser';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const wallet = useWallet();

  const ownerWallet = wallet.address;
  const { agents, loading, createAgent, updateAgent, deleteAgent, fetchAgents } = useAgents(ownerWallet);
  const { agent: selectedAgent } = useAgent(selectedAgentId);
  const { tasks: agentTasks, createTask, updateTaskStatus, fetchTasks } = useTasks(selectedAgentId);
  const { logs: agentLogs, fetchLogs } = useActivityLogs(selectedAgentId);
  const { tasks: allTasks, fetchTasks: fetchAllTasks } = useAllTasks(ownerWallet);
  const { logs: allLogs } = useAllActivityLogs(ownerWallet);
  const { snapshots: agentSnapshots, loading: snapshotsLoading } = useSnapshots(selectedAgentId);
  const { snapshots: allSnapshots } = useAllSnapshots(ownerWallet);

  // Refresh data when view changes
  useEffect(() => {
    if (!ownerWallet) return;
    if (view === 'tasks') fetchAllTasks();
    if (view === 'agents' || view === 'dashboard') fetchAgents();
  }, [view, fetchAllTasks, fetchAgents, ownerWallet]);

  const activeAgentCount = agents.filter((a) => a.status === 'active').length;

  const handleNavigate = (v: View) => {
    setView(v);
    setSelectedAgentId(null);
  };

  const handleAgentClick = (id: string) => {
    setSelectedAgentId(id);
  };

  const handleCreateAgent = useCallback(async (params: Parameters<typeof createAgent>[0]) => {
    const agent = await createAgent(params);
    setShowCreateForm(false);
    setSelectedAgentId(agent.id);
    await supabase.from('activity_logs').insert({
      agent_id: agent.id,
      message: `Agent created: ${agent.name}`,
      level: 'success',
      metadata: { agent_type: agent.agent_type, protocol: agent.protocol },
    });
  }, [createAgent]);

  const handleToggleStatus = useCallback(async (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent) return;
    const newStatus: AgentStatus = agent.status === 'active' ? 'paused' : 'active';
    const updates: Partial<typeof agent> = { status: newStatus };
    if (newStatus === 'active') updates.last_active_at = new Date().toISOString();
    await updateAgent(id, updates);
    await supabase.from('activity_logs').insert({
      agent_id: id,
      message: `Agent ${newStatus === 'active' ? 'activated' : 'paused'}`,
      level: newStatus === 'active' ? 'success' : 'warning',
      metadata: {},
    });
  }, [agents, updateAgent]);

  const handleDeleteAgent = useCallback(async () => {
    if (!selectedAgentId) return;
    await deleteAgent(selectedAgentId);
    setSelectedAgentId(null);
    setView('agents');
  }, [selectedAgentId, deleteAgent]);

  const handleCreateTask = useCallback(async (params: { title: string; description?: string; task_type: import('@/types').TaskType; priority: import('@/types').TaskPriority; input_params: Record<string, unknown> }) => {
    if (!selectedAgentId) return;
    await createTask(selectedAgentId, params);
    await fetchLogs();
  }, [selectedAgentId, createTask, fetchLogs]);

  const handleRunTask = useCallback(async (taskId: string, agentId?: string) => {
    const targetAgentId = agentId ?? selectedAgentId;
    if (!targetAgentId) return;

    await updateTaskStatus(taskId, 'running');

    await supabase.from('activity_logs').insert({
      agent_id: targetAgentId,
      task_id: taskId,
      message: `Task execution started`,
      level: 'info',
      metadata: { task_id: taskId },
    });

    setTimeout(async () => {
      const success = Math.random() > 0.15;
      if (success) {
        const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        await updateTaskStatus(taskId, 'completed', {
          tx_hash: txHash,
          gas_used: (Math.random() * 0.01).toFixed(6),
          block_number: 21000000 + Math.floor(Math.random() * 10000),
        }, undefined);

        const agent = agents.find((a) => a.id === targetAgentId);
        if (agent) {
          await updateAgent(targetAgentId, {
            total_tasks: agent.total_tasks + 1,
            successful_tasks: agent.successful_tasks + 1,
            last_active_at: new Date().toISOString(),
          });
        }

        await supabase.from('activity_logs').insert({
          agent_id: targetAgentId,
          task_id: taskId,
          message: `Task completed successfully. TX: ${txHash.slice(0, 10)}…`,
          level: 'success',
          metadata: { tx_hash: txHash },
        });
      } else {
        await updateTaskStatus(taskId, 'failed', undefined, 'Transaction reverted: insufficient gas or slippage exceeded');
        const agent = agents.find((a) => a.id === targetAgentId);
        if (agent) {
          await updateAgent(targetAgentId, {
            total_tasks: agent.total_tasks + 1,
            last_active_at: new Date().toISOString(),
          });
        }
        await supabase.from('activity_logs').insert({
          agent_id: targetAgentId,
          task_id: taskId,
          message: `Task failed: Transaction reverted`,
          level: 'error',
          metadata: { error: 'insufficient gas' },
        });
      }
      await fetchLogs();
      await fetchTasks();
      await fetchAgents();
    }, 2500 + Math.random() * 2000);
  }, [selectedAgentId, updateTaskStatus, agents, updateAgent, fetchLogs, fetchTasks, fetchAgents]);

  const handleRunTaskFromList = useCallback(async (taskId: string, agentId: string) => {
    await handleRunTask(taskId, agentId);
  }, [handleRunTask]);

  const handleCreateAgentFromSpec = useCallback(async (spec: AgentSpec) => {
    const agent = await createAgent({
      name: spec.name,
      description: spec.description,
      agent_type: spec.agent_type,
      status: 'idle',
      protocol: spec.protocol,
      chain: spec.chain,
      config: spec.config,
      risk_level: spec.risk_level,
    });
    await supabase.from('activity_logs').insert({
      agent_id: agent.id,
      message: `Agent created via chat builder: ${agent.name}`,
      level: 'success',
      metadata: { agent_type: agent.agent_type, protocol: agent.protocol, source: 'chat' },
    });
  }, [createAgent]);

  // Gate: show connect screen if wallet not connected
  if (!wallet.connected) {
    return (
      <ConnectScreen
        onConnect={wallet.connect}
        connecting={wallet.connecting}
        error={wallet.error}
      />
    );
  }

  // Loading state
  if (loading && view === 'dashboard') {
    return (
      <div className="min-h-screen bg-surface-950 flex">
        <Sidebar
          current={view}
          onNavigate={handleNavigate}
          agentCount={0}
          activeAgentCount={0}
          walletAddress={wallet.address!}
          walletChainName={wallet.chainName}
          walletUser={wallet.user}
          walletUserLoading={wallet.userLoading}
          onDisconnect={wallet.disconnect}
          onUpdateProfile={wallet.updateProfile}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-surface-800 animate-pulse flex items-center justify-center mb-3">
              <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-surface-400">Loading your agents…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      <Sidebar
        current={view}
        onNavigate={handleNavigate}
        agentCount={agents.length}
        activeAgentCount={activeAgentCount}
        walletAddress={wallet.address!}
        walletChainName={wallet.chainName}
        walletUser={wallet.user}
        walletUserLoading={wallet.userLoading}
        onDisconnect={wallet.disconnect}
        onUpdateProfile={wallet.updateProfile}
      />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
          {view === 'build' && !selectedAgentId ? (
            <BuildView
              onCreateAgent={handleCreateAgentFromSpec}
              onAgentCreated={() => fetchAgents()}
            />
          ) : (
          <div className="px-6 py-6 max-w-6xl mx-auto">
          {/* Agent detail view */}
          {selectedAgentId && selectedAgent ? (
            <AgentDetail
              agent={selectedAgent}
              tasks={agentTasks}
              logs={agentLogs}
              snapshots={agentSnapshots}
              snapshotsLoading={snapshotsLoading}
              onBack={() => { setSelectedAgentId(null); setView('agents'); }}
              onToggleStatus={() => handleToggleStatus(selectedAgentId)}
              onDelete={handleDeleteAgent}
              onCreateTask={handleCreateTask}
              onRunTask={(taskId) => handleRunTask(taskId)}
            />
          ) : selectedAgentId && !selectedAgent ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
          ) : view === 'dashboard' ? (
            <Dashboard
              agents={agents}
              recentTasks={allTasks}
              allSnapshots={allSnapshots}
              onAgentClick={handleAgentClick}
              onCreateAgent={() => setShowCreateForm(true)}
            />
          ) : view === 'agents' ? (
            <AgentsView
              agents={agents}
              onAgentClick={handleAgentClick}
              onCreateAgent={() => setShowCreateForm(true)}
              onToggleStatus={handleToggleStatus}
            />
          ) : view === 'tasks' ? (
            <TasksView tasks={allTasks} onRunTask={handleRunTaskFromList} />
          ) : view === 'activity' ? (
            <ActivityView logs={allLogs} />
          ) : view === 'settings' ? (
            <SettingsView />
          ) : null}
          </div>
          )}
      </main>

      {/* Create agent modal */}
      {showCreateForm && (
        <CreateAgentForm
          onClose={() => setShowCreateForm(false)}
          onCreate={handleCreateAgent}
        />
      )}
    </div>
  );
}

export default App;
