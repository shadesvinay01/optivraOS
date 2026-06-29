/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';

// Load env variables
import 'dotenv/config';

import {
  readDb,
  writeDb,
  addAuditLog,
  DatabaseSchema
} from './server/db.js';

import {
  generateBrainResponse,
  summarizeEmail,
  analyzeMeeting,
  generateProposal,
  queryKnowledge,
  getGeminiClient
} from './server/gemini.js';

import {
  User,
  Task,
  Email,
  CalendarEvent,
  MeetingIntel,
  KnowledgeDoc,
  Proposal,
  SystemSetting,
  ChatMessage
} from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes FIRST

// 1. Core Database Fetch
app.get('/api/db', (req, res) => {
  try {
    const db = readDb();
    res.json(db);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve system database' });
  }
});

// 2. Chat with AI Brain (Agents Coordinator)
app.post('/api/brain/chat', async (req, res) => {
  const { messages, query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const db = readDb();
    
    // Call Gemini orchestrator
    const aiResponse = await generateBrainResponse(messages || [], query);

    // Save user message
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString()
    };

    // Save assistant message with thought and delegation
    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}_a`,
      sender: 'assistant',
      text: aiResponse.text,
      timestamp: new Date().toISOString(),
      reasoning: aiResponse.thought,
      agentDelegated: aiResponse.delegate
    };

    db.chatHistory.push(userMsg, assistantMsg);
    
    // Log AI activity
    addAuditLog(
      'usr_1',
      'Sarveshwar',
      `Brain agent: ${aiResponse.delegate.toUpperCase()} delegation`,
      `Executed thought process: "${aiResponse.thought.substring(0, 100)}..."`,
      aiResponse.delegate === 'brain' ? 'brain' : aiResponse.delegate
    );

    writeDb(db);
    res.json({ response: assistantMsg, chatHistory: db.chatHistory });
  } catch (error) {
    console.error('API /api/brain/chat error:', error);
    res.status(500).json({ error: 'AI Brain was unable to process query.' });
  }
});

// Clear Chat History
app.post('/api/brain/clear', (req, res) => {
  try {
    const db = readDb();
    db.chatHistory = [
      {
        id: 'chat_init',
        sender: 'assistant',
        text: 'System memory flushed. Optivra AI Brain is initialized and ready to coordinate organizational tasks. How can I assist you as AI COO today?',
        timestamp: new Date().toISOString(),
        agentDelegated: 'brain'
      }
    ];
    writeDb(db);
    addAuditLog('usr_1', 'Sarveshwar', 'Chat Memory Flushed', 'Cleared all previous conversation messages.', 'brain');
    res.json({ status: 'ok', chatHistory: db.chatHistory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// 3. Email Agent replies and approvals
app.post('/api/emails/:id/summarize', async (req, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const emailIndex = db.emails.findIndex((e) => e.id === id);
    if (emailIndex === -1) return res.status(404).json({ error: 'Email not found' });

    const email = db.emails[emailIndex];
    const intelligence = await summarizeEmail(email.from, email.subject, email.body);

    db.emails[emailIndex].summary = intelligence.summary;
    db.emails[emailIndex].suggestedReply = intelligence.suggestedReply;
    db.emails[emailIndex].replyDraft = intelligence.suggestedReply; // set draft editable by user

    writeDb(db);
    res.json({ email: db.emails[emailIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to summarize email' });
  }
});

app.post('/api/emails/:id/reply', (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Reply body is required' });

  try {
    const db = readDb();
    const emailIndex = db.emails.findIndex((e) => e.id === id);
    if (emailIndex === -1) return res.status(404).json({ error: 'Email not found' });

    const email = db.emails[emailIndex];
    // Set status to replied and save draft
    db.emails[emailIndex].status = 'replied';
    db.emails[emailIndex].replyDraft = body;

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Send Email Reply',
      `Replied to ${email.from} regarding "${email.subject}". Reply: "${body.substring(0, 80)}..."`,
      'email'
    );

    writeDb(db);
    res.json({ status: 'ok', email: db.emails[emailIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process email reply' });
  }
});

app.post('/api/emails/:id/auto-reply-toggle', (req, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const emailIndex = db.emails.findIndex((e) => e.id === id);
    if (emailIndex === -1) return res.status(404).json({ error: 'Email not found' });

    const currentVal = db.emails[emailIndex].autoReplyEnabled;
    db.emails[emailIndex].autoReplyEnabled = !currentVal;

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Auto-reply Toggled',
      `Toggled auto-response approval status for email thread from ${db.emails[emailIndex].from} to ${!currentVal}`,
      'email'
    );

    writeDb(db);
    res.json({ status: 'ok', email: db.emails[emailIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle auto-reply' });
  }
});

// 4. Calendar Agent - Booking and Conflict Resolving
app.post('/api/calendar/schedule', (req, res) => {
  const { title, description, start, end, location, attendees, calendarType } = req.body;
  if (!title || !start || !end) {
    return res.status(400).json({ error: 'Title, start time, and end time are required' });
  }

  try {
    const db = readDb();

    // Check for scheduling conflict
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    
    let conflictSolved = true;
    const conflicts = db.calendarEvents.filter((ev) => {
      const s = new Date(ev.start).getTime();
      const e = new Date(ev.end).getTime();
      return (startMs >= s && startMs < e) || (endMs > s && endMs <= e) || (startMs <= s && endMs >= e);
    });

    if (conflicts.length > 0) {
      conflictSolved = false; // System notes there is a clash to solve
    }

    const newEvent: CalendarEvent = {
      id: `cal_${Date.now()}`,
      title,
      description: description || '',
      start,
      end,
      location: location || 'Zoom Virtual Room',
      organizer: 'sarveshwar.ds.01@gmail.com',
      attendees: attendees || ['sarveshwar.ds.01@gmail.com'],
      calendarType: calendarType || 'google',
      conflictSolved: conflictSolved,
      prepNotes: `Auto-generated Preparation Note:\nSync session booked on ${calendarType || 'google'} Calendar. No conflicts identified.`
    };

    if (!conflictSolved) {
      newEvent.prepNotes = `🚨 CONFLICT DETECTED:\nClash identified with event "${conflicts[0].title}". Optivra AI solver is active. Advise rescheduling to 1 hour later.`;
    }

    db.calendarEvents.push(newEvent);
    
    // Log scheduling action
    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Book Calendar Event',
      `Scheduled "${title}" (${start} to ${end}). Conflict Solved: ${conflictSolved}`,
      'calendar'
    );

    writeDb(db);
    res.json({ event: newEvent, conflicts: conflicts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule event' });
  }
});

// Update prep notes with AI assistance
app.post('/api/calendar/:id/prep', async (req, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const evIndex = db.calendarEvents.findIndex((e) => e.id === id);
    if (evIndex === -1) return res.status(404).json({ error: 'Event not found' });

    const ev = db.calendarEvents[evIndex];
    
    // Call Gemini to prepare meeting brief notes
    const client = getGeminiClient();
    let prompt = `Prepare an advanced 3-bullet meeting brief and checklist for: "${ev.title}". Description: "${ev.description}". Organizer: "${ev.organizer}". Attendees: ${ev.attendees.join(', ')}.`;
    
    let prepText = '';
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are the Calendar Agent for Optivra OS. Generate structured, concise, professional bullet points to prepare an executive for this calendar event.'
        }
      });
      prepText = response.text || '';
    } else {
      prepText = `- **Strategic Goal:** Align operational tasks and check delivery milestones.\n- **Preparation Action:** Read the Q3 contract and verify customer service queries.\n- **Discussion Checklist:**\n  - [ ] SLA guarantee of 99.95% uptime\n  - [ ] Timelines for week 1 deployments\n  - [ ] Onboarding fees`;
    }

    db.calendarEvents[evIndex].prepNotes = prepText;
    writeDb(db);
    res.json({ event: db.calendarEvents[evIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate prep notes' });
  }
});

// 5. Meeting Intelligence and transcript analysis
app.post('/api/meetings/analyze', async (req, res) => {
  const { title, transcript, duration } = req.body;
  if (!title || !transcript) {
    return res.status(400).json({ error: 'Title and Transcript are required' });
  }

  try {
    const db = readDb();

    // Call Gemini meeting agent
    const intel = await analyzeMeeting(title, transcript);

    const newMeetingIntel: MeetingIntel = {
      id: `mtg_${Date.now()}`,
      title,
      date: new Date().toISOString().split('T')[0],
      duration: duration || '30 mins',
      transcript,
      summary: intel.summary,
      decisions: intel.decisions || [],
      actionItems: (intel.actionItems || []).map((item: any, i: number) => ({
        id: `act_${Date.now()}_${i}`,
        text: item.text,
        owner: item.owner || 'Unassigned',
        status: 'pending' as const
      })),
      emailRecapSent: false,
      savedToKnowledgeBase: false
    };

    db.meetings.unshift(newMeetingIntel);

    // Auto-create standard tasks in tasks list for each action item extracted!
    newMeetingIntel.actionItems.forEach((act) => {
      const assignee = db.users.find((u) => u.name.toLowerCase().includes(act.owner.toLowerCase()));
      const newTask: Task = {
        id: `tsk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: `[Action Item] ${act.text}`,
        description: `Extracted from meeting "${title}" on ${newMeetingIntel.date}. Owner assigned: ${act.owner}.`,
        status: 'pending',
        assigneeId: assignee ? assignee.id : 'usr_1', // default assignee
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        priority: 'medium'
      };
      db.tasks.push(newTask);
    });

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Analyze Meeting Transcript',
      `Processed transcript for "${title}". Extracted ${intel.decisions?.length} decisions, ${intel.actionItems?.length} tasks, and auto-generated action item tracker list.`,
      'meetings'
    );

    writeDb(db);
    res.json({ meeting: newMeetingIntel, tasks: db.tasks });
  } catch (error) {
    console.error('API /api/meetings/analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze meeting transcript' });
  }
});

