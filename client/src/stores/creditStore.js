import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useCreditStore = create(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      packs: [],
      isLoading: false,
      error: null,

      // Load credit balance
      loadBalance: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/api/credits/balance');
          set({ balance: response.data.credits, isLoading: false });
          return response.data.credits;
        } catch (error) {
          console.error('Failed to load credit balance:', error);
          set({ error: error.response?.data?.error || 'Failed to load balance', isLoading: false });
          throw error;
        }
      },

      // Load credit packs
      loadPacks: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/api/credits/packs');
          set({ packs: response.data.packs, isLoading: false });
          return response.data.packs;
        } catch (error) {
          console.error('Failed to load credit packs:', error);
          set({ error: error.response?.data?.error || 'Failed to load packs', isLoading: false });
          throw error;
        }
      },

      // Load transaction history
      loadTransactions: async (limit = 50) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/api/credits/transactions?limit=${limit}`);
          set({ transactions: response.data.transactions, isLoading: false });
          return response.data.transactions;
        } catch (error) {
          console.error('Failed to load transactions:', error);
          set({ error: error.response?.data?.error || 'Failed to load transactions', isLoading: false });
          throw error;
        }
      },

      // Purchase credit pack
      purchasePack: async (packId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/api/credits/purchase', { packId });
          set({ isLoading: false });
          return response.data;
        } catch (error) {
          console.error('Failed to create credit order:', error);
          set({ error: error.response?.data?.error || 'Failed to create order', isLoading: false });
          throw error;
        }
      },

      // Verify credit pack purchase
      verifyPurchase: async (paymentData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/api/credits/verify', paymentData);
          if (response.data.success) {
            set({ balance: response.data.credits, isLoading: false });
          }
          return response.data;
        } catch (error) {
          console.error('Failed to verify payment:', error);
          set({ error: error.response?.data?.error || 'Failed to verify payment', isLoading: false });
          throw error;
        }
      },

      // Set balance (called by socket event)
      setBalance: (balance) => {
        set({ balance });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        set({
          balance: 0,
          transactions: [],
          packs: [],
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'credit-storage',
      partialize: (state) => ({
        balance: state.balance,
      }),
    }
  )
);

export { useCreditStore };
export default useCreditStore;
