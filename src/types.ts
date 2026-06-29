/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  size: string;
}

export interface Team {
  id: string;
  orgId: string;
  name: string;
  memberIds: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  teamId: string;
  ownerId: string;
  dueDate: string;
}

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigneeId?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
  summary?: string;
  suggestedReply?: string;
  replyDraft?: string;
  status: 'unread' | 'read' | 'replied';
  category: 'work' | 'support' | 'marketing' | 'personal';
  autoReplyEnabled: boolean;
  autoReplySent?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location?: string;
  organizer: string;
  attendees: string[];
  calendarType: 'google' | 'outlook';
  conflictSolved: boolean;
  prepNotes?: string;
  meetingIntelId?: string;
}

export interface MeetingIntelActionItem {
  id: string;
  text: string;
  owner: string;
  status: 'pending' | 'completed';
}

export interface MeetingIntel {
  id: string;
  title: string;
  date: string;
  duration: string;
  transcript: string;
  summary: string;
  decisions: string[];
  actionItems: MeetingIntelActionItem[];
  emailRecapSent: boolean;
  savedToKnowledgeBase: boolean;
}

export interface KnowledgeDoc {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'pptx' | 'txt' | 'md';
  content: string;
  uploadedAt: string;
  size: string;
  category: string;
  version: number;
  accessControl: 'all' | 'admin' | 'executive';
}

export interface ProposalBranding {
  logoText: string;
  primaryColor: string;
  accentColor: string;
}

export interface Proposal {
  id: string;
  title: string;
  clientName: string;
  scope: string;
  deliverables: string[];
  timeline: string;
  milestones: string[];
  pricing: string;
  terms: string;
  branding: ProposalBranding;
  status: 'draft' | 'generated' | 'sent';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  module: 'dashboard' | 'brain' | 'email' | 'calendar' | 'meetings' | 'knowledge' | 'proposals' | 'settings';
}

export interface SystemSetting {
  id: string;
  currentAIPrompt: string;
  modelName: string;
  apiKeyConfigured: boolean;
  autoEmailApproval: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  reasoning?: string;
  agentDelegated?: 'brain' | 'email' | 'calendar' | 'meeting' | 'knowledge' | 'proposal';
}

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

