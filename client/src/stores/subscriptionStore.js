import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api.js';

// CREDIT-ONLY SYSTEM - All users have the same features
// Access is controlled by credit balance, not subscription tiers

const DEFAULT_FEATURES = [
  'prompts_unlimited',
  'providers_all',
  'templates_all',
  'history_unlimited',
  'support_email',
  'exports',
  'analytics',
  'fork_prompts',
  'search_history',
  'realtime_streaming',
  'ai_refine',
];

const DEFAULT_LIMITS = {
  prompts_per_month: null, // unlimited
  max_providers: 5,
  domain_strategies: 5,
  history_retention_days: null, // unlimited
  template_domains: 5,
  api_calls_per_minute: null,
};

export const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      isLoading: false,
      error: null,
      usage: null,
      warnings: [],

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setUsage: (usage) => set({ usage }),
      setWarnings: (warnings) => set({ warnings }),

      // All users have access to all features
      hasFeature: (feature) => {
        return DEFAULT_FEATURES.includes(feature);
      },

      getLimit: (limitType) => {
        return DEFAULT_LIMITS[limitType] ?? null;
      },

      loadUsage: async () => {
        try {
          const res = await api.get('/api/subscription/usage');
          set({ usage: res.data.current });
        } catch { /* ignore */ }
      },

      reset: () =>
        set({
          usage: null,
          warnings: [],
          error: null,
        }),

      // Clear cached data
      clearCache: () => {
        try {
          localStorage.removeItem('subscription-storage');
        } catch (e) {
          console.warn('Failed to clear subscription cache:', e);
        }
        set({
          usage: null,
          warnings: [],
          error: null,
        });
      },
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        // Minimal persistence - most data fetched fresh
      }),
    },
  ),
);

export function useFeature(featureName) {
  return useSubscriptionStore((state) => state.hasFeature(featureName));
}

export function useLimit(limitName) {
  return useSubscriptionStore((state) => state.getLimit(limitName));
}
