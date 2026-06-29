/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Inbox,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DatabaseSchema, Task, Email, CalendarEvent } from '../types.js';

interface DashboardViewProps {
  db: DatabaseSchema;
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
  onAddTask: (title: string, priority: 'low' | 'medium' | 'high') => Promise<void>;
  onToggleTask: (id: string) => Promise<void>;
}

export default function DashboardView({
  db,
  onNavigate,
  onRefresh,
  onAddTask,
  onToggleTask
}: DashboardViewProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);

  // Stats calculation
  const pendingTasks = db.tasks.filter((t) => t.status !== 'completed');
  const completedTasks = db.tasks.filter((t) => t.status === 'completed');
  const unreadEmails = db.emails.filter((e) => e.status === 'unread');
  const upcomingEvents = db.calendarEvents.slice(0, 3);

  const kpiData = [
    { name: 'Mon', Revenue: 8500, Tasks: 4, Efficiency: 72 },
    { name: 'Tue', Revenue: 9500, Tasks: 5, Efficiency: 78 },
    { name: 'Wed', Revenue: 11000, Tasks: 8, Efficiency: 85 },
    { name: 'Thu', Revenue: 10500, Tasks: 9, Efficiency: 83 },
    { name: 'Fri', Revenue: 12500, Tasks: 12, Efficiency: 92 },
  ];

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    await onAddTask(newTitle, newPriority);
    setNewTitle('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard_view_container">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-sans font-medium tracking-tight text-zinc-900 dark:text-white">
            Executive Control Center
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Optivra OS autonomous operational dashboard • Active Organization: <span className="font-medium text-zinc-700 dark:text-zinc-200">{db.organizations[0]?.name || 'Optivra Global'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('brain')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white dark:text-zinc-950 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Query AI Brain
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Active Pipeline</span>
            <div className="text-2xl font-sans font-medium text-zinc-900 dark:text-white mt-1">$12,500/mo</div>
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +15% from last month
            </span>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Action Items</span>
            <div className="text-2xl font-sans font-medium text-zinc-900 dark:text-white mt-1">{pendingTasks.length} Pending</div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
              {completedTasks.length} tasks completed this week
            </span>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Inbox Insights</span>
            <div className="text-2xl font-sans font-medium text-zinc-900 dark:text-white mt-1">{unreadEmails.length} Unread</div>
            <span className="text-xs text-amber-500 font-medium flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" />
              1 high-priority inquiry
            </span>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Meetings Today</span>
            <div className="text-2xl font-sans font-medium text-zinc-900 dark:text-white mt-1">
              {db.calendarEvents.filter(e => e.start.includes('2026-06-29')).length} Scheduled
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
              Prep briefs ready
            </span>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: AI Recommendations, Operations Flow, Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Analytics Chart & Task list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts card */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-zinc-900 dark:text-white">Business Intelligence Trends</h3>
                <p className="text-xs text-zinc-400">Real-time metric monitoring tracking platform revenue & efficiency scores</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#18181b', borderRadius: '8px', border: 'none', color: '#fff' }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="Efficiency" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEfficiency)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Core Action Tasks list */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-50 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-medium text-zinc-900 dark:text-white">Core Action Checklist</h3>
                <p className="text-xs text-zinc-400">Current high-priority operations assigned to executive members</p>
              </div>
            </div>

            {/* Simple Task Creator */}
            <form onSubmit={handleCreateTaskSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Log a new operational task..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-all"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg text-sm hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
              >
                Add
              </button>
            </form>

            {/* Tasks list */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {db.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer"
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          task.status === 'completed'
                            ? 'text-emerald-500 fill-emerald-50'
                            : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                    <div>
                      <h4
                        className={`text-sm font-medium ${
                          task.status === 'completed'
                            ? 'line-through text-zinc-400'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        task.priority === 'high'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          : task.priority === 'medium'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs text-zinc-400">{task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: AI Daily Recommendations & Upcoming events */}
        <div className="space-y-6">
          {/* AI Recommendations */}
          <div className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-zinc-950 dark:to-black text-white border border-zinc-800 rounded-2xl space-y-4 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-base font-medium">Optivra AI COO Insights</h3>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Analyzing organization knowledge bases, inbox payloads, and active schedule profiles. Recommend these core automated transactions:
            </p>

            <div className="space-y-3 pt-2">
              <div
                onClick={() => onNavigate('email')}
                className="p-3 bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-all rounded-xl cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-400">Email Draft Ready</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-zinc-300 mt-1 font-medium">Approve reply to Charles Miller (Acme Corp)</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">SLA verification draft generated • High response confidence</p>
              </div>

              <div
                onClick={() => onNavigate('proposals')}
                className="p-3 bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-all rounded-xl cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-400">Contract Ready</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-zinc-300 mt-1 font-medium">Acme Enterprise proposal ready to send</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Custom layout includes scope, deliverables, timeline & pricing metrics</p>
              </div>

              <div
                onClick={() => onNavigate('meetings')}
                className="p-3 bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-all rounded-xl cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-400">Knowledge Ingestion</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-zinc-300 mt-1 font-medium">Save "Platform Kickoff" recap to KB</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Ingest extracted decisions into corporate search memory graph</p>
              </div>
            </div>
          </div>

          {/* Upcoming Schedule agenda brief */}
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-800 pb-2">
              <h3 className="text-base font-medium text-zinc-900 dark:text-white">Upcoming Events Agenda</h3>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-all font-medium"
              >
                View Calendar
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate w-36">{ev.title}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{ev.description}</p>
                  {ev.prepNotes && (
                    <div className="text-[10px] bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg text-zinc-600 dark:text-zinc-300 border-l-2 border-amber-500">
                      <strong>AI Prep Note:</strong> {ev.prepNotes.split('\n')[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
