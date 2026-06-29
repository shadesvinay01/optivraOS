/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  Save,
  Trash2,
  Settings,
  ListPlus,
  Loader2,
  CheckCircle,
  Tag,
  AlertCircle
} from 'lucide-react';
import { DatabaseSchema, Proposal } from '../types.js';

interface ProposalViewProps {
  db: DatabaseSchema;
  onGenerateProposal: (clientName: string, requirements: string, pricingStrategy: string) => Promise<void>;
  onUpdateProposal: (id: string, updateData: any) => Promise<void>;
  onDeleteProposal: (id: string) => Promise<void>;
}

export default function ProposalView({
  db,
  onGenerateProposal,
  onUpdateProposal,
  onDeleteProposal
}: ProposalViewProps) {
  const [selectedPropId, setSelectedPropId] = useState<string>(db.proposals[0]?.id || '');
  
  // Wizard Input States
  const [clientName, setClientName] = useState('');
  const [requirements, setRequirements] = useState('');
  const [pricingStrategy, setPricingStrategy] = useState('$12,500 / month flat subscription billed annually');
  const [logoText, setLogoText] = useState('Optivra x Client');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedProposal = db.proposals.find((p) => p.id === selectedPropId);

  // Editing States for Selected Proposal
  const [editScope, setEditScope] = useState('');
  const [editPricing, setEditPricing] = useState('');
  const [editTerms, setEditTerms] = useState('');
  const [editTimeline, setEditTimeline] = useState('');

  // When selected proposal changes, load editing fields
  React.useEffect(() => {
    if (selectedProposal) {
      setEditScope(selectedProposal.scope || '');
      setEditPricing(selectedProposal.pricing || '');
      setEditTerms(selectedProposal.terms || '');
      setEditTimeline(selectedProposal.timeline || '');
    }
  }, [selectedPropId, selectedProposal]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !requirements.trim()) return;
    setGenerating(true);
    try {
      await onGenerateProposal(clientName, requirements, pricingStrategy);
      setClientName('');
      setRequirements('');
      if (db.proposals.length > 0) {
        setSelectedPropId(db.proposals[db.proposals.length - 1].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveProposal = async () => {
    if (!selectedProposal) return;
    setSaving(true);
    try {
      await onUpdateProposal(selectedProposal.id, {
        scope: editScope,
        pricing: editPricing,
        terms: editTerms,
        timeline: editTimeline
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrePopulateWizard = () => {
    setClientName('Acme Corporation');
    setRequirements('Enterprise integration of Optivra OS, email agent, and calendar. Custom response times support SLA. Target launch date is Q3 board sync on July 5th.');
    setPricingStrategy('$12,500 / month flat rate billed annually');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] animate-fade-in text-left" id="proposal_view_container">
      {/* Left panel: Proposal selector & Creation Wizard */}
      <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 flex flex-col h-full overflow-hidden print:hidden">
        {/* Saved list */}
        <div className="space-y-4 shrink-0 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-zinc-500" />
              Service Proposals
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Select an active contract payload to view, edit, and print SLA proposals.</p>
          </div>

          <div className="flex gap-2 overflow-x-auto py-1">
            {db.proposals.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPropId(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border text-left truncate shrink-0 max-w-[10rem] cursor-pointer transition-all ${
                  p.id === selectedPropId
                    ? 'bg-zinc-900 border-zinc-950 text-white dark:bg-zinc-800 dark:border-zinc-700'
                    : 'bg-zinc-50 border-zinc-100 text-zinc-600 hover:border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-800'
                }`}
              >
                {p.clientName}
              </button>
            ))}
          </div>
        </div>

        {/* Generation Wizard form */}
        <div className="flex-1 overflow-y-auto pt-4 flex flex-col justify-between">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="flex justify-between items-center pb-1">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Contract Generator</h3>
              <button
                type="button"
                onClick={handlePrePopulateWizard}
                className="text-[10px] text-blue-500 hover:underline cursor-pointer"
              >
                Pre-populate Acme lead
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">Client Name</label>
              <input
                type="text"
                required
                placeholder="Acme Corporation..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">Project Brief & SLA Goals</label>
              <textarea
                required
                placeholder="Details of client requirements..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={3}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">Pricing Tier Strategy</label>
              <input
                type="text"
                placeholder="Flat rate, onboarding fee, subscriptions..."
                value={pricingStrategy}
                onChange={(e) => setPricingStrategy(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase">Branding Logo Text</label>
                <input
                  type="text"
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase">Theme Primary Color</label>
                <div className="flex gap-1.5 pt-1">
                  {['#0f172a', '#1e3a8a', '#14532d', '#581c87'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPrimaryColor(color)}
                      className="w-5 h-5 rounded-full border border-white dark:border-zinc-800 focus:ring-2 focus:ring-zinc-400 transition-all cursor-pointer shrink-0"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating || !clientName.trim() || !requirements.trim()}
              className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-medium rounded-xl text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              Draft Proposal with Optivra AI
            </button>
          </form>
        </div>
      </div>

      {/* Center/Right Panel: Interactive Proposal contract canvas */}
      <div className="lg:col-span-2 border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 p-6 flex flex-col h-full overflow-hidden print:border-none print:p-0 print:bg-white">
        {selectedProposal ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header / Meta bar */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 shrink-0 print:hidden">
              <div className="space-y-0.5">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Custom SLA & Pricing Sheet</h2>
                <span className="text-[10px] text-zinc-400">Created on {new Date(selectedProposal.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveProposal}
                  disabled={saving}
                  className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-200 cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save updates
                </button>

                <button
                  onClick={handlePrint}
                  className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-200 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Proposal
                </button>

                <button
                  onClick={() => onDeleteProposal(selectedProposal.id)}
                  className="p-2.5 hover:bg-rose-50 text-zinc-400 hover:text-rose-500 rounded-xl cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document body scroll */}
            <div className="flex-1 overflow-y-auto space-y-6 pt-6 pr-1 bg-white dark:bg-zinc-950 p-8 rounded-xl border border-zinc-100 dark:border-zinc-850 shadow-sm print:shadow-none print:border-none print:p-0">
              {/* Document branding header */}
              <div
                className="p-6 rounded-xl text-white space-y-3 shrink-0"
                style={{ backgroundColor: selectedProposal.branding?.primaryColor || primaryColor }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold">Service Agreement & SLA Pricing Proposal</span>
                  <span className="text-xs font-semibold font-mono">{selectedProposal.branding?.logoText || logoText}</span>
                </div>
                <h1 className="text-2xl font-sans font-semibold">{selectedProposal.title}</h1>
                <p className="text-xs text-zinc-300">Custom compiled for **{selectedProposal.clientName}** by Optivra Autonomous COO Agent.</p>
              </div>

              {/* Editable Scope Statement card */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider print:text-zinc-600">1. Operational Scope Statement</h3>
                <textarea
                  value={editScope}
                  onChange={(e) => setEditScope(e.target.value)}
                  rows={4}
                  className="w-full p-4 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none leading-relaxed print:bg-white print:p-0 print:border-none"
                />
              </div>

              {/* Deliverables Checklist (Read-only on printable canvas) */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider print:text-zinc-600">2. Technical Deliverables Checklist</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {selectedProposal.deliverables.map((del, i) => (
                    <div
                      key={i}
                      className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100/50 dark:border-zinc-800 rounded-xl flex items-start gap-2.5"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal">{del}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Input */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider print:text-zinc-600">3. Implementation Schedule Timeline</h3>
                <input
                  type="text"
                  value={editTimeline}
                  onChange={(e) => setEditTimeline(e.target.value)}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none print:bg-white print:p-0 print:border-none"
                />
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider print:text-zinc-600">4. Key Milestones Plan</h3>
                <div className="space-y-2.5">
                  {selectedProposal.milestones.map((mile, i) => (
                    <div
                      key={i}
                      className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100/50 dark:border-zinc-850 rounded-xl flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal">{mile}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider print:text-zinc-600">5. Subscription & Onboarding Fees</h3>
                  <textarea
                    value={editPricing}
                    onChange={(e) => setEditPricing(e.target.value)}
                    rows={2}
                    className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none leading-relaxed font-mono print:bg-white print:p-0 print:border-none"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider print:text-zinc-600">6. SLA response times and Standard Uptime Guarantee</h3>
                  <textarea
                    value={editTerms}
                    onChange={(e) => setEditTerms(e.target.value)}
                    rows={2}
                    className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none leading-relaxed font-mono print:bg-white print:p-0 print:border-none"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-2 p-8 text-center">
            <AlertCircle className="w-10 h-10 stroke-1 text-zinc-300 dark:text-zinc-700" />
            <p className="text-xs">No customized proposals generated yet. Fill out the Brief Wizard on the left to invoke the AI Proposal agent.</p>
          </div>
        )}
      </div>
    </div>
  );
}
