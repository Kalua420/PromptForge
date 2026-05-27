import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Zap, Circle, Star, CreditCard, Settings, Shield, Sparkles, Crown } from 'lucide-react';
import { useUiStore } from '../stores/uiStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { useTier } from '../hooks/useTier.js';
import CreditDisplay from './CreditDisplay';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workspace', label: 'Workspace', icon: Zap },
  { to: '/templates', label: 'Templates', icon: Circle },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const user = useAuthStore((s) => s.user);
  const { plan, isPaid, tier } = useTier();

  const planIcons = { free: null, pro: Sparkles, team: Crown };
  const PlanIcon = planIcons[plan];

  if (!sidebarOpen) return null;

  return (
    <aside className="absolute left-0 top-0 h-screen w-64 bg-black/40 backdrop-blur-xl border-r border-border z-40 p-5 flex flex-col gap-1">
      <div className="text-xl font-bold mb-8 px-3 flex items-center gap-2">
        <span className="text-gradient">NexPrompt</span>
        {isPaid && PlanIcon && (
          <PlanIcon size={14} className="text-accent" />
        )}
      </div>
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group ${isActive ? 'bg-primary/15 text-primary' : 'text-text/50 hover:text-text hover:bg-white/[0.04]'}`
            }
          >
            {({ isActive }) => (
              <>
                <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Icon size={18} className={isActive ? 'text-primary' : 'group-hover:text-text transition-colors'} />
                </motion.span>
                {l.label}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: tier.primary }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </>
            )}
          </NavLink>
        );
      })}

      {user?.role === 'admin' && (
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group ${isActive ? 'bg-accent/15 text-accent' : 'text-text/50 hover:text-text hover:bg-white/[0.04]'}`
          }
        >
          {({ isActive }) => (
            <>
              <Shield size={18} className={isActive ? 'text-accent' : 'group-hover:text-text transition-colors'} />
              Admin
              {isActive && (
                <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
              )}
            </>
          )}
        </NavLink>
      )}
      
      <CreditDisplay />
      
      <div className="mt-auto pt-4 border-t border-border px-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          {PlanIcon && <PlanIcon size={12} className="text-accent" />}
          <span className="capitalize">{plan}</span>
          <span className="text-text-muted/50">Plan</span>
        </div>
      </div>
    </aside>
  );
}