// Trigger email recap for meeting
app.post('/api/meetings/:id/recap', (req, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const index = db.meetings.findIndex((m) => m.id === id);
    if (index === -1) return res.status(404).json({ error: 'Meeting not found' });

    db.meetings[index].emailRecapSent = true;
    
    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Email Meeting Recap',
      `Sent email summary and action item breakdown for meeting "${db.meetings[index].title}" to all team members and clients.`,
      'meetings'
    );

    writeDb(db);
    res.json({ status: 'ok', meeting: db.meetings[index] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger email recap' });
  }
});

// Save meeting summary to knowledge base
app.post('/api/meetings/:id/save-kb', (req, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const index = db.meetings.findIndex((m) => m.id === id);
    if (index === -1) return res.status(404).json({ error: 'Meeting not found' });

    const meeting = db.meetings[index];
    db.meetings[index].savedToKnowledgeBase = true;

    // Create KB document
    const kbDoc: KnowledgeDoc = {
      id: `doc_${Date.now()}`,
      name: `Summary: ${meeting.title} (${meeting.date})`,
      type: 'md',
      content: `# Meeting Summary: ${meeting.title}\nDate: ${meeting.date}\nDuration: ${meeting.duration}\n\n## Discussion Summary\n${meeting.summary}\n\n## Decisions Approved\n${meeting.decisions.map(d => `- ${d}`).join('\n')}\n\n## Extracted Action Items\n${meeting.actionItems.map(a => `- **${a.owner}**: ${a.text}`).join('\n')}`,
      uploadedAt: new Date().toISOString(),
      size: '1.2 KB',
      category: 'operations',
      version: 1,
      accessControl: 'all'
    };

    db.knowledgeDocs.push(kbDoc);

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Export Meeting to KB',
      `Saved briefing summary of "${meeting.title}" directly to company knowledge base as a grounded document.`,
      'meetings'
    );

    writeDb(db);
    res.json({ status: 'ok', meeting: db.meetings[index], document: kbDoc });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save to knowledge base' });
  }
});

