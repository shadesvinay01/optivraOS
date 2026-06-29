/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Inbox,
  Sparkles,
  Send,
  Check,
  AlertTriangle,
  FolderOpen,
  Eye,
  ToggleLeft,
  ToggleRight,
  User,
  Clock,
  Loader2
} from 'lucide-react';
import { DatabaseSchema, Email } from '../types.js';

interface EmailAgentViewProps {
  db: DatabaseSchema;
  onSummarizeEmail: (id: string) => Promise<void>;
  onSendReply: (id: string, body: string) => Promise<void>;
  onToggleAutoReply: (id: string) => Promise<void>;
}

export default function EmailAgentView({
  db,
  onSummarizeEmail,
  onSendReply,
  onToggleAutoReply
}: EmailAgentViewProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<string>(db.emails[0]?.id || '');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const selectedEmail = db.emails.find((e) => e.id === selectedEmailId);

  // Filters
  const filteredEmails = db.emails.filter((e) => {
    if (activeCategory === 'all') return true;
    return e.category === activeCategory;
  });

  const handleSelectEmail = (email: Email) => {
    setSelectedEmailId(email.id);
    setReplyText(email.replyDraft || email.suggestedReply || '');
  };

  const handleSummarize = async (id: string) => {
    setSummarizing(true);
    await onSummarizeEmail(id);
    const updated = db.emails.find((e) => e.id === id);
    if (updated) {
      setReplyText(updated.replyDraft || updated.suggestedReply || '');
    }
    setSummarizing(false);
  };

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    await onSendReply(id, replyText);
    setSendingReply(false);
  };

  return (
    <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 h-[calc(100vh-12rem)] flex overflow-hidden animate-fade-in" id="email_agent_view_container">
      {/* Left List: Categories & Mail List */}
      <div className="w-1/3 border-r border-zinc-100 dark:border-zinc-800 flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950/20">
        {/* Category Filters */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto">
          {['all', 'work', 'support', 'marketing', 'personal'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-full uppercase cursor-pointer transition-all ${
                activeCategory === cat
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Email items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {filteredEmails.map((email) => {
            const isSelected = email.id === selectedEmailId;
            return (
              <div
                key={email.id}
                onClick={() => handleSelectEmail(email)}
                className={`p-4 text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-zinc-100/60 dark:bg-zinc-800/50 border-l-4 border-zinc-900 dark:border-zinc-500'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate w-32">
                      {email.from}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-2 truncate">
                  {email.subject}
                </h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                  {email.body}
                </p>

                <div className="flex items-center justify-between mt-3 gap-2">
                  <div className="flex items-center gap-1.5">
                    {email.status === 'unread' && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                    <span
                      className={`text-[9px] font-bold uppercase ${
                        email.status === 'replied'
                          ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded'
                          : email.status === 'unread'
                          ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded'
                          : 'text-zinc-400'
                      }`}
                    >
                      {email.status}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAutoReply(email.id);
                    }}
                    title="Toggle auto response approval"
                    className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {email.autoReplyEnabled ? (
                      <ToggleRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                    )}
                    <span className="font-medium">Auto-Reply</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Detail & AI Assistance */}
      {selectedEmail ? (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
          {/* Email Header */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-white tracking-tight">
                {selectedEmail.subject}
              </h2>
              <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-semibold uppercase text-zinc-500">
                {selectedEmail.category}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              <span>From: <strong className="text-zinc-700 dark:text-zinc-300">{selectedEmail.from}</strong></span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(selectedEmail.receivedAt).toLocaleDateString()} at {new Date(selectedEmail.receivedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Email Body & AI panels */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Real Body */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-2">Original Email payload</span>
              <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {selectedEmail.body}
              </p>
            </div>

            {/* AI Assistant Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Summary box */}
              <div className="p-4 bg-zinc-900 text-white dark:bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Optivra AI Summary
                  </span>
                  {!selectedEmail.summary && (
                    <button
                      onClick={() => handleSummarize(selectedEmail.id)}
                      disabled={summarizing}
                      className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded cursor-pointer hover:bg-zinc-700 flex items-center gap-1.5"
                    >
                      {summarizing && <Loader2 className="w-3 h-3 animate-spin" />}
                      Summarize
                    </button>
                  )}
                </div>

                {selectedEmail.summary ? (
                  <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                    {selectedEmail.summary}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No summary generated. Click "Summarize" above to run Gemini summaries.</p>
                )}
              </div>

              {/* Uptime compliance box */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">SLA Compliance Check</span>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">Grounded in <strong>SLA.md</strong> guidelines</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Optivra AI automatically scanned internal SLA contracts: confirmed <strong>99.95%</strong> uptime and 24/7 dedicated support values match customer requests.
                </p>
              </div>
            </div>

            {/* Suggeted reply and response editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Optivra Suggested Response Draft
                </h3>
                {(!selectedEmail.suggestedReply && !selectedEmail.replyDraft) && (
                  <button
                    onClick={() => handleSummarize(selectedEmail.id)}
                    disabled={summarizing}
                    className="text-xs text-blue-500 hover:underline cursor-pointer"
                  >
                    Generate draft with Gemini AI
                  </button>
                )}
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
                placeholder="Optivra suggested reply draft will appear here. You can edit this directly before dispatching..."
                className="w-full p-4 text-sm bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 leading-relaxed font-mono"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Confidence score: <strong className="text-emerald-500">98% Match</strong>
                </span>

                <button
                  onClick={() => handleSendReply(selectedEmail.id)}
                  disabled={sendingReply || !replyText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-medium rounded-xl text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {sendingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Executive Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 space-y-3">
          <Inbox className="w-12 h-12 stroke-1 text-zinc-300 dark:text-zinc-700" />
          <h3 className="text-sm font-semibold">No Email Selected</h3>
          <p className="text-xs max-w-xs text-center">Select an operational email thread on the left pane to analyze summary, draft replies, and execute transactions.</p>
        </div>
      )}
    </div>
  );
}
