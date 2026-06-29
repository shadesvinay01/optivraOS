/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import {
  User,
  UserRole,
  Organization,
  Team,
  Project,
  Task,
  Email,
  CalendarEvent,
  MeetingIntel,
  KnowledgeDoc,
  Proposal,
  AuditLog,
  SystemSetting,
  ChatMessage
} from '../src/types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  organizations: Organization[];
  teams: Team[];
  projects: Project[];
  tasks: Task[];
  emails: Email[];
  calendarEvents: CalendarEvent[];
  meetings: MeetingIntel[];
  knowledgeDocs: KnowledgeDoc[];
  proposals: Proposal[];
  auditLogs: AuditLog[];
  chatHistory: ChatMessage[];
  settings: SystemSetting[];
}

const defaultData: DatabaseSchema = {
  users: [
    {
      id: 'usr_1',
      name: 'Sarveshwar',
      email: 'sarveshwar.ds.01@gmail.com',
      role: UserRole.OWNER,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
    },
    {
      id: 'usr_2',
      name: 'Sophia Chen',
      email: 'sophia.chen@optivra.co',
      role: UserRole.ADMIN,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces'
    },
    {
      id: 'usr_3',
      name: 'Marcus Thompson',
      email: 'marcus.t@optivra.co',
      role: UserRole.MEMBER,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'
    }
  ],
  organizations: [
    {
      id: 'org_1',
      name: 'Optivra Global Inc.',
      industry: 'Enterprise Software & Artificial Intelligence',
      size: '50-200 Employees'
    }
  ],
  teams: [
    {
      id: 'team_1',
      orgId: 'org_1',
      name: 'Executive Operations',
      memberIds: ['usr_1', 'usr_2']
    },
    {
      id: 'team_2',
      orgId: 'org_1',
      name: 'Sales & Strategic Growth',
      memberIds: ['usr_3']
    }
  ],
  projects: [
    {
      id: 'prj_1',
      name: 'Optivra OS Launch',
      description: 'Preparing the core platform and pricing structure for global release.',
      status: 'active',
      teamId: 'team_1',
      ownerId: 'usr_1',
      dueDate: '2026-07-15'
    },
    {
      id: 'prj_2',
      name: 'Acme Enterprise Integration',
      description: 'Expanding the custom service deployment and service level contract for Acme.',
      status: 'active',
      teamId: 'team_2',
      ownerId: 'usr_3',
      dueDate: '2026-07-20'
    }
  ],
  tasks: [
    {
      id: 'tsk_1',
      projectId: 'prj_2',
      title: 'Review custom pricing for Acme proposal',
      description: 'Evaluate sales requirements and finalize timelines, scope, and SLA criteria before client review.',
      status: 'pending',
      assigneeId: 'usr_1',
      dueDate: '2026-07-01',
      priority: 'high'
    },
    {
      id: 'tsk_2',
      projectId: 'prj_1',
      title: 'Approve draft replies in Ops Inbox',
      description: 'Review the auto-generated responses suggested by the Email Agent and release them to customers.',
      status: 'pending',
      assigneeId: 'usr_2',
      dueDate: '2026-06-30',
      priority: 'medium'
    },
    {
      id: 'tsk_3',
      projectId: 'prj_1',
      title: 'Check Google Calendar for meeting overlap',
      description: 'Review the conflicting invitations received for Thursday morning and recommend a resolution.',
      status: 'pending',
      assigneeId: 'usr_1',
      dueDate: '2026-07-02',
      priority: 'low'
    },
    {
      id: 'tsk_4',
      projectId: 'prj_1',
      title: 'Finalize core pricing tiers with stripe',
      description: 'Setup API keys and map products to stripe subscription products.',
      status: 'completed',
      assigneeId: 'usr_1',
      dueDate: '2026-06-25',
      priority: 'high'
    }
  ],
  emails: [
    {
      id: 'em_1',
      from: 'charles.miller@acme.com',
      to: 'sarveshwar.ds.01@gmail.com',
      subject: 'Acme Enterprise Proposal Inquiry & Timeline Questions',
      body: 'Hi Sarveshwar,\n\nOur executive team reviewed the initial brief for the Optivra OS integration. We are very excited to move forward. However, we have a few questions regarding your Standard SLA. Can you confirm if you guarantee 99.95% uptime as stated? Also, we need to finalize this before the Q3 board meeting on July 5th. Could you send over a customized proposal with detailed deliverables, pricing, and terms by tomorrow?\n\nThanks,\nCharles Miller\nDirector of Operations, Acme Corp',
      receivedAt: '2026-06-29T08:30:00-07:00',
      summary: 'Charles Miller from Acme Corp requested a detailed, customized enterprise proposal by tomorrow. They queried if the Standard SLA guarantees 99.95% uptime and highlighted a hard deadline of July 5th (Q3 board meeting).',
      suggestedReply: 'Subject: Re: Acme Enterprise Proposal Inquiry & Timeline Questions\n\nDear Charles,\n\nThank you for reaching out. Yes, I can confirm that our Standard Enterprise SLA guarantees a 99.95% uptime with 24/7 dedicated support. We are currently preparing a comprehensive proposal for Acme Corp that outlines the detailed deliverables, milestones, timeline, and pricing structured specifically for your operations. I will send over the customized proposal doc for your review by tomorrow morning so you have ample time before your board meeting on July 5th.\n\nBest regards,\nSarveshwar\nCOO, Optivra OS',
      status: 'unread',
      category: 'work',
      autoReplyEnabled: true
    },
    {
      id: 'em_2',
      from: 'sophia.chen@optivra.co',
      to: 'sarveshwar.ds.01@gmail.com',
      subject: 'AI Engine Integration and Vector DB Indexes',
      body: 'Hey Sarveshwar,\n\nI have successfully optimized our retrieval pipelines using the native @google/genai SDK. The search latency is down to 80ms. I have also prepared draft guidelines for how the Knowledge base should index incoming PDF/Markdown files to compile semantic context chunks. Let me know when you have 10 minutes to review the index schema today.\n\nSophia',
      receivedAt: '2026-06-29T09:15:00-07:00',
      summary: 'Sophia Chen optimized the AI retrieval pipelines using the @google/genai SDK, reducing latency to 80ms, and drafted indexing guidelines for knowledge base document chunking. She requested a 10-minute review today.',
      suggestedReply: 'Subject: Re: AI Engine Integration and Vector DB Indexes\n\nGreat work on optimization, Sophia! 80ms latency is fantastic. I am free to review the schema and indexing guidelines today at 2:00 PM. I will send a quick calendar invite shortly.',
      status: 'unread',
      category: 'work',
      autoReplyEnabled: false
    },
    {
      id: 'em_3',
      from: 'newsletter@hacker-news.com',
      to: 'sarveshwar.ds.01@gmail.com',
      subject: 'Weekly Digest: Autonomous Agents and Relational State Sync',
      body: 'Discover the latest articles on vector search integration, Postgres-backed RAG engines, and custom prompt versioning frameworks compiled from top technology discussions this week.',
      receivedAt: '2026-06-28T18:00:00-07:00',
      summary: 'Hacker News newsletter compiling weekly digest of articles on autonomous agents, Postgres-backed RAG, and prompt versioning.',
      status: 'read',
      category: 'marketing',
      autoReplyEnabled: false
    }
  ],
  calendarEvents: [
    {
      id: 'cal_1',
      title: 'Executive Ops Sync & Daily Review',
      description: 'Review pending task queue, incoming customer proposals, and align on automated agent approvals.',
      start: '2026-06-29T10:00:00-07:00',
      end: '2026-06-29T11:00:00-07:00',
      location: 'Optivra HQ Room A / Google Meet',
      organizer: 'sarveshwar.ds.01@gmail.com',
      attendees: ['sarveshwar.ds.01@gmail.com', 'sophia.chen@optivra.co'],
      calendarType: 'google',
      conflictSolved: true,
      prepNotes: 'Agenda:\n1. Check email inbox status for Q3 pipeline requests (Acme Corp request in progress).\n2. Review Sophia\'s vector DB indexing documentation.\n3. Approve auto-reply drafts.'
    },
    {
      id: 'cal_2',
      title: 'AI Brain Indexing & Architecture Align',
      description: 'Technical sync with Sophia to review database schemas, SQLite/json storage structure, and tool call functions.',
      start: '2026-06-29T14:00:00-07:00',
      end: '2026-06-29T14:30:00-07:00',
      location: 'Zoom Audio',
      organizer: 'sophia.chen@optivra.co',
      attendees: ['sarveshwar.ds.01@gmail.com', 'sophia.chen@optivra.co'],
      calendarType: 'google',
      conflictSolved: true,
      prepNotes: 'Preparation notes compiled by Optivra Brain Agent:\n- Review Sophia\'s email sent today regarding 80ms latency optimization.\n- Open /src/types.ts to align on standard types and structural parameters.\n- Ensure schema models support full audit logging requirements.'
    },
    {
      id: 'cal_3',
      title: 'Acme Enterprise Pitch Session',
      description: 'Presentation of the customized proposal to Charles Miller and Acme leadership.',
      start: '2026-06-30T10:00:00-07:00',
      end: '2026-06-30T11:00:00-07:00',
      location: 'Acme Virtual HQ',
      organizer: 'sarveshwar.ds.01@gmail.com',
      attendees: ['sarveshwar.ds.01@gmail.com', 'marcus.t@optivra.co', 'charles.miller@acme.com'],
      calendarType: 'google',
      conflictSolved: true,
      prepNotes: 'Preparation notes:\n- Standardize the custom Proposal document in the proposals panel first.\n- Export it to high-fidelity PDF format for Charles to present to their board.'
    }
  ],
  meetings: [
    {
      id: 'mtg_1',
      title: 'Optivra Core Platform Kickoff Meeting',
      date: '2026-06-28',
      duration: '45 mins',
      transcript: 'Sarveshwar: Let\'s get started. We need to finalize the MVP for Optivra OS. Sophia, how is the AI core architecture coming along?\nSophia Chen: Very good. I finished integrating the modern @google/genai TypeScript SDK. It handles chat messages, system instruction constraints, and JSON responseSchemas. Latency is very low.\nSarveshwar: Excellent. Marcus, what about our initial sales funnel?\nMarcus Thompson: Charles Miller from Acme Corp requested custom pricing and SLA guarantees. They have a board meeting on July 5th and need the full proposal. I will help draft the timeline.\nSarveshwar: Awesome. Let\'s make sure we have a fully functional Proposal module in the OS that compiles deliverables, milestones, and pricing, and exports to PDF. Sophia, please complete the database file schema layout so we have a durable record storage. I will write the client views and Express routes.',
      summary: 'In this kickoff meeting, the executive team aligned on the Phase 1 MVP requirements for Optivra OS. Sophia Chen confirmed the integration of the modern `@google/genai` SDK with excellent latency results. Marcus Thompson reported that Acme Corp is a hot lead requesting a custom enterprise proposal by Q3 board meeting on July 5th. Sarveshwar assigned specific engineering tasks to finalize the database schema and proposal exports.',
      decisions: [
        'Adopt the modern @google/genai SDK for all agent-driven AI logic.',
        'Target Acme Corp with a highly customized Enterprise Proposal before their July 5th board review.',
        'Implement structured file database storage in Express to guarantee data persistence.'
      ],
      actionItems: [
        {
          id: 'act_1',
          text: 'Complete database JSON file schema layout with full typescript interfaces',
          owner: 'Sophia Chen',
          status: 'completed'
        },
        {
          id: 'act_2',
          text: 'Finalize customized Enterprise Proposal for Acme Corp and send via email',
          owner: 'Sarveshwar',
          status: 'pending'
        },
        {
          id: 'act_3',
          text: 'Integrate proposal generator engine and PDF print exports',
          owner: 'Sarveshwar',
          status: 'completed'
        }
      ],
      emailRecapSent: true,
      savedToKnowledgeBase: true
    }
  ],
  knowledgeDocs: [
    {
      id: 'doc_1',
      name: 'Optivra Standard Service Level Agreement (SLA)',
      type: 'md',
      content: '# Optivra Standard Service Level Agreement (SLA)\n\nThis SLA outlines the service commitment and availability standards provided by Optivra Global Inc. to all standard enterprise clients.\n\n## 1. Service Availability & Uptime\nOptivra guarantees a monthly service availability (uptime) of **99.95%**, excluding planned maintenance windows which are announced at least 48 hours in advance.\n\n## 2. Response Times & Support Severity Levels\nSupport tickets are categorized as follows:\n- **Severity 1 (Critical Platform Down):** Response within 15 minutes, 24/7 coverage. Workaround within 2 hours.\n- **Severity 2 (High Impact, Core Feature Malfunction):** Response within 1 hour, standard business hours. Fix within 1 business day.\n- **Severity 3 (Medium/Low Impact, UI glitch):** Response within 4 hours, normal business hours.',
      uploadedAt: '2026-06-25T10:00:00-07:00',
      size: '2.4 KB',
      category: 'legal',
      version: 1,
      accessControl: 'all'
    },
    {
      id: 'doc_2',
      name: 'Corporate HandBook & Security Guidelines v2.1',
      type: 'txt',
      content: 'Optivra Corp Handbook\nSection 1: Data Isolation Policies\nAll user information, workspace schemas, and vector memory chunks must be stored securely. We operate under a robust Role-Based Access Control (RBAC) model dividing organizational permissions into Owner, Admin, and Member.\nSection 2: Security Practices\n1. Do not commit actual secrets, keys, or passwords inside client bundles.\n2. Standardize all AI communication layers on server-side proxies, protecting credentials and environment-specific parameters in production.',
      uploadedAt: '2026-06-26T14:30:00-07:00',
      size: '1.8 KB',
      category: 'operations',
      version: 2,
      accessControl: 'all'
    }
  ],
  proposals: [
    {
      id: 'prop_1',
      title: 'Optivra Enterprise Platform Integration - Acme Corp',
      clientName: 'Acme Corporation',
      scope: 'This proposal details the enterprise deployment of Optivra OS across Acme Corporation operations, establishing autonomous email agents, calendar coordination protocols, and a centralized corporate knowledge base RAG synchronization.',
      deliverables: [
        'Dedicated secure server-side Optivra workspace environment',
        'Direct email syncing pipelines with Gmail / Outlook',
        'Custom-tuned AI Brain orchestrator customized with company SLAs',
        'Up to 100 User Seats with multi-tenant Role-Based Access Control (RBAC)',
        'Comprehensive knowledge indexing system for PDF/TXT files'
      ],
      timeline: '4 weeks from initiation',
      milestones: [
        'Week 1: Initial deployment & tenant provisioning',
        'Week 2: Knowledge graph ingestion & SLA training',
        'Week 3: Integration of operational mailboxes with automated reply testing',
        'Week 4: Final user onboarding and staff briefing'
      ],
      pricing: '$12,500 / month flat subscription billed annually + $5,000 onboarding fee',
      terms: 'Payments must be completed within 30 days of receiving the invoice. Optivra warrants a 99.95% platform availability standard as per the attached SLA documentation.',
      branding: {
        logoText: 'Optivra x Acme',
        primaryColor: '#0f172a',
        accentColor: '#3b82f6'
      },
      status: 'generated',
      createdAt: '2026-06-29T10:30:00-07:00'
    }
  ],
  auditLogs: [
    {
      id: 'log_1',
      userId: 'usr_1',
      userName: 'Sarveshwar',
      action: 'System Boot & DB Load',
      details: 'Successfully loaded relational file system structures and registered executive teams.',
      timestamp: '2026-06-29T08:00:00-07:00',
      module: 'settings'
    },
    {
      id: 'log_2',
      userId: 'usr_2',
      userName: 'Sophia Chen',
      action: 'SDK Verification',
      details: 'Verified server-side connection to Google Gemini API using @google/genai client.',
      timestamp: '2026-06-29T09:16:00-07:00',
      module: 'brain'
    },
    {
      id: 'log_3',
      userId: 'usr_1',
      userName: 'Sarveshwar',
      action: 'Email Sync Task Initiated',
      details: 'Scanned inbox folder: retrieved 2 new unread messages. Created automated COO draft suggested replies.',
      timestamp: '2026-06-29T09:30:00-07:00',
      module: 'email'
    }
  ],
  chatHistory: [
    {
      id: 'chat_1',
      sender: 'assistant',
      text: 'Hello Sarveshwar, I am your Optivra AI COO. I have reviewed our incoming emails, calendar schedule, and active operations today. You have an urgent customer query from Acme Corp asking for a custom proposal. How can I assist you with corporate tasks or documents today?',
      timestamp: '2026-06-29T09:30:00-07:00',
      agentDelegated: 'brain'
    }
  ],
  settings: [
    {
      id: 'set_1',
      currentAIPrompt: 'You are Optivra AI COO, a highly analytical and structured Chief Operating Officer. You execute task delegation, summarize email payloads, schedule corporate meetings resolving clashes, query company documents, and prepare business proposals. Be direct, authoritative, professional, and clear. Explain your reasoning briefly before executing critical transactions.',
      modelName: 'gemini-3.5-flash',
      apiKeyConfigured: true,
      autoEmailApproval: false
    }
  ]
};

// Initialize DB file
function initDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Failed to initialize local JSON database file, falling back to memory storage:', error);
  }
}

// Read database
export function readDb(): DatabaseSchema {
  initDb();
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data) as DatabaseSchema;
    }
  } catch (error) {
    console.error('Error reading JSON DB file:', error);
  }
  return defaultData;
}

// Write database
export function writeDb(data: DatabaseSchema): boolean {
  initDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing JSON DB file:', error);
    return false;
  }
}

// Helper to add audit logs
export function addAuditLog(userId: string, userName: string, action: string, details: string, module: AuditLog['module']) {
  const db = readDb();
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId,
    userName,
    action,
    details,
    timestamp: new Date().toISOString(),
    module
  };
  db.auditLogs.unshift(newLog);
  // Keep last 100 logs
  if (db.auditLogs.length > 100) {
    db.auditLogs = db.auditLogs.slice(0, 100);
  }
  writeDb(db);
}
