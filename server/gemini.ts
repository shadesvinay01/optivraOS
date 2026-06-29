/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { readDb, addAuditLog } from './db.js';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.warn('GEMINI_API_KEY is not configured or holds a placeholder. Falling back to simulated AI operations.');
    }
    // Lazy-initialize client as recommended
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key-to-prevent-crash',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Fallback logic when no real API Key or failure occurs
function isMockMode(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return !apiKey || apiKey === 'MY_GEMINI_API_KEY';
}

/**
 * 1. AI Brain Agent Orchestration
 */
export async function generateBrainResponse(
  history: { sender: 'user' | 'assistant'; text: string }[],
  userQuery: string
) {
  const db = readDb();
  const activeSetting = db.settings[0] || {
    currentAIPrompt: 'You are Optivra AI COO.',
    modelName: 'gemini-3.5-flash',
  };

  // Compile RAG Knowledge base context to inject
  let knowledgeContext = '';
  if (db.knowledgeDocs.length > 0) {
    knowledgeContext = 'Available Corporate Knowledge Base Documents:\n';
    db.knowledgeDocs.forEach((doc) => {
      knowledgeContext += `--- Document: "${doc.name}" ---\n${doc.content.substring(0, 800)}\n\n`;
    });
  }

  // Compile other operational context to inject (Current status)
  const pendingTasksCount = db.tasks.filter((t) => t.status !== 'completed').length;
  const unreadEmailsCount = db.emails.filter((e) => e.status === 'unread').length;
  const operationalContext = `
Active Operational Context:
- Pending Tasks: ${pendingTasksCount}
- Unread emails in inbox: ${unreadEmailsCount}
- Teams active: ${db.teams.map((t) => t.name).join(', ')}
`;

  const systemInstruction = `
${activeSetting.currentAIPrompt}

${knowledgeContext}

${operationalContext}

You are the central orchestrator of Optivra OS. You coordinate multiple AI agents.
For the user's latest query, you must think and determine:
1. Your reasoning step.
2. If you need to delegate the task to a specialized agent:
   - Use 'email' if they want to manage, draft, summarize, list, search, or send emails.
   - Use 'calendar' if they want to schedule, check, resolve conflicts, or view meetings/agendas.
   - Use 'meeting' if they want to analyze transcripts, recap discussions, extract action items, or look up meetings.
   - Use 'knowledge' if they specifically ask a question about company guidelines, docs, standard SLAs, or searching articles.
   - Use 'proposal' if they want to outline, generate, edit, or customize a client proposal.
   - Otherwise, handle it yourself as 'brain'.
3. Your final response message.

Provide your output strictly matching the required JSON schema.
`;

  if (isMockMode()) {
    // Elegant simulation matching Gemini structure when keys aren't active yet
    await new Promise((resolve) => setTimeout(resolve, 800));
    let text = "I've reviewed your request. Let me look that up.";
    let delegate: 'brain' | 'email' | 'calendar' | 'meeting' | 'knowledge' | 'proposal' = 'brain';
    let thought = "Analyzing query to route to appropriate agent operations.";

    const queryLower = userQuery.toLowerCase();
    if (queryLower.includes('email') || queryLower.includes('mail') || queryLower.includes('inbox') || queryLower.includes('reply')) {
      delegate = 'email';
      thought = "User query relates to email processing. Delegating to the Email Agent.";
      text = "I have scanned your mailboxes. There are 2 unread operational emails from Charles Miller and Sophia Chen waiting for attention. I can help draft replies or summarize threads.";
    } else if (queryLower.includes('calendar') || queryLower.includes('schedule') || queryLower.includes('event') || queryLower.includes('meeting time') || queryLower.includes('conflict')) {
      delegate = 'calendar';
      thought = "User query involves schedules and calendars. Delegating to the Calendar Agent.";
      text = "Reviewing calendar profiles. You have 3 events on your Google Calendar today, including an operational align session with Sophia. I can check for clashes or book meetings.";
    } else if (queryLower.includes('transcript') || queryLower.includes('meeting intel') || queryLower.includes('action item') || queryLower.includes('decision')) {
      delegate = 'meeting';
      thought = "User query targets transcripts and meeting briefs. Delegating to the Meeting Intelligence Agent.";
      text = "Accessing historical meeting records. I found the 'Optivra Core Platform Kickoff Meeting' from yesterday. It has 3 extracted decisions and 3 action items. I can run further reviews.";
    } else if (queryLower.includes('knowledge') || queryLower.includes('document') || queryLower.includes('sla') || queryLower.includes('handbook') || queryLower.includes('policy')) {
      delegate = 'knowledge';
      thought = "User query targets company literature and RAG document stores. Delegating to the Knowledge Agent.";
      text = "Searching our grounded document index. I found the 'Optivra Standard Service Level Agreement (SLA)' which guarantees 99.95% uptime, and the 'Corporate HandBook'. What would you like to extract?";
    } else if (queryLower.includes('proposal') || queryLower.includes('pricing') || queryLower.includes('timeline') || queryLower.includes('scope')) {
      delegate = 'proposal';
      thought = "User query involves proposal drafting or export. Delegating to the Proposal Agent.";
      text = "Retrieving proposal configurations. I can draft a complete business contract with deliverables, timeline milestones, and SLA pricing terms. We have an Acme Corp proposal in progress.";
    } else {
      text = `As your AI Chief Operating Officer, I am monitoring all workspace modules. I can help you coordinate teams, check email responses, align schedules, search files, or draft custom agreements. What operation would you like to run next?`;
    }

    return { thought, delegate, text };
  }

  try {
    const client = getGeminiClient();
    const contents = history.map((h) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));
    contents.push({
      role: 'user',
      parts: [{ text: userQuery }],
    });

    const response = await client.models.generateContent({
      model: activeSetting.modelName,
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thought: {
              type: Type.STRING,
              description: 'Your internal operational reasoning and delegation logic as AI COO.',
            },
            delegate: {
              type: Type.STRING,
              description: 'Which specialized module to route the action to.',
              enum: ['brain', 'email', 'calendar', 'meeting', 'knowledge', 'proposal'],
            },
            text: {
              type: Type.STRING,
              description: 'Your final helpful response message to the user.',
            },
          },
          required: ['thought', 'delegate', 'text'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      thought: result.thought || 'Routing operations...',
      delegate: result.delegate || 'brain',
      text: result.text || 'Process completed.',
    };
  } catch (error) {
    console.error('Gemini generateBrainResponse error:', error);
    return {
      thought: 'Error in AI generation. Falling back to core system execution.',
      delegate: 'brain' as const,
      text: `I encountered an error querying the model, but I can still assist. Here is your query: "${userQuery}". Let me know if you would like me to process it through another channel.`,
    };
  }
}

