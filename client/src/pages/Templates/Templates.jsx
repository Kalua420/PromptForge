import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Copy, Check, Sparkles, Crown } from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import Input from '../../components/Input.jsx';
import TemplateCard from '../../components/TemplateCard.jsx';
import Tabs from '../../components/Tabs.jsx';
import Modal from '../../components/Modal.jsx';
import Toast from '../../components/Toast.jsx';
import api from '../../utils/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useTemplateStore } from '../../stores/templateStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const categories = ['All', 'chatbot', 'coding', 'writing', 'research', 'image'];

// Labels shown in UI → values sent to API
const planFilterOptions = [
  { label: 'All Plans', value: '' },
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' },
  { label: 'Team', value: 'team' },
];
const planFilterLabels = planFilterOptions.map((p) => p.label);

const planBadge = {
  free: { label: 'Free', icon: null, className: 'bg-white/5 text-text/50' },
  pro: { label: 'Pro', icon: Sparkles, className: 'bg-primary/10 text-primary' },
  team: { label: 'Team', icon: Crown, className: 'bg-accent/10 text-accent' },
};

export default function Templates() {
  const { templates, setTemplates, filter, setFilter } = useTemplateStore();
  const [category, setCategory] = useState('All');
  const [planFilterLabel, setPlanFilterLabel] = useState('All Plans');
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'info' });
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  const fetchTemplates = useCallback((searchValue, cat, planLabel) => {
    const planValue = planFilterOptions.find((p) => p.label === planLabel)?.value ?? '';
    const params = {};
    if (cat !== 'All') params.category = cat;
    if (searchValue) params.search = searchValue;
    if (planValue) params.plan = planValue;

    api.get('/api/templates', { params }).then(({ data }) => setTemplates(data)).catch(() => {});
  }, [setTemplates]);

  // Debounced fetch triggered by search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilter(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTemplates(value, category, planFilterLabel);
    }, 350);
  };

  // Immediate fetch when category or plan filter changes
  useEffect(() => {
    if (!hydrated) return;
    fetchTemplates(filter, category, planFilterLabel);
  }, [hydrated, category, planFilterLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleView = (template) => {
    if (!template.canUse) {
      navigate('/subscription');
      return;
    }
    setSelected(template);
    setCopied(false);
  };

  const handleUseTemplate = (template) => {
    navigate('/workspace', { state: { templateContent: template.content } });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selected.content);
      setCopied(true);
      setToast({ message: 'Template copied to clipboard!', visible: true, type: 'success' });
    } catch {
      setToast({ message: 'Failed to copy', visible: true, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-bg bg-grid">
      <Sidebar />
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} p-4 md:p-8 transition-all`}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-2">Template Marketplace</h1>
          <p className="text-text/50 text-sm mb-6">Browse community templates to jumpstart your prompts.</p>
        </motion.div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <Input
              value={filter}
              onChange={handleSearchChange}
              placeholder="Search templates..."
              suffix={<Search size={16} className="text-text/30" />}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <Tabs id="plan" tabs={planFilterLabels} active={planFilterLabel} onChange={setPlanFilterLabel} />
          </div>
        </div>
        <div className="mb-6">
          <Tabs id="category" tabs={categories} active={category} onChange={setCategory} />
        </div>
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t) => (
            <motion.div key={t.id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
              <TemplateCard template={t} onView={handleView} onUse={handleUseTemplate} />
            </motion.div>
          ))}
          {templates.length === 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-text/30 text-center py-16">
              No templates found.
            </motion.p>
          )}
        </motion.div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {(() => {
                const cfg = planBadge[selected.plan] || planBadge.free;
                const Icon = cfg.icon;
                return (
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.className}`}>
                    {Icon && <Icon size={12} />}
                    {cfg.label}
                  </span>
                );
              })()}
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">{selected.category}</span>
            </div>
            <p className="text-sm text-text/70">{selected.description}</p>
            <div className="relative">
              <pre className="text-sm text-text bg-black/30 border border-border rounded-lg p-4 max-h-60 overflow-y-auto whitespace-pre-wrap">{selected.content}</pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:brightness-110 transition-all"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Use template'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
    </div>
  );
}