// 6. Knowledge Base Actions
app.post('/api/knowledge/upload', (req, res) => {
  const { name, type, content, category, accessControl } = req.body;
  if (!name || !content) {
    return res.status(400).json({ error: 'Name and content are required' });
  }

  try {
    const db = readDb();
    const sizeInBytes = Buffer.byteLength(content, 'utf8');
    const sizeStr = sizeInBytes > 1024 ? `${(sizeInBytes / 1024).toFixed(1)} KB` : `${sizeInBytes} Bytes`;

    const newDoc: KnowledgeDoc = {
      id: `doc_${Date.now()}`,
      name,
      type: type || 'md',
      content,
      uploadedAt: new Date().toISOString(),
      size: sizeStr,
      category: category || 'general',
      version: 1,
      accessControl: accessControl || 'all'
    };

    db.knowledgeDocs.push(newDoc);

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Upload Document',
      `Added "${name}" (${sizeStr}) under category "${category}". Secured under role access control.`,
      'knowledge'
    );

    writeDb(db);
    res.json({ document: newDoc });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

app.post('/api/knowledge/query', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    const response = await queryKnowledge(question);
    
    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Knowledge Semantic Query',
      `Searched knowledge graph for: "${question.substring(0, 50)}...". Found citations: ${response.citations.join(', ') || 'None'}`,
      'knowledge'
    );

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to query company knowledge base' });
  }
});

