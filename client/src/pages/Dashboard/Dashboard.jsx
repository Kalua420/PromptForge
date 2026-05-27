import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Plus, LogOut, FileText, Star, Zap, Sparkles, Crown, MessageSquare, BarChart3, TrendingUp, Clock, ArrowRight, X } from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import PromptCard from '../../components/PromptCard.jsx';
import Loader from '../../components/Loader.jsx';
import api from '../../utils/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import { usePromptStore } from '../../stores/promptStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { useTier } from '../../hooks/useTier.js';
import { useSubscriptionStore } from '../../stores/subscriptionStore.js';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const planIcons = { free: null, pro: Sparkles, team: Crown };

const statColors = {
  'text-primary': '#4f6ef7',
  'text-yellow-400': '#facc15',
  'text-accent': '#7b94ff',
  'text-emerald-400': '#34d399',
};

function StatCard({ label, value, icon: Icon, color, subtitle, trend }) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="group relative overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(600px circle at 50% 50%, ${statColors[color] || '#4f6ef7'}10, transparent 40%)` }} />
        <div className="relative flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl bg-black/30 border border-border flex items-center justify-center ${color} shrink-0`}>
            <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text/50 truncate">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color} tabular-nums`}>{value}</p>
            {subtitle && <p className="text-xs text-text/30 mt-0.5">{subtitle}</p>}
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <TrendingUp size={14} />
              {trend}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function QuickAction({ to, icon: Icon, label, description, color }) {
  return (
    <motion.div variants={fadeUp}>
      <Link to={to} className="block group">
        <Card className="relative overflow-hidden cursor-pointer" hover>
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-black/30 border border-border flex items-center justify-center ${color} shrink-0 group-hover:scale-110 transition-transform`}>
              <Icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm group-hover:text-primary transition-colors">{label}</p>
              <p className="text-xs text-text/40 mt-0.5">{description}</p>
            </div>
            <ArrowRight size={16} className="text-text/20 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function UsageBar({ label, used, limit, color }) {
  const pct = limit ? Math.min(Math.round((used / limit) * 100), 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-text/50">{label}</span>
        <span className="text-text/30">{limit ? `${used} / ${limit}` : used}</span>
      </div>
      {limit && (
        <div className="h-1.5 rounded-full bg-black/30 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${pct > 90 ? 'bg-red-400' : pct > 75 ? 'bg-yellow-400' : color}`}
          />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { prompts, setPrompts, removePrompt } = usePromptStore();
  const navigate = useNavigate();
  const location = useLocation();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const { plan, tier, isPaid } = useTier();
  const getLimit = useSubscriptionStore((s) => s.getLimit);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ prompts: 0, favorites: 0, conversations: 0 });
  const [recentConversations, setRecentConversations] = useState([]);
  const [usage, setUsage] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [showWelcome, setShowWelcome] = useState(location.state?.welcome || false);
  const welcomeCredits = location.state?.credits || 0;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    let cancelled = false;
    async function load() {
      try {
        const [promptsRes, favRes, convRes] = await Promise.all([
          api.get('/api/prompts', { params: { limit: 50 } }),
          api.get('/api/favorites'),
          api.get('/api/conversations'),
        ]);

        if (cancelled) return;

        const promptList = promptsRes.data?.prompts || [];
        const favList = favRes.data || [];
        const convList = convRes.data || [];

        setPrompts(promptList);
        setFavoriteIds(new Set(favList.map(p => p.id)));
        setStats({
          prompts: promptList.length,
          favorites: favList.length,
          conversations: convList.length,
        });
        setRecentConversations(convList.slice(0, 5));

        if (isPaid) {
          try {
            const usageRes = await api.get('/api/subscription/usage');
            if (!cancelled) setUsage(usageRes.data?.current || null);
          } catch { /* usage optional */ }
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user, navigate]);

  const handleDelete = useCallback(async (id) => {
    await api.delete(`/api/prompts/${id}`);
    removePrompt(id);
    setStats((s) => ({ ...s, prompts: Math.max(0, s.prompts - 1) }));
  }, [removePrompt]);

  const handleToggleFavorite = useCallback(async (promptId) => {
    const isFavorite = favoriteIds.has(promptId);
    
    try {
      if (isFavorite) {
        await api.delete(`/api/favorites/${promptId}`);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(promptId);
          return next;
        });
        setStats((s) => ({ ...s, favorites: Math.max(0, s.favorites - 1) }));
      } else {
        await api.post(`/api/favorites/${promptId}`);
        setFavoriteIds((prev) => new Set(prev).add(promptId));
        setStats((s) => ({ ...s, favorites: s.favorites + 1 }));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [favoriteIds]);

  const PlanIcon = planIcons[plan];

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Sidebar />
        <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} p-4 md:p-8 transition-all`}>
          <Loader text="Loading your dashboard..." />
        </div>
      </div>
    );
  }

  const hasPrompts = stats.prompts > 0;
  const hasConversations = stats.conversations > 0;
  const promptsLimit = getLimit('prompts_per_month');
  const usageLimit = promptsLimit ? { used: usage?.promptsUsed || 0, limit: promptsLimit } : null;

  return (
    <div className="min-h-screen bg-bg bg-grid">
      <Sidebar />
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} p-4 md:p-8 transition-all`}>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text">
                Welcome to NexPrompt, {user?.name}!
              </p>
              <p className="text-xs text-text/50 mt-0.5">
                Your account has been created with <span className="text-primary font-medium">{welcomeCredits} credits</span>. Start crafting your first prompt.
              </p>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="text-text/30 hover:text-text transition-colors shrink-0 p-1"
              aria-label="Dismiss welcome message"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
        <div className="flex items-center justify-between mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              {isPaid && PlanIcon && (
                <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border"
                  style={{ borderColor: tier.border, backgroundColor: tier.primary + '15', color: tier.primary }}>
                  <PlanIcon size={11} />
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
              )}
            </div>
            <p className="text-text/50 text-sm mt-1">
              Welcome back, <span className="text-primary">{user?.name}</span>
              {hasPrompts && <span className="text-text/30"> &middot; {stats.prompts} prompt{stats.prompts !== 1 ? 's' : ''} created</span>}
            </p>
          </motion.div>
          <div className="flex gap-3 items-center">
            <button onClick={toggleSidebar} className="text-text/30 hover:text-text md:hidden transition-colors"><Menu size={20} /></button>
            <Link to="/workspace"><Button><Plus size={16} /> New prompt</Button></Link>
            <Button variant="ghost" onClick={() => { logout(); navigate('/'); }}>
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total prompts" value={stats.prompts} icon={FileText} color="text-primary" subtitle={hasPrompts ? 'Across all conversations' : 'Get started'} />
          <Link to="/favorites">
            <StatCard label="Favorites" value={stats.favorites} icon={Star} color="text-yellow-400" subtitle={stats.favorites > 0 ? 'Saved prompts' : 'Star prompts to save'} />
          </Link>
          <StatCard label="Conversations" value={stats.conversations} icon={MessageSquare} color="text-accent" subtitle={hasConversations ? 'Active threads' : 'Group your prompts'} />
          <StatCard label="Ready to go" value={hasPrompts ? stats.prompts : '0'} icon={Zap} color={hasPrompts ? 'text-emerald-400' : 'text-text/30'} subtitle={hasPrompts ? 'All set' : 'Create your first'} />
        </motion.div>

        {isPaid && usage && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-8">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-primary" />
                <h3 className="text-sm font-medium">Monthly Usage</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UsageBar label="Prompts used" used={usage?.promptsUsed || 0} limit={usageLimit?.limit} color="text-primary" />
                <UsageBar label="Tokens used" used={(usage.tokensUsed || 0).toLocaleString()} limit={null} color="text-accent" />
                {usage.providerBreakdown && Object.keys(usage.providerBreakdown).length > 0 && (
                  <div className="text-xs text-text/40">
                    <span className="text-text/50 block mb-1.5">Providers</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(usage.providerBreakdown).map(([provider, data]) => (
                        <span key={provider} className="px-2 py-0.5 rounded bg-white/5 text-text/50 capitalize">
                          {provider} ({data.prompts || 0})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Recent prompts</h2>
              {hasPrompts && (
                <Link to="/workspace" className="text-xs text-primary hover:text-accent transition-colors flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {hasPrompts && prompts.slice(0, 6).map((p) => (
                <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <PromptCard 
                    prompt={p} 
                    onDelete={handleDelete} 
                    onSelect={(prompt) => navigate('/workspace', {
                      state: {
                        conversationId: prompt.conversationId,
                        promptContent: prompt.content,
                      }
                    })}
                    onFavorite={handleToggleFavorite}
                    isFavorite={favoriteIds.has(p.id)}
                  />
                </motion.div>
              ))}
              {!hasPrompts && (
                <Card>
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                      <FileText size={28} className="text-primary/60" />
                    </div>
                    <p className="text-text/50 text-sm mb-1">No prompts yet</p>
                    <p className="text-text/30 text-xs mb-5">Start crafting your first prompt to see it here.</p>
                    <Link to="/workspace">
                      <Button><Plus size={16} /> Create your first prompt</Button>
                    </Link>
                  </div>
                </Card>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <h2 className="text-lg font-medium mb-4">Quick actions</h2>
            <div className="space-y-3">
              <QuickAction to="/workspace" icon={Plus} label="New prompt" description="Create and optimize" color="text-primary" />
              <QuickAction to="/templates" icon={FileText} label="Browse templates" description="Jumpstart your workflow" color="text-accent" />
              <QuickAction to="/favorites" icon={Star} label="Favorites" description={stats.favorites > 0 ? `${stats.favorites} starred prompts` : 'Star your best prompts'} color="text-yellow-400" />
              <QuickAction to="/workspace" icon={MessageSquare} label="Conversations" description={hasConversations ? `${stats.conversations} active threads` : 'Organize by topic'} color="text-emerald-400" />
              {isPaid && (
                <QuickAction to="/subscription" icon={BarChart3} label="Usage & billing" description="View your plan details" color="text-yellow-400" />
              )}
            </div>

            {hasConversations && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-text/30" />
                  <h3 className="text-xs font-medium text-text/40 uppercase tracking-wider">Recent conversations</h3>
                </div>
                <div className="space-y-2">
                  {recentConversations.map((c) => (
                    <Link key={c.id} to="/workspace" className="block group">
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                        <MessageSquare size={14} className="text-text/20 shrink-0" />
                        <span className="text-sm text-text/50 truncate group-hover:text-text transition-colors">
                          {c.title}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {stats.conversations > 5 && (
                    <Link to="/workspace" className="block text-xs text-primary hover:text-accent transition-colors px-3 pt-1">
                      +{stats.conversations - 5} more
                    </Link>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
