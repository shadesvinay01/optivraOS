/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Cpu,
  Layers,
  FileText,
  Mail,
  Calendar,
  Users,
  Search,
  BookOpen,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { ChatMessage, DatabaseSchema } from '../types.js';

interface AIBrainViewProps {
  db: DatabaseSchema;
  onSendMessage: (query: string) => Promise<void>;
  onClearHistory: () => Promise<void>;
  sending: boolean;
}

const AGENT_PERSONAS = [
  {
    id: 'brain',
    name: 'AI Brain Orchestrator',
    desc: 'Central command. Routes inquiries, recalls corporate memory, and delegates execution.',
    icon: Cpu,
    color: 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800'
  },
  {
    id: 'email',
    name: 'Email Agent',
    desc: 'Summarizes client messages, flags tasks, and drafts high-confidence standard replies.',
    icon: Mail,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400'
  },
  {
    id: 'calendar',
    name: 'Calendar Agent',
    desc: 'Resolves meeting overlaps, lists schedules, and compiles daily briefs.',
    icon: Calendar,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400'
  },
  {
    id: 'meeting',
    name: 'Meeting Intelligence',
    desc: 'Generates summaries, extracts action items, assigns owners, and updates Knowledge bases.',
    icon: Users,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400'
  },
  {
    id: 'knowledge',
    name: 'Knowledge base Agent',
    desc: 'Scans documents and answers grounded questions citing company policies.',
    icon: BookOpen,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400'
  },
  {
    id: 'proposal',
    name: 'Proposal Builder',
    desc: 'Compiles custom timeline scopes, enterprise milestones, and SLA pricing briefs.',
    icon: FileText,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400'
  }
];

export default function AIBrainView({
  db,
  onSendMessage,
  onClearHistory,
  sending
}: AIBrainViewProps) {
  const [query, setQuery] = useState('');
  const [activePersona, setActivePersona] = useState('brain');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [db.chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || sending) return;
    const sendQuery = query;
    setQuery('');
    await onSendMessage(sendQuery);
  };

  const handleApplySuggestion = (text: string, persona: string) => {
    setQuery(text);
    setActivePersona(persona);
  };

  // Find the last agent reasoning log
  const lastAssistantMsg = [...db.chatHistory]
    .reverse()
    .find((m) => m.sender === 'assistant' && m.reasoning);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-12rem)] animate-fade-in" id="ai_brain_view_container">
      {/* Sidebar: Agents selector */}
      <div className="xl:col-span-1 border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-4 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-medium text-zinc-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-500" />
              Specialized Agents
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select an agent persona to prioritize routing, or chat naturally to auto-delegate.
            </p>
          </div>

          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {AGENT_PERSONAS.map((agent) => {
              const Icon = agent.icon;
              const isActive = activePersona === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    setActivePersona(agent.id);
                    // Pre-fill prompt suggestion based on active persona
                    if (agent.id === 'email') setQuery('List my unread emails and draft suggested replies.');
                    else if (agent.id === 'calendar') setQuery('Check my calendar for meetings and any conflict today.');
                    else if (agent.id === 'meeting') setQuery('What was decided in the last platform kickoff meeting?');
                    else if (agent.id === 'knowledge') setQuery('What support response SLA levels do we guarantee?');
                    else if (agent.id === 'proposal') setQuery('Draft a custom scope proposal for Acme Corporation.');
                    else setQuery('');
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-zinc-900 border-zinc-950 text-white dark:bg-zinc-800 dark:border-zinc-700'
                      : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200 text-zinc-800 dark:bg-zinc-800/20 dark:border-zinc-800 dark:hover:border-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${agent.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <h3 className="text-xs font-semibold">{agent.name}</h3>
                  </div>
                  <p className={`text-[10px] mt-1.5 leading-normal ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {agent.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flush Button */}
        <button
          onClick={onClearHistory}
          className="flex items-center justify-center gap-2 w-full py-2 bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-100 rounded-xl text-xs font-medium transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Flush Brain Memory
        </button>
      </div>

      {/* Main Panel: Chat screen */}
      <div className="xl:col-span-2 border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 p-4 flex flex-col h-full relative overflow-hidden">
        {/* Messages body */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {db.chatHistory.map((msg) => {
            const isAI = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isAI ? 'bg-zinc-900 text-amber-400 border border-zinc-800' : 'bg-blue-600 text-white'
                  }`}
                >
                  {isAI ? 'OS' : 'U'}
                </div>
                <div className="space-y-1">
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                      isAI
                        ? 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-sm'
                        : 'bg-blue-600 text-white dark:bg-blue-600 shadow-sm rounded-tr-none'
                    }`}
                  >
                    {isAI && msg.agentDelegated && msg.agentDelegated !== 'brain' && (
                      <span className="inline-block text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 rounded px-1.5 py-0.5 mb-1.5 uppercase">
                        {msg.agentDelegated} agent active
                      </span>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 block px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex gap-3 max-w-[80%] mr-auto text-left">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-amber-400 border border-zinc-800 flex items-center justify-center animate-pulse">
                OS
              </div>
              <div className="space-y-1">
                <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl shadow-sm text-sm text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-zinc-400 ml-1">Optivra agent is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input box */}
        <form onSubmit={handleSubmit} className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 p-2 flex gap-2">
          <input
            type="text"
            placeholder={
              activePersona === 'brain'
                ? "Instruct your AI COO (e.g. 'schedule meeting' or 'draft Acme proposal')..."
                : `Instruct ${AGENT_PERSONAS.find(a => a.id === activePersona)?.name}...`
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={sending}
            className="flex-1 px-3 py-2 text-sm bg-transparent border-none text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !query.trim()}
            className="p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right Panel: AI Inner thought reasoning logs */}
      <div className="xl:col-span-1 border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-4 space-y-4">
        <div>
          <h2 className="text-base font-medium text-zinc-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-500" />
            Agent Thought Log
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time telemetry from the orchestration reasoning layer.
          </p>
        </div>

        {lastAssistantMsg ? (
          <div className="space-y-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-500 uppercase">Step 1: Reasoning</span>
                <span className="text-[10px] text-zinc-400 font-mono">active</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-mono">
                {lastAssistantMsg.reasoning}
              </p>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-500 uppercase">Step 2: Delegation</span>
                <span className="text-[10px] text-zinc-400 font-mono">complete</span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-400" />
                <span>Routed query context to: <strong>{lastAssistantMsg.agentDelegated?.toUpperCase() || 'BRAIN'} AGENT</strong></span>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="text-[10px] font-bold text-emerald-500 uppercase block">Grounded Search Memory</span>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Active context logs show: {db.knowledgeDocs.length} Knowledge documents, {db.emails.length} Emails, and {db.calendarEvents.length} Calendar events verified for RAG compilation.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 border border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl text-center space-y-2 text-zinc-400">
            <AlertCircle className="w-8 h-8 mx-auto stroke-1" />
            <p className="text-xs">No active transactions. Send a chat query to inspect real-time agent reasoning telemetry.</p>
          </div>
        )}
      </div>
    </div>
  );
}
