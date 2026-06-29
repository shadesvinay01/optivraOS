/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Clock,
  Sparkles,
  CheckCircle,
  FileText,
  Mail,
  ListCollapse,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { DatabaseSchema, MeetingIntel } from '../types.js';

interface MeetingsViewProps {
  db: DatabaseSchema;
  onAnalyzeTranscript: (title: string, transcript: string, duration?: string) => Promise<void>;
  onSendRecap: (id: string) => Promise<void>;
  onSaveToKnowledgeBase: (id: string) => Promise<void>;
}

const SAMPLE_TRANSCRIPT = `Sarveshwar: Thanks for joining. Let's align on our Acme Corp custom SLA integration. Sophia, what support coverage are we looking at?
Sophia Chen: For severe outages, we need 15 minutes response SLA on 24/7 dedicated coverage. I can coordinate the support staff standby.
Marcus Thompson: That works. Charles Miller from Acme Corp also requested that we finalize the pricing milestones and scope timeline.
Sarveshwar: Understood. I will draft the timeline milestones and pricing clauses in the custom Proposal Builder. Sophia, please confirm the technical indexing guidelines for the files.
Sophia Chen: Yes, I will verify that the upload folder structure chunking index is verified and fully functional.
Sarveshwar: Excellent. Let's wrap up this alignment session.`;

