/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Upload,
  Sparkles,
  FileText,
  Trash2,
  Lock,
  Tag,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { DatabaseSchema, KnowledgeDoc } from '../types.js';

interface KnowledgeBaseViewProps {
  db: DatabaseSchema;
  onUploadDocument: (docData: any) => Promise<void>;
  onQueryKnowledge: (question: string) => Promise<{ answer: string; citations: string[] }>;
  onDeleteDocument: (id: string) => Promise<void>;
}

export default function KnowledgeBaseView({
  db,
  onUploadDocument,
  onQueryKnowledge,
  onDeleteDocument
}: KnowledgeBaseViewProps) {
  const [question, setQuestion] = useState('');
  const [querying, setQuerying] = useState(false);
  const [qaResult, setQaResult] = useState<{ answer: string; citations: string[] } | null>(null);

  // Uploader Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('operations');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'md' | 'txt'>('md');
  const [uploading, setUploading] = useState(false);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setQuerying(true);
    setQaResult(null);
    try {
      const result = await onQueryKnowledge(question);
      setQaResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setQuerying(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setUploading(true);
    try {
      await onUploadDocument({
        name,
        category,
        content,
        type
      });
      setName('');
      setContent('');
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setQuestion(q);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left" id="knowledge_base_view_container">
      {/* Search Q&A Section */}
      <div className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-950 text-white rounded-2xl border border-zinc-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Semantic RAG Search active
          </div>
          <h2 className="text-2xl font-sans font-medium tracking-tight">Query Company Memory</h2>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Ask any questions grounded strictly in our corporate SLA uptime papers, security handbooks, and meeting summaries.
          </p>

          <form onSubmit={handleQuery} className="flex gap-2 max-w-2xl mx-auto pt-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ask e.g. 'What is our standard response SLA time?'..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 pr-10"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={querying || !question.trim()}
              className="px-5 py-2.5 bg-white text-zinc-950 font-medium rounded-xl text-sm hover:bg-zinc-100 cursor-pointer flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-50"
            >
              {querying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-500" />
              )}
              Query Memory
            </button>
          </form>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="text-zinc-500">Quick queries:</span>
            <button
              onClick={() => handleQuickQuestion('What is our standard support response SLA time?')}
              className="px-2.5 py-1 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 rounded-lg text-zinc-300 transition-all cursor-pointer"
            >
              "Standard response SLA time"
            </button>
            <button
              onClick={() => handleQuickQuestion('What are our data isolation and RBAC security policies?')}
              className="px-2.5 py-1 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 rounded-lg text-zinc-300 transition-all cursor-pointer"
            >
              "Data isolation and RBAC rules"
            </button>
          </div>
        </div>

        {/* Q&A Result Container */}
        {qaResult && (
          <div className="max-w-3xl mx-auto mt-6 p-5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl space-y-3 animate-slide-up text-left">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Grounded AI Response
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-mono">
              {qaResult.answer}
            </p>

            {qaResult.citations && qaResult.citations.length > 0 && (
              <div className="pt-3 border-t border-zinc-700/60 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Source Citations:</span>
                {qaResult.citations.map((cite, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded font-medium border border-zinc-600"
                  >
                    <FileText className="w-3 h-3 text-zinc-400" />
                    {cite}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Upload & Catalog Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-26rem)]">
        {/* Upload widget form */}
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 flex flex-col h-full overflow-hidden">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3 shrink-0">
            Ingest Grounded Knowledge
          </h3>

          <form onSubmit={handleUploadSubmit} className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Document Name</label>
              <input
                type="text"
                required
                placeholder="SLA contract, handbook..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-250 focus:outline-none"
                >
                  <option value="legal">Legal/SLA</option>
                  <option value="operations">Operations</option>
                  <option value="marketing">Marketing/Growth</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Format</label>
                <div className="flex gap-1.5 pt-1">
                  {['md', 'txt'].map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setType(format as any)}
                      className={`px-3.5 py-1 text-[10px] font-bold uppercase rounded-md cursor-pointer transition-all ${
                        type === format
                          ? 'bg-zinc-950 dark:bg-zinc-800 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1 flex-1 flex flex-col">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Document Content Text</label>
              <textarea
                required
                placeholder="# Scope terms or company guidelines guidelines..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full flex-1 min-h-[8rem] p-3 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 font-mono leading-relaxed"
              />
            </div>

            <div className="pt-2 shrink-0">
              <button
                type="submit"
                disabled={uploading || !name.trim() || !content.trim()}
                className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-medium rounded-xl text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Ingest & Index Document
              </button>
            </div>
          </form>
        </div>

        {/* Catalog catalogs List */}
        <div className="lg:col-span-2 border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 flex flex-col h-full overflow-hidden">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Indexed Knowledge Graph</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Active company catalog showing {db.knowledgeDocs.length} persistent files ready for context-aware grounding.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50 pt-1 pr-1">
            {db.knowledgeDocs.map((doc) => (
              <div
                key={doc.id}
                className="py-3.5 flex items-center justify-between gap-4 group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 px-2 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3 w-3/4">
                  <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 truncate text-left">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {doc.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-zinc-400" />
                      <span className="capitalize">{doc.category}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>v{doc.version}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-zinc-500 border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono uppercase">
                    <Lock className="w-2.5 h-2.5 text-zinc-400" />
                    {doc.accessControl}
                  </span>

                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {db.knowledgeDocs.length === 0 && (
              <div className="py-12 text-center text-zinc-400 space-y-2">
                <AlertCircle className="w-10 h-10 stroke-1 mx-auto" />
                <p className="text-xs">No corporate guidelines uploaded. Ingest folders above to train the agent.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
