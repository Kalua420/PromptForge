import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Zap } from 'lucide-react';
const ALL_FEATURES = [
  { key: 'prompts', label: 'Prompts' },
  { key: 'providers', label: 'AI Providers' },
  { key: 'templates', label: 'Template Access' },
  { key: 'exports', label: 'Export Prompts' },
  { key: 'realtimeStreaming', label: 'Real-time Streaming' },
  { key: 'aiRefine', label: 'AI Prompt Refinement' },
  { key: 'analytics', label: 'Usage Analytics' },
  { key: 'teamWorkspace', label: 'Team Workspace' },
  { key: 'customStrategies', label: 'Custom Strategies' },
  { key: 'apiAccess', label: 'API Access' },
  { key: 'auditLogs', label: 'Audit Logs' },
  { key: 'dedicatedSupport', label: 'Dedicated Support' },
];

const FEATURE_VALUES = {
  free: {
    prompts: '50/month',
    providers: '1 (Groq)',
    templates: 'Basic (1 domain)',
    exports: false,
    realtimeStreaming: false,
    aiRefine: false,
    analytics: false,
    teamWorkspace: false,
    customStrategies: false,
    apiAccess: false,
    auditLogs: false,
    dedicatedSupport: false,
  },
  pro: {
    prompts: 'Unlimited',
    providers: 'All 5',
    templates: 'Full (5 domains)',
    exports: true,
    realtimeStreaming: true,
    aiRefine: true,
    analytics: true,
    teamWorkspace: false,
    customStrategies: false,
    apiAccess: false,
    auditLogs: false,
    dedicatedSupport: false,
  },
  team: {
    prompts: 'Unlimited',
    providers: 'All 5',
    templates: 'Full (5 domains)',
    exports: true,
    realtimeStreaming: true,
    aiRefine: true,
    analytics: true,
    teamWorkspace: true,
    customStrategies: true,
    apiAccess: true,
    auditLogs: true,
    dedicatedSupport: true,
  },
};

