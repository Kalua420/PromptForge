import React from 'react';
import { Lock, Sparkles, Crown } from 'lucide-react';
import Card from './Card.jsx';

const planConfig = {
  free: { label: 'Free', icon: null, className: 'bg-white/5 text-text/50' },
  pro: { label: 'Pro', icon: Sparkles, className: 'bg-primary/10 text-primary' },
  team: { label: 'Team', icon: Crown, className: 'bg-accent/10 text-accent' },
};

export default function TemplateCard({ template, onView, onUse }) {
  const config = planConfig[template.plan] || planConfig.free;
  const Icon = config.icon;

  const handleUse = (e) => {
    e.stopPropagation();
    if (!template.canUse) return;
    onUse?.(template);
  };

  return (
    <Card
      className="flex flex-col h-full cursor-pointer"
      hover={template.canUse}
      onClick={() => template.canUse && onView?.(template)}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-medium truncate flex-1">{template.title}</h3>
        <span className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.className}`}>
          {Icon && <Icon size={12} />}
          {config.label}
        </span>
      </div>
      <p className="text-sm text-text/50 mt-1 line-clamp-2 flex-1">{template.description}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">{template.category}</span>
        {onUse && (
          template.canUse ? (
            <button onClick={handleUse} className="text-xs text-primary hover:text-accent transition-colors font-medium">
              Use template →
            </button>
          ) : (
            <span className="flex items-center gap-1 text-xs text-text/30">
              <Lock size={12} /> Upgrade to use
            </span>
          )
        )}
      </div>
    </Card>
  );
}
