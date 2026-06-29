/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Inbox,
  Calendar as CalendarIcon,
  Users,
  BookOpen,
  FileText,
  Settings as SettingsIcon,
  Sparkles,
  Moon,
  Sun,
  Clock,
  Terminal,
  RefreshCw,
  TrendingUp,
  ListTodo
} from 'lucide-react';

import { DatabaseSchema, ChatMessage } from './types.js';
import DashboardView from './components/DashboardView.js';
import AIBrainView from './components/AIBrainView.js';
import EmailAgentView from './components/EmailAgentView.js';
import CalendarAgentView from './components/CalendarAgentView.js';
import MeetingsView from './components/MeetingsView.js';
import KnowledgeBaseView from './components/KnowledgeBaseView.js';
import ProposalView from './components/ProposalView.js';
import SettingsView from './components/SettingsView.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingBrain, setSendingBrain] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(true);

  // UTC and Local clock
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    fetchDbState();
    const interval = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDbState = async () => {
    try {
      const response = await fetch('/api/db');
      const data = await response.json();
      setDb(data);
    } catch (error) {
      console.error('Failed to pull DB state:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. AI Brain Handlers
  const handleSendBrainQuery = async (query: string) => {
    if (!query.trim() || !db) return;
    setSendingBrain(true);
    
    // Optimistic User message update
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString()
    };
    setDb((prev) => prev ? {
      ...prev,
      chatHistory: [...prev.chatHistory, tempUserMsg]
    } : null);

    try {
      const response = await fetch('/api/brain/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: db.chatHistory.filter(m => m.id !== tempUserMsg.id),
          query
        })
      });
      const data = await response.json();
      if (data.chatHistory) {
        setDb((prev) => prev ? {
          ...prev,
          chatHistory: data.chatHistory,
          auditLogs: [
            {
              id: `temp_log_${Date.now()}`,
              userId: 'usr_1',
              userName: 'Sarveshwar',
              action: 'AI Agent Call Out',
              details: `Executed reasoning for query: "${query.substring(0, 40)}..."`,
              timestamp: new Date().toISOString(),
              module: 'brain'
            },
            ...prev.auditLogs
          ]
        } : null);
      }
    } catch (error) {
      console.error('Brain sync error:', error);
    } finally {
      setSendingBrain(false);
      fetchDbState(); // Sync complete database stats
    }
  };

  const handleClearChatHistory = async () => {
    try {
      const response = await fetch('/api/brain/clear', { method: 'POST' });
      const data = await response.json();
      if (data.chatHistory) {
        setDb((prev) => prev ? {
          ...prev,
          chatHistory: data.chatHistory
        } : null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  // 2. Email Agent Handlers
  const handleSummarizeEmail = async (id: string) => {
    try {
      const response = await fetch(`/api/emails/${id}/summarize`, { method: 'POST' });
      const data = await response.json();
      if (data.email) {
        setDb((prev) => {
          if (!prev) return null;
          const emails = prev.emails.map((e) => e.id === id ? data.email : e);
          return { ...prev, emails };
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  const handleSendEmailReply = async (id: string, body: string) => {
    try {
      const response = await fetch(`/api/emails/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body })
      });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  const handleToggleAutoReply = async (id: string) => {
    try {
      const response = await fetch(`/api/emails/${id}/auto-reply-toggle`, { method: 'POST' });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  // 3. Calendar Agent Handlers
  const handleScheduleEvent = async (eventData: any) => {
    try {
      const response = await fetch('/api/calendar/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      const data = await response.json();
      fetchDbState();
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  const handleGeneratePrepNotes = async (id: string) => {
    try {
      const response = await fetch(`/api/calendar/${id}/prep`, { method: 'POST' });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  // 4. Meeting Intelligence Handlers
  const handleAnalyzeTranscript = async (title: string, transcript: string, duration?: string) => {
    try {
      const response = await fetch('/api/meetings/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, transcript, duration })
      });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  const handleSendRecap = async (id: string) => {
    try {
      const response = await fetch(`/api/meetings/${id}/recap`, { method: 'POST' });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  const handleSaveToKnowledgeBase = async (id: string) => {
    try {
      const response = await fetch(`/api/meetings/${id}/save-kb`, { method: 'POST' });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  // 5. Knowledge base Handlers
  const handleUploadDocument = async (docData: any) => {
    try {
      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
      });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  const handleQueryKnowledge = async (question: string) => {
    try {
      const response = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      return await response.json();
    } catch (error) {
      console.error(error);
      return { answer: 'Error in semantic search pipeline.', citations: [] };
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  // 6. Proposal Handlers
  const handleGenerateProposal = async (clientName: string, requirements: string, pricingStrategy: string) => {
    try {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, requirements, pricingStrategy })
      });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  const handleUpdateProposal = async (id: string, updateData: any) => {
    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  const handleDeleteProposal = async (id: string) => {
    try {
      await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  // 7. General Task Handlers
  const handleAddTask = async (title: string, priority: 'low' | 'medium' | 'high') => {
    try {
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority })
      });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}/toggle`, { method: 'POST' });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  // 8. Settings & Simulation
  const handleUpdateSettings = async (settingsData: any) => {
    try {
      const response = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };

  const handleSimulateSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/simulate', { method: 'POST' });
      await response.json();
    } catch (error) {
      console.error(error);
    } finally {
      fetchDbState();
    }
  };


  if (loading || !db) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white space-y-4">
        <Cpu className="w-12 h-12 text-zinc-400 animate-spin" />
        <h1 className="text-xl font-sans tracking-tight font-medium">Optivra OS booting...</h1>
        <p className="text-xs text-zinc-500 font-mono">Initializing relational memory schema indices</p>
      </div>
    );
  }

  const activeSettings = db.settings[0] || { apiKeyConfigured: false, autoEmailApproval: false };

  return (
    <div className={isDark ? 'dark bg-zinc-950 text-white min-h-screen' : 'bg-zinc-50 text-zinc-900 min-h-screen'}>
      <div className="flex h-screen overflow-hidden font-sans bg-zinc-50 dark:bg-zinc-950" id="main_app_wrapper">
        
        {/* Left Sidebar Layout */}
        <aside className="w-64 border-r border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col justify-between print:hidden shrink-0">
          <div className="p-4 space-y-6">
            {/* Header / Logo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold tracking-tight border border-zinc-800 shadow-sm">
                  O
                </span>
                <div>
                  <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">Optivra OS</h1>
                  <span className="text-[10px] text-zinc-400 font-medium">AI COO • Workspace v1.4</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>

            {/* Navigation tabs */}
            <nav className="space-y-1">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: Layers },
                { id: 'brain', name: 'AI Brain', icon: Cpu, badge: 'Agent' },
                { id: 'email', name: 'Email Agent', icon: Inbox, count: db.emails.filter(e => e.status === 'unread').length },
                { id: 'calendar', name: 'Calendar Agent', icon: CalendarIcon },
                { id: 'meetings', name: 'Meetings', icon: Users },
                { id: 'knowledge', name: 'Knowledge', icon: BookOpen },
                { id: 'proposals', name: 'Documents', icon: FileText },
                { id: 'settings', name: 'Settings', icon: SettingsIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      isActive
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-sm font-bold'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4.5 h-4.5 shrink-0" />
                      <span>{tab.name}</span>
                    </div>

                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-500 text-white rounded-full">
                        {tab.count}
                      </span>
                    )}

                    {tab.badge && (
                      <span className="px-1.5 py-0.5 text-[8px] font-bold tracking-wider bg-amber-500 text-zinc-950 uppercase rounded-md animate-pulse">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar info */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-900/60 bg-zinc-50/50 dark:bg-zinc-950/20 space-y-3">
            <div className="text-[10px] text-zinc-400 font-mono space-y-1">
              <div className="flex justify-between">
                <span>LOCAL TIME:</span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">11:03 AM</span>
              </div>
              <div className="flex justify-between">
                <span>SYSTEM ID:</span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">OPT-58DC</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900/40 pt-2.5">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg cursor-pointer transition-all"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowLogs(!showLogs)}
                title="Toggle Audit Telemetry panel"
                className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                  showLogs ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace Frame */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* Top Bar Navigation headers */}
          <header className="h-14 border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 px-6 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-mono">WORKSPACE:</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-md">
                Executive COO Suite
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-100 dark:border-zinc-800/80">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                {utcTime || '2026-06-29 11:03 UTC'}
              </span>

              <button
                onClick={fetchDbState}
                title="Sync database tables"
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Module Content Panels */}
          <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50 dark:bg-zinc-950/40 print:p-0 print:bg-white">
            {activeTab === 'dashboard' && (
              <DashboardView
                db={db}
                onNavigate={(tab) => setActiveTab(tab)}
                onRefresh={fetchDbState}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
              />
            )}

            {activeTab === 'brain' && (
              <AIBrainView
                db={db}
                onSendMessage={handleSendBrainQuery}
                onClearHistory={handleClearChatHistory}
                sending={sendingBrain}
              />
            )}

            {activeTab === 'email' && (
              <EmailAgentView
                db={db}
                onSummarizeEmail={handleSummarizeEmail}
                onSendReply={handleSendEmailReply}
                onToggleAutoReply={handleToggleAutoReply}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarAgentView
                db={db}
                onScheduleEvent={handleScheduleEvent}
                onGeneratePrepNotes={handleGeneratePrepNotes}
              />
            )}

            {activeTab === 'meetings' && (
              <MeetingsView
                db={db}
                onAnalyzeTranscript={handleAnalyzeTranscript}
                onSendRecap={handleSendRecap}
                onSaveToKnowledgeBase={handleSaveToKnowledgeBase}
              />
            )}

            {activeTab === 'knowledge' && (
              <KnowledgeBaseView
                db={db}
                onUploadDocument={handleUploadDocument}
                onQueryKnowledge={handleQueryKnowledge}
                onDeleteDocument={handleDeleteDocument}
              />
            )}

            {activeTab === 'proposals' && (
              <ProposalView
                db={db}
                onGenerateProposal={handleGenerateProposal}
                onUpdateProposal={handleUpdateProposal}
                onDeleteProposal={handleDeleteProposal}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                db={db}
                onUpdateSettings={handleUpdateSettings}
                onSimulateSubscription={handleSimulateSubscription}
              />
            )}
          </div>
        </main>

        {/* Right Sidebar: Live Telemetry / Audit Activity Feed */}
        {showLogs && (
          <aside className="w-80 border-l border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4 flex flex-col justify-between print:hidden shrink-0 animate-slide-left">
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden text-left">
              <div className="border-b border-zinc-100 dark:border-zinc-900 pb-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  Live Audit Telemetry
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  Real-time transactional logging showing autonomous agent activity, API triggers, and database mutations.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-[11px] font-mono leading-relaxed">
                {db.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-zinc-400 uppercase">
                        [{log.module}]
                      </span>
                      <span className="text-[9px] text-zinc-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-zinc-800 dark:text-zinc-200 font-semibold">{log.action}</div>
                    <p className="text-zinc-500 leading-normal">{log.details}</p>
                    <div className="text-[9px] text-zinc-400 flex items-center justify-between">
                      <span>OPERATOR: {log.userName}</span>
                      <span className="text-emerald-500">✔ SUCCESS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900/40 text-[10px] text-zinc-400 text-left leading-normal">
              <span className="text-emerald-500 font-semibold">● SECURE AUTO-COOPERATOR ACTIVE</span>
              <p className="mt-1 font-mono">Optivra OS is monitoring {db.tasks.filter(t => t.status !== 'completed').length} active operational boundaries.</p>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}
