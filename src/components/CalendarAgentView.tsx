/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Plus,
  Loader2,
  BookOpen
} from 'lucide-react';
import { DatabaseSchema, CalendarEvent } from '../types.js';

interface CalendarAgentViewProps {
  db: DatabaseSchema;
  onScheduleEvent: (eventData: any) => Promise<any>;
  onGeneratePrepNotes: (id: string) => Promise<void>;
}

export default function CalendarAgentView({
  db,
  onScheduleEvent,
  onGeneratePrepNotes
}: CalendarAgentViewProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(db.calendarEvents[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('2026-06-29T15:00:00');
  const [end, setEnd] = useState('2026-06-29T16:00:00');
  const [location, setLocation] = useState('Zoom Conference room');
  const [attendees, setAttendees] = useState('sarveshwar.ds.01@gmail.com, sophia.chen@optivra.co');
  const [calendarType, setCalendarType] = useState<'google' | 'outlook'>('google');
  
  const [submitting, setSubmitting] = useState(false);
  const [prepping, setPrepping] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: 'success' | 'warning', text: string } | null>(null);

  const selectedEvent = db.calendarEvents.find((e) => e.id === selectedEventId);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !start || !end) return;
    setSubmitting(true);
    setBookingMessage(null);

    const attendeesList = attendees.split(',').map((a) => a.trim()).filter((a) => a);

    try {
      const res = await onScheduleEvent({
        title,
        description,
        start,
        end,
        location,
        attendees: attendeesList,
        calendarType
      });

      if (res.conflicts && res.conflicts.length > 0) {
        setBookingMessage({
          type: 'warning',
          text: `Event "${title}" booked successfully, but a conflict is identified with overlapping event "${res.conflicts[0].title}".`
        });
      } else {
        setBookingMessage({
          type: 'success',
          text: `Event "${title}" scheduled and indexed without any scheduling conflicts!`
        });
      }

      // Reset
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrepNotes = async (id: string) => {
    setPrepping(true);
    await onGeneratePrepNotes(id);
    setPrepping(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] animate-fade-in" id="calendar_agent_view_container">
      {/* Left panel: Daily Agenda list */}
      <div className="lg:col-span-2 border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 flex flex-col h-full overflow-hidden">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-zinc-500" />
            Agenda Schedule
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Check operational sync schedules. Click on any block to prepare briefing notes.
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
          {db.calendarEvents.map((ev) => {
            const isSelected = ev.id === selectedEventId;
            const hasConflict = !ev.conflictSolved;
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-900 dark:border-zinc-500 shadow-sm'
                    : 'bg-white border-zinc-100 hover:border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{ev.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{ev.description}</p>
                  </div>

                  <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-600 dark:text-zinc-300 font-mono flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-zinc-400 border-t border-zinc-50 dark:border-zinc-800/50 pt-2.5">
                  <span className="flex items-center gap-1 truncate w-40">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    {ev.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    {ev.attendees.length} Attendees
                  </span>
                  <span className="capitalize font-semibold text-[10px] text-zinc-500">
                    {ev.calendarType} Calendar
                  </span>
                </div>

                {hasConflict && (
                  <div className="mt-3 p-2 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-700 flex items-start gap-1.5 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Overlap clash:</strong> A meeting schedule conflict was detected for this block. Recommend checking conflict-solving alternatives.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: Booking Wizard & AI Briefs */}
      <div className="space-y-6 flex flex-col h-full overflow-hidden">
        {/* Selected Event Brief briefing notes */}
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white p-6 space-y-4 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Optivra Meeting Preparation
            </h3>
            {selectedEvent && (
              <button
                onClick={() => handlePrepNotes(selectedEvent.id)}
                disabled={prepping}
                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 transition-all text-zinc-300 px-2 py-1 rounded cursor-pointer flex items-center gap-1"
              >
                {prepping && <Loader2 className="w-3 h-3 animate-spin" />}
                Sync Prep Brief
              </button>
            )}
          </div>

          {selectedEvent ? (
            <div className="space-y-3">
              <div className="border-l-2 border-amber-500 pl-3">
                <h4 className="text-xs font-semibold text-zinc-100">{selectedEvent.title}</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">{selectedEvent.description}</p>
              </div>

              {selectedEvent.prepNotes ? (
                <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto pr-1 bg-zinc-800/30 p-3 rounded-lg border border-zinc-800/80 font-mono">
                  {selectedEvent.prepNotes}
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic">No prep brief notes compiled. Click "Sync Prep Brief" to generate using Gemini context grounding.</div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">Select an agenda session from the left schedule to view preparation intelligence briefs.</p>
          )}
        </div>

        {/* Schedule event Wizard form */}
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 flex-1 flex flex-col overflow-hidden">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3 shrink-0">
            AI-Assisted Scheduling Wizard
          </h3>

          <form onSubmit={handleBooking} className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 text-left">
            {bookingMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-1.5 ${
                  bookingMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
                    : 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400'
                }`}
              >
                {bookingMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{bookingMessage.text}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Event Title</label>
              <input
                type="text"
                required
                placeholder="Product Align Sync..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Brief Scope Description</label>
              <textarea
                placeholder="Details of what is to be resolved..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Location / URL</label>
              <input
                type="text"
                placeholder="Google Meet Link or HQ Room A..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Attendees (comma-separated)</label>
              <input
                type="text"
                placeholder="sarveshwar.ds.01@gmail.com, team@optivra.co..."
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-50 dark:border-zinc-800/60 mt-4 shrink-0">
              <div className="flex gap-2">
                {['google', 'outlook'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCalendarType(type as any)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md cursor-pointer ${
                      calendarType === type
                        ? 'bg-zinc-900 dark:bg-zinc-800 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-medium rounded-lg text-xs hover:bg-zinc-850 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Schedule Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
