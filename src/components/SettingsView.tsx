/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Users,
  Key,
  Shield,
  CreditCard,
  Sparkles,
  Save,
  CheckCircle,
  HelpCircle,
  Clock,
  Loader2,
  Lock,
  Building
} from 'lucide-react';
import { DatabaseSchema, SystemSetting } from '../types.js';

interface SettingsViewProps {
  db: DatabaseSchema;
  onUpdateSettings: (settingsData: any) => Promise<void>;
  onSimulateSubscription: () => Promise<void>;
}

export default function SettingsView({
  db,
  onUpdateSettings,
  onSimulateSubscription
}: SettingsViewProps) {
  const activeSettings = db.settings[0] || {
    currentAIPrompt: '',
    modelName: 'gemini-3.5-flash',
    apiKeyConfigured: false,
    autoEmailApproval: false
  };

  const [prompt, setPrompt] = useState(activeSettings.currentAIPrompt);
  const [model, setModel] = useState(activeSettings.modelName);
  const [autoEmail, setAutoEmail] = useState(activeSettings.autoEmailApproval);
  const [updating, setUpdating] = useState(false);

  // Stripe Mock Form
  const [stripePlan, setStripePlan] = useState<'standard' | 'enterprise'>('enterprise');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('***');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await onUpdateSettings({
        currentAIPrompt: prompt,
        modelName: model,
        autoEmailApproval: autoEmail
      });
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleSimulateStripePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribing(true);
    try {
      await onSimulateSubscription();
      setSubscribed(true);
    } catch (error) {
      console.error(error);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left text-zinc-900 dark:text-zinc-100" id="settings_view_container">
      {/* Left panel: Prompt versioning & AI settings */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleUpdate} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 space-y-5">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-zinc-500" />
                Prompt Versioning & AI Engine
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Configure the core system instructions governing multi-agent transaction boundaries.</p>
            </div>
            
            <button
              type="submit"
              disabled={updating}
              className="flex items-center gap-1 px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 hover:bg-zinc-800"
            >
              {updating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Config
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Default Language Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium focus:outline-none focus:border-zinc-400"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Balanced Speed/Accuracy)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email Automation Approval Mode</label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setAutoEmail(!autoEmail)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md cursor-pointer transition-all ${
                      autoEmail
                        ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
                    }`}
                  >
                    {autoEmail ? 'Auto Reply Mode' : 'Requires Human Approval'}
                  </button>
                  <span className="text-[10px] text-zinc-400 leading-normal">
                    {autoEmail ? 'Emails send automatically' : 'Drafts saved for manual checkout review'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between pb-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Core System Instruction (System Prompt)</label>
                <span className="text-[10px] text-zinc-400">Prompt version: <strong>1.4.1</strong></span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={10}
                className="w-full p-4 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 font-mono leading-relaxed"
              />
            </div>
          </div>
        </form>

        {/* Tenant Organization RBAC list */}
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 space-y-4">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-zinc-500" />
                Multi-Tenant Users & RBAC
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Configure active team organizations, access permissions, and roles.</p>
            </div>
            
            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-bold uppercase text-zinc-500">
              {db.users.length} Users active
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {db.users.map((user) => (
              <div key={user.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-zinc-100 object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</h4>
                    <p className="text-[10px] text-zinc-400">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel: Stripe Billing Subscription simulation */}
      <div className="space-y-6">
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-left">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-zinc-500" />
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Stripe Subscriptions</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Setup billing accounts and activate premium multi-agent modules.</p>
              </div>
            </div>

            {/* Select Tier */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStripePlan('standard')}
                className={`p-3 border rounded-xl text-left transition-all cursor-pointer ${
                  stripePlan === 'standard'
                    ? 'border-zinc-950 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/40'
                    : 'border-zinc-100 hover:border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Standard</span>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-1">$4,500/mo</h4>
                <p className="text-[9px] text-zinc-400 mt-1">Includes 5 user seats and up to 10 indexed documents.</p>
              </button>

              <button
                type="button"
                onClick={() => setStripePlan('enterprise')}
                className={`p-3 border rounded-xl text-left transition-all cursor-pointer ${
                  stripePlan === 'enterprise'
                    ? 'border-zinc-950 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/40'
                    : 'border-zinc-100 hover:border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <span className="text-[10px] font-bold text-blue-500 uppercase">Enterprise Pro</span>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white mt-1">$12,500/mo</h4>
                <p className="text-[9px] text-zinc-400 mt-1">Uncapped seats, continuous email syncing, and API SLA priority.</p>
              </button>
            </div>

            {/* Stripe simulated credit card details form */}
            <form onSubmit={handleSimulateStripePay} className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase">Expiry Date</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase">CVC Check</label>
                  <input
                    type="text"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={subscribing || subscribed}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:bg-emerald-600 disabled:text-white"
              >
                {subscribing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : subscribed ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-blue-200" />
                )}
                {subscribed ? 'Simulated Stripe Subscribed!' : `Simulate Stripe Pay ${stripePlan === 'standard' ? '$4,500' : '$12,500'}`}
              </button>
            </form>

            <div className="text-[10px] text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-start gap-1.5 leading-normal">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Simulated PCI-DSS compliance layer active. Optivra OS processes billing credentials securely through our end-to-end Stripe API proxy workflows.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