// DELETE Document
app.delete('/api/knowledge/:id', (req, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const docIndex = db.knowledgeDocs.findIndex((d) => d.id === id);
    if (docIndex === -1) return res.status(404).json({ error: 'Document not found' });

    const docName = db.knowledgeDocs[docIndex].name;
    db.knowledgeDocs.splice(docIndex, 1);

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Delete Document',
      `Removed document "${docName}" from knowledge base.`,
      'knowledge'
    );

    writeDb(db);
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// 7. Proposal Generator Actions
app.post('/api/proposals/generate', async (req, res) => {
  const { clientName, requirements, pricingStrategy } = req.body;
  if (!clientName || !requirements) {
    return res.status(400).json({ error: 'Client Name and core requirements are required' });
  }

  try {
    const db = readDb();
    const draft = await generateProposal(clientName, requirements, pricingStrategy);

    const newProposal: Proposal = {
      id: `prop_${Date.now()}`,
      title: draft.title || `Service Agreement - ${clientName}`,
      clientName,
      scope: draft.scope,
      deliverables: draft.deliverables || [],
      timeline: draft.timeline || '3 weeks',
      milestones: draft.milestones || [],
      pricing: draft.pricing || '$10,000 / month flat',
      terms: draft.terms || 'Net 30. SLA standards active.',
      branding: {
        logoText: `Optivra x ${clientName.substring(0, 10)}`,
        primaryColor: '#0f172a',
        accentColor: '#3b82f6'
      },
      status: 'generated',
      createdAt: new Date().toISOString()
    };

    db.proposals.push(newProposal);

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Draft Proposal Created',
      `Auto-generated high-fidelity contract for "${clientName}". Scope: "${draft.scope.substring(0, 100)}..."`,
      'proposals'
    );

    writeDb(db);
    res.json({ proposal: newProposal });
  } catch (error) {
    console.error('API /api/proposals/generate error:', error);
    res.status(500).json({ error: 'Failed to auto-draft proposal' });
  }
});