export default function MeetingsView({
  db,
  onAnalyzeTranscript,
  onSendRecap,
  onSaveToKnowledgeBase
}: MeetingsViewProps) {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(db.meetings[0]?.id || '');
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('30 mins');
  const [newTranscript, setNewTranscript] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailRecaping, setEmailRecaping] = useState<string | null>(null);
  const [savingKb, setSavingKb] = useState<string | null>(null);

  const selectedMeeting = db.meetings.find((m) => m.id === selectedMeetingId);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTranscript.trim()) return;
    setSubmitting(true);
    try {
      await onAnalyzeTranscript(newTitle, newTranscript, newDuration);
      setNewTitle('');
      setNewTranscript('');
      // Auto-select newly created meeting
      if (db.meetings.length > 0) {
        setSelectedMeetingId(db.meetings[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrePopulate = () => {
    setNewTitle('Acme SLA & Pricing Scope Sync');
    setNewDuration('20 mins');
    setNewTranscript(SAMPLE_TRANSCRIPT);
  };

  const handleRecap = async (id: string) => {
    setEmailRecaping(id);
    await onSendRecap(id);
    setEmailRecaping(null);
  };

  const handleSaveKb = async (id: string) => {
    setSavingKb(id);
    await onSaveToKnowledgeBase(id);
    setSavingKb(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] animate-fade-in" id="meetings_view_container">
      {/* Left panel: Past meetings database */}
      <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 flex flex-col h-full overflow-hidden">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-500" />
            Meeting Intelligence Records
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Access past discussions. Review Gemini-extracted summaries, tasks, and action assignments.
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-3 pt-4 pr-1">
          {db.meetings.map((m) => {
            const isSelected = m.id === selectedMeetingId;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMeetingId(m.id)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-900 dark:border-zinc-500 shadow-sm'
                    : 'bg-white border-zinc-100 hover:border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate w-44">{m.title}</h3>
                  <span className="text-[9px] bg-zinc-100 dark:bg-zinc-850 px-1.5 py-0.5 rounded text-zinc-400 font-mono font-bold shrink-0">
                    {m.duration}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  Concluded on {m.date}
                </p>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-3 pt-2.5 border-t border-zinc-50 dark:border-zinc-800/50">
                  <span className="font-semibold text-zinc-500">
                    {m.actionItems.length} Action Items
                  </span>
                  <div className="flex items-center gap-2">
                    {m.emailRecapSent && (
                      <span className="text-emerald-500 font-medium">Recap Sent</span>
                    )}
                    {m.savedToKnowledgeBase && (
                      <span className="text-blue-500 font-medium">KB Saved</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center panel: Selected Meeting details */}
      <div className="lg:col-span-1 border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 flex flex-col h-full overflow-hidden">
        {selectedMeeting ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden text-left">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight leading-snug">
                  {selectedMeeting.title}
                </h2>
                <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-bold uppercase text-zinc-500 shrink-0">
                  {selectedMeeting.duration}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Concluded on: {selectedMeeting.date}</p>
            </div>

            {/* Details details scroll area */}
            <div className="flex-1 overflow-y-auto space-y-5 pt-4 pr-1">
              {/* Summary */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                <span className="text-[9px] uppercase font-bold text-amber-500 flex items-center gap-1 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini Summary Insight
                </span>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {selectedMeeting.summary}
                </p>
              </div>

              {/* Decisions */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Approved Decisions</h3>
                <ul className="space-y-1.5">
                  {selectedMeeting.decisions.map((dec, i) => (
                    <li
                      key={i}
                      className="text-xs text-zinc-800 dark:text-zinc-200 flex items-start gap-2 bg-zinc-50/50 dark:bg-zinc-800/20 p-2.5 rounded-lg border border-zinc-100/50 dark:border-zinc-800/40"
                    >
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-1.5 shrink-0" />
                      <span>{dec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action items with owners */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Assigned Action Items</h3>
                <div className="space-y-2">
                  {selectedMeeting.actionItems.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/80 rounded-xl flex items-center justify-between"
                    >
                      <div className="space-y-0.5 pr-2">
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{act.text}</p>
                        <span className="text-[10px] text-zinc-400 font-medium">Assigned Owner: <strong>{act.owner}</strong></span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 font-semibold uppercase shrink-0">
                        {act.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2 grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={() => handleRecap(selectedMeeting.id)}
                disabled={emailRecaping === selectedMeeting.id || selectedMeeting.emailRecapSent}
                className="flex items-center justify-center gap-1.5 py-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium transition-all text-zinc-700 dark:text-zinc-200 cursor-pointer disabled:opacity-50"
              >
                {emailRecaping === selectedMeeting.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                {selectedMeeting.emailRecapSent ? 'Recap Sent' : 'Email recap'}
              </button>

              <button
                onClick={() => handleSaveKb(selectedMeeting.id)}
                disabled={savingKb === selectedMeeting.id || selectedMeeting.savedToKnowledgeBase}
                className="flex items-center justify-center gap-1.5 py-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium transition-all text-zinc-700 dark:text-zinc-200 cursor-pointer disabled:opacity-50"
              >
                {savingKb === selectedMeeting.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                {selectedMeeting.savedToKnowledgeBase ? 'Saved to KB' : 'Save to KB'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-2 p-4 text-center">
            <ListCollapse className="w-10 h-10 stroke-1" />
            <p className="text-xs">Select a concluded meeting brief to inspect AI outcomes.</p>
          </div>
        )}
      </div>

      {/* Right panel: Record & Analyze new Meeting */}
      <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 flex flex-col h-full overflow-hidden">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3 shrink-0">
          Analyze Concluded Discussion
        </h3>

        <form onSubmit={handleAnalyze} className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 text-left">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Meeting Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme SLA alignment briefing..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Duration Estimate</label>
            <select
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400"
            >
              <option value="15 mins">15 mins</option>
              <option value="20 mins">20 mins</option>
              <option value="30 mins">30 mins</option>
              <option value="45 mins">45 mins</option>
              <option value="60 mins">60 mins</option>
            </select>
          </div>

          <div className="space-y-1 flex-1 flex flex-col">
            <div className="flex justify-between items-center pb-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Discussion Transcript</label>
              <button
                type="button"
                onClick={handlePrePopulate}
                className="text-[10px] text-blue-500 hover:underline cursor-pointer"
              >
                Pre-populate Sample Script
              </button>
            </div>
            <textarea
              required
              placeholder="Paste dialogue transcripts here to parse decisions, action items, assign owners, and generate summary briefings..."
              value={newTranscript}
              onChange={(e) => setNewTranscript(e.target.value)}
              className="w-full flex-1 min-h-[14rem] p-3 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 font-mono leading-relaxed"
            />
          </div>

          <div className="pt-2 shrink-0">
            <button
              type="submit"
              disabled={submitting || !newTranscript.trim() || !newTitle.trim()}
              className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-medium rounded-xl text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-400" />
              )}
              Analyze with Optivra AI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