/**
 * 2. Email Agent Summarizer and Suggest Draft
 */
export async function summarizeEmail(emailFrom: string, emailSubject: string, emailBody: string) {
  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      summary: `Email from ${emailFrom} regarding "${emailSubject}". They request timeline reviews, SLA metrics, and pricing details.`,
      suggestedReply: `Subject: Re: ${emailSubject}\n\nHi,\n\nThank you for reaching out. We have received your query regarding our services and uptime policies. Let us prepare a comprehensive overview and timeline draft for your review by tomorrow.\n\nBest regards,\nOptivra Operations Team`,
    };
  }

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Subject: ${emailSubject}\nFrom: ${emailFrom}\n\nBody:\n${emailBody}`,
      config: {
        systemInstruction: `You are the Email Agent for Optivra OS. Analyze the incoming email. Provide:
1. A concise 1-2 sentence business summary of the sender's core intent.
2. A professional, custom, fully-written draft reply on behalf of Sarveshwar (COO, Optivra OS) addressing all questions or scheduling queries directly.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Concise summary of intent.' },
            suggestedReply: { type: Type.STRING, description: 'Fully drafted professional email reply.' },
          },
          required: ['summary', 'suggestedReply'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Gemini summarizeEmail error:', error);
    return {
      summary: 'Failed to auto-generate summary.',
      suggestedReply: 'Failed to auto-generate suggested draft.',
    };
  }
}

/**
 * 3. Meeting Intelligence Processor
 */
export async function analyzeMeeting(meetingTitle: string, transcript: string) {
  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      summary: `In this discussion on "${meetingTitle}", the team reviewed pending items, optimized core workflows, and assigned critical milestones to meet client SLA standards.`,
      decisions: [
        'Establish standard file-based schema configurations.',
        'Target proposals to board timelines.',
      ],
      actionItems: [
        { text: 'Finalize customized terms and deliverables', owner: 'Sarveshwar' },
        { text: 'Verify build scripts compilation logs', owner: 'Sophia Chen' },
      ],
    };
  }

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Meeting Title: ${meetingTitle}\n\nTranscript:\n${transcript}`,
      config: {
        systemInstruction: `You are the Meeting Intelligence Agent for Optivra OS. Analyze the transcript. Extract:
1. A descriptive, high-quality summary of the discussions and status updates.
2. A list of final business decisions approved by the team.
3. A list of action items, mapping each task strictly to a specific owner mentioned in the transcript.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Comprehensive summary paragraphs.' },
            decisions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Approved key decisions.',
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: 'Description of the action item task.' },
                  owner: { type: Type.STRING, description: 'Name of the assigned person.' },
                },
                required: ['text', 'owner'],
              },
            },
          },
          required: ['summary', 'decisions', 'actionItems'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Gemini analyzeMeeting error:', error);
    return {
      summary: 'Failed to analyze transcript.',
      decisions: [],
      actionItems: [],
    };
  }
}