app.put('/api/proposals/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const db = readDb();
    const index = db.proposals.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Proposal not found' });

    db.proposals[index] = {
      ...db.proposals[index],
      ...updateData
    };

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Update Proposal Details',
      `Updated scope/pricing details for customized proposal: "${db.proposals[index].title}"`,
      'proposals'
    );

    writeDb(db);
    res.json({ proposal: db.proposals[index] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

app.delete('/api/proposals/:id', (req, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const index = db.proposals.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Proposal not found' });

    const title = db.proposals[index].title;
    db.proposals.splice(index, 1);

    addAuditLog('usr_1', 'Sarveshwar', 'Delete Proposal', `Removed proposal brief: "${title}"`, 'proposals');
    writeDb(db);
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete proposal' });
  }
});

// 8. Task Actions
app.post('/api/tasks/create', (req, res) => {
  const { title, description, priority, dueDate, assigneeId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const db = readDb();
    const newTask: Task = {
      id: `tsk_${Date.now()}`,
      title,
      description: description || '',
      status: 'pending',
      priority: priority || 'medium',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      assigneeId: assigneeId || 'usr_1'
    };

    db.tasks.unshift(newTask);

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Create Standard Task',
      `Added task "${title}" to list. Priority: ${priority}. Assignee: ${assigneeId || 'usr_1'}`,
      'dashboard'
    );

    writeDb(db);
    res.json({ task: newTask });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.post('/api/tasks/:id/toggle', (req, res) => {
  const { id } = req.params;
  try {
    const db = readDb();
    const index = db.tasks.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: 'Task not found' });

    const currentStatus = db.tasks[index].status;
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    db.tasks[index].status = nextStatus;

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Task Progress Update',
      `Toggled task "${db.tasks[index].title}" status to "${nextStatus}".`,
      'dashboard'
    );

    writeDb(db);
    res.json({ status: 'ok', task: db.tasks[index] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

// 9. Update Configuration Settings
app.post('/api/settings/update', (req, res) => {
  const { currentAIPrompt, modelName, autoEmailApproval } = req.body;
  try {
    const db = readDb();
    if (db.settings.length === 0) {
      db.settings.push({
        id: 'set_1',
        currentAIPrompt: currentAIPrompt || '',
        modelName: modelName || 'gemini-3.5-flash',
        apiKeyConfigured: !!process.env.GEMINI_API_KEY,
        autoEmailApproval: !!autoEmailApproval
      });
    } else {
      db.settings[0] = {
        ...db.settings[0],
        currentAIPrompt: currentAIPrompt !== undefined ? currentAIPrompt : db.settings[0].currentAIPrompt,
        modelName: modelName !== undefined ? modelName : db.settings[0].modelName,
        autoEmailApproval: autoEmailApproval !== undefined ? autoEmailApproval : db.settings[0].autoEmailApproval,
        apiKeyConfigured: !!process.env.GEMINI_API_KEY
      };
    }

    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Update AI Settings',
      `Configured Prompt settings. Model: "${db.settings[0].modelName}". Prompt version updated. Approval Mode: ${db.settings[0].autoEmailApproval}`,
      'settings'
    );

    writeDb(db);
    res.json({ settings: db.settings[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

// Upgrade Subscription Simulator (Stripe integration)
app.post('/api/subscription/simulate', (req, res) => {
  try {
    addAuditLog(
      'usr_1',
      'Sarveshwar',
      'Stripe Subscription Active',
      'Successfully simulated card transaction and subscribed to Optivra OS Pro SaaS Tier ($12,500/mo billed annually). Key activated.',
      'settings'
    );
    res.json({ status: 'ok', message: 'Stripe subscription active!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run checkout' });
  }
});

// Get Audit Logs
app.get('/api/audit-logs', (req, res) => {
  try {
    const db = readDb();
    res.json(db.auditLogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch log streams' });
  }
});


// Vite Dev Server Middleware or Production static folder
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Optivra OS server booting successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