export function PricingTable({ tiers, onSelect, currentTier = 'free' }) {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const sortedTiers = Object.values(tiers).sort((a, b) => a.priceMonthly - b.priceMonthly);

  const getDisplayPrice = (t) => {
    if (t.id === 'free') return { amount: '₹0', label: 'Free' };
    const rate = billingCycle === 'annual' ? t.priceAnnual : t.priceMonthly;
    const period = billingCycle === 'annual' ? '/year' : '/mo';
    return { amount: `₹${rate}`, period };
  };

  const getAnnualTotal = (t) => {
    if (t.id === 'free') return null;
    const monthlyTotal = t.priceMonthly * 12;
    const annualTotal = t.priceAnnual * 12;
    const savings = monthlyTotal - annualTotal;
    return { monthlyTotal, annualTotal, savings };
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex justify-center gap-4">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            billingCycle === 'monthly'
              ? 'bg-primary text-white'
              : 'bg-border text-text/70 hover:bg-border/80'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`px-4 py-2 rounded-lg font-medium transition-all relative ${
            billingCycle === 'annual'
              ? 'bg-primary text-white'
              : 'bg-border text-text/70 hover:bg-border/80'
          }`}
        >
          Annual
          <span className="absolute -top-2 -right-4 bg-accent px-2 py-1 rounded text-xs font-semibold text-white whitespace-nowrap">
            Save ~20%
          </span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {sortedTiers.map((tier, idx) => {
          const isCurrentTier = currentTier === tier.id;
          const isPopular = tier.badge === 'Popular';
          const d = getDisplayPrice(tier);
          const annual = getAnnualTotal(tier);

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative rounded-xl border transition-all ${
                isPopular
                  ? 'border-accent/50 ring-2 ring-accent/20 lg:scale-105'
                  : 'border-border hover:border-accent/30'
              } p-6`}
              style={{
                background: isPopular
                  ? 'linear-gradient(135deg, rgba(255,77,28,0.05), rgba(0,200,150,0.05))'
                  : 'rgba(255,255,255,0.02)',
              }}
            >
              {isPopular && (
                <div className="absolute -top-3 left-4 bg-accent px-3 py-1 rounded-full text-xs font-semibold text-bg">
                  {tier.badge}
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-text mb-1">
                  {tier.displayName}
                </h3>
                <p className="text-xs text-text/70 mb-4">{tier.description}</p>

                <div className="mb-2">
                  <span className="text-3xl font-bold text-white">
                    {d.amount}
                  </span>
                  {d.period && (
                    <span className="text-text/70 ml-1 text-sm">{d.period}</span>
                  )}
                </div>
                {billingCycle === 'annual' && tier.id !== 'free' && (
                  <p className="text-xs text-accent font-medium">
                    ₹{annual.monthlyTotal}/yr — save ₹{annual.savings}
                  </p>
                )}
                {tier.id === 'free' && (
                  <p className="text-xs text-text/50">Forever free</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect?.(tier.id)}
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 mb-6 ${
                  isCurrentTier
                    ? 'bg-border text-text/70 cursor-default'
                    : 'text-white border border-accent/30 hover:bg-accent/10 hover:border-accent/50'
                }`}
                style={{
                  background: isCurrentTier
                    ? 'rgba(255,255,255,0.05)'
                    : `rgba(${tier.color === '#FF4D1C' ? '255,77,28' : tier.color === '#00C896' ? '0,200,150' : '79,110,247'}, 0.1)`,
                }}
              >
                {isCurrentTier ? '✓ Current Plan' : tier.id === 'free' ? 'Get Started Free' : 'Subscribe'}
                {!isCurrentTier && <ArrowRight size={16} />}
              </motion.button>

              <div className="space-y-2 text-sm">
                {tier.features_list.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-text/80">
                    <Check size={16} className="mt-0.5 text-accent flex-shrink-0" />
                    <span className="text-xs">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border p-6 overflow-x-auto">
        <h3 className="text-lg font-bold text-text mb-4">Detailed Feature Comparison</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-text/70 font-medium">Feature</th>
              {sortedTiers.map((tier) => (
                <th key={tier.id} className="text-center py-3 px-4 text-text/70 font-medium">
                  <div
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ background: tier.color }}
                  >
                    {tier.displayName}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_FEATURES.map((feature, idx) => {
              const fv = FEATURE_VALUES;
              return (
                <tr key={feature.key} className={`border-b border-border/50 ${idx % 2 === 0 ? 'bg-white/2' : ''}`}>
                  <td className="py-3 px-4 text-text/80 font-medium">{feature.label}</td>
                  {sortedTiers.map((tier) => {
                    const val = fv[tier.id]?.[feature.key];
                    return (
                      <td key={`${tier.id}-${feature.key}`} className="text-center py-3 px-4">
                        {val === true ? (
                          <Check size={16} className="text-accent mx-auto" />
                        ) : typeof val === 'string' ? (
                          <span className="text-xs text-text/70">{val}</span>
                        ) : (
                          <X size={16} className="text-text/20 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border">
        <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
          <Zap size={20} className="text-accent" />
          Frequently Asked Questions
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-semibold text-text mb-2 text-sm">Can I change plans anytime?</h4>
            <p className="text-xs text-text/70">
              Yes. Upgrades take effect immediately (prorated). Downgrades apply at the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text mb-2 text-sm">Do you offer refunds?</h4>
            <p className="text-xs text-text/70">
              30-day money-back guarantee if you're not satisfied.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text mb-2 text-sm">How many seats do I need?</h4>
            <p className="text-xs text-text/70">
              Pro: 1 seat. Team: minimum 3 seats. Add more anytime.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text mb-2 text-sm">Is there a free trial?</h4>
            <p className="text-xs text-text/70">
              Pro has a 7-day free trial. Team has a 14-day free trial. No credit card required.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text mb-2 text-sm">What payment methods?</h4>
            <p className="text-xs text-text/70">
              Credit/debit cards, UPI, net banking, and wallets via Razorpay.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text mb-2 text-sm">Can I pause billing?</h4>
            <p className="text-xs text-text/70">
              Yes, Team plan supports pause & resume. You pick the duration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingTable;