/**
 * 4. Proposal Generator
 */
export async function generateProposal(clientName: string, requirements: string, pricingStrategy: string) {
  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      title: `Optivra OS Enterprise Architecture & SLA - ${clientName}`,
      scope: `This customized contract integrates Optivra OS tools for ${clientName}, establishing autonomous agents to automate customer interactions, coordinate internal team schedules, and sync organizational memory indexes.`,
      deliverables: [
        'Custom workspace tenant configurations',
        'Auto-reply pipeline setup for primary corporate mailboxes',
        'Secure file-chunking indexing RAG search console',
        'Up to 50 user seats managed via secure RBAC policy dashboards',
      ],
      timeline: '3 weeks from onboarding sync',
      milestones: [
        'Milestone 1: Provisioning & API credentials mapping',
        'Milestone 2: Multi-agent coordination training and prompt customization',
        'Milestone 3: SLA certification compliance audit & handoff',
      ],
      pricing: pricingStrategy || '$8,500 / month flat subscription rate billed quarterly.',
      terms: 'Payments must be completed within 14 days of invoice receipt. Support guarantees correspond to our Standard SLA 99.95% uptime.',
    };
  }

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Client: ${clientName}\nRequirements: ${requirements}\nPricing notes: ${pricingStrategy}`,
      config: {
        systemInstruction: `You are the Proposal Agent for Optivra OS. Generate a high-fidelity business proposal draft.
Structure it with specific scope details, enterprise deliverables, timeline schedules, milestones, pricing numbers, and liability/uptime terms.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scope: { type: Type.STRING },
            deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
            timeline: { type: Type.STRING },
            milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
            pricing: { type: Type.STRING },
            terms: { type: Type.STRING },
          },
          required: ['title', 'scope', 'deliverables', 'timeline', 'milestones', 'pricing', 'terms'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Gemini generateProposal error:', error);
    return {
      title: `Service Proposal - ${clientName}`,
      scope: 'Failed to generate details, please input manually.',
      deliverables: [],
      timeline: '',
      milestones: [],
      pricing: '',
      terms: '',
    };
  }
}

/**
 * 5. Knowledge Base Grounded Q&A
 */
export async function queryKnowledge(question: string) {
  const db = readDb();
  if (db.knowledgeDocs.length === 0) {
    return {
      answer: "No company knowledge documents have been uploaded to the database yet. Please upload files under the 'Knowledge' tab.",
      citations: [],
    };
  }

  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const questionLower = question.toLowerCase();
    if (questionLower.includes('sla') || questionLower.includes('uptime') || questionLower.includes('guarantee')) {
      return {
        answer: "According to the 'Optivra Standard Service Level Agreement (SLA)' document, Optivra guarantees a monthly platform service availability (uptime) of 99.95%, excluding announced maintenance windows.",
        citations: ['Optivra Standard Service Level Agreement (SLA)'],
      };
    }
    if (questionLower.includes('security') || questionLower.includes('rbac') || questionLower.includes('handbook')) {
      return {
        answer: "The 'Corporate HandBook & Security Guidelines v2.1' states that we operate on a strict Role-Based Access Control (RBAC) model dividing organizational permissions into Owner, Admin, and Member. It also mandates that API keys/secrets must never be exposed to browser clients.",
        citations: ['Corporate HandBook & Security Guidelines v2.1'],
      };
    }
    return {
      answer: "I searched your uploaded files. I can see the 'Optivra Standard SLA' and 'Corporate Handbook'. To answer your question specifically, please ensure the context is outlined in the uploaded text.",
      citations: [db.knowledgeDocs[0].name],
    };
  }

  try {
    const client = getGeminiClient();
    const documentsPrompt = db.knowledgeDocs
      .map((d) => `Document Name: ${d.name}\nContent:\n${d.content}`)
      .join('\n\n');

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Grounded Documents:\n${documentsPrompt}\n\nQuestion: ${question}`,
      config: {
        systemInstruction: `You are the Knowledge Agent for Optivra OS. Answer the user's question using ONLY the provided grounded documents.
If the documents do not contain the answer, state that clearly.
Extract which documents you cited for the answer and return in JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING, description: 'Grounded factual answer using cited materials.' },
            citations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exact names of referenced documents.',
            },
          },
          required: ['answer', 'citations'],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Gemini queryKnowledge error:', error);
    return {
      answer: 'Failed to perform grounded Q&A query due to operational limitations.',
      citations: [],
    };
  }
}
