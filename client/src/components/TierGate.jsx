import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { useSubscriptionStore } from '../stores/subscriptionStore';

const TIER_RANKS = { free: 0, pro: 1, team: 2 };

export function TierGate({
  requiredTier = null,
  feature = null,
  fallback = null,
  showLock = true,
  blurred = false,
  children,
}) {
  const { currentTier, hasFeature } = useSubscriptionStore();

  let hasAccess = false;
  if (feature) {
    hasAccess = hasFeature(feature);
  } else if (requiredTier) {
    hasAccess = TIER_RANKS[currentTier] >= TIER_RANKS[requiredTier];
  } else {
    hasAccess = true;
  }

  if (!hasAccess && fallback) {
    return fallback;
  }

  if (!hasAccess && showLock) {
    return (
      <div
        className={`relative rounded-lg border border-border p-4 ${
          blurred ? 'blur-sm' : ''
        }`}
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Lock size={24} className="text-accent" />
            <span className="text-xs text-text/70">
              {requiredTier ? `Requires ${requiredTier} tier` : 'Premium feature'}
            </span>
          </div>
        </div>
        <div className="pointer-events-none">{children}</div>
      </div>
    );
  }

  return hasAccess ? children : null;
}

export function UpgradePrompt({
  title = 'Upgrade to unlock',
  description = 'This feature is only available in paid plans',
  cta = 'View Plans',
  onUpgrade,
  tier = 'pro',
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-gradient-to-br from-accent/10 to-primary/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-accent">{title}</h3>
          <p className="text-xs text-text/70">{description}</p>
        </div>
        <Lock size={20} className="mt-1 text-accent/50 flex-shrink-0" />
      </div>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="mt-4 flex items-center gap-2 text-xs font-medium text-accent hover:text-primary transition-colors"
        >
          {cta}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

export function FeatureBadge({ tier = 'pro', label = null, size = 'sm' }) {
  const tierColors = {
    free: 'bg-primary/20 text-primary',
    pro: 'bg-orange-500/20 text-orange-400',
    team: 'bg-emerald-500/20 text-emerald-400',
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-block rounded-full font-medium ${tierColors[tier]} ${sizeClasses[size]}`}
    >
      {label || tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}

export function LimitWarning({ used, limit, label }) {
  if (!limit || !used) return null;

  const percentage = Math.round((used / limit) * 100);
  const isWarning = percentage >= 80;
  const isExceeded = percentage >= 100;

  if (!isWarning) return null;

  const bgColor = isExceeded
    ? 'bg-red-500/10 border-red-500/30'
    : 'bg-yellow-500/10 border-yellow-500/30';
  const textColor = isExceeded ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className={`rounded-lg border ${bgColor} p-3`}>
      <p className={`text-xs ${textColor} font-medium`}>
        {label}: {used}/{limit} used ({percentage}%)
        {isExceeded && ' - Limit reached'}
      </p>
      <div className="mt-2 h-1 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            isExceeded ? 'bg-red-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function TierComparison({ tier1 = 'free', tier2 = 'pro', features }) {
  const tierConfigs = {
    free: { name: 'Free', color: '#4f6ef7' },
    pro: { name: 'Pro', color: '#FF4D1C' },
    team: { name: 'Team', color: '#00C896' },
  };

  const hasFeatureInTier = (tier, feature) => {
    const tierFeatures = {
      free: ['basic'],
      pro: ['basic', 'providers', 'exports'],
      team: ['basic', 'providers', 'exports', 'team', 'api'],
    };
    return tierFeatures[tier]?.includes(feature);
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-xs font-medium text-text/70">Feature</div>
        <div
          className="rounded px-2 py-1 text-center text-xs font-semibold text-white"
          style={{ background: tierConfigs[tier1].color }}
        >
          {tierConfigs[tier1].name}
        </div>
        <div
          className="rounded px-2 py-1 text-center text-xs font-semibold text-white"
          style={{ background: tierConfigs[tier2].color }}
        >
          {tierConfigs[tier2].name}
        </div>
        {features?.map((feature) => (
          <React.Fragment key={feature}>
            <div className="text-xs text-text/70">{feature}</div>
            <div className="flex justify-center text-accent">
              {hasFeatureInTier(tier1, feature) ? '✓' : '−'}
            </div>
            <div className="flex justify-center text-accent">
              {hasFeatureInTier(tier2, feature) ? '✓' : '−'}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default TierGate;
