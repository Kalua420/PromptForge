import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import CreditPackCard from '../../components/CreditPackCard';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import useCreditStore from '../../stores/creditStore';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../utils/api';

const CREDIT_COST_TABLE = [
  { provider: 'Groq', cost: 1 },
  { provider: 'OpenCode', cost: 1 },
  { provider: 'Gemini', cost: 2 },
  { provider: 'SambaNova', cost: 2 },
  { provider: 'Anthropic', cost: 3 },
];

const TABS = [
  { id: 'buy', label: 'Buy Credits', icon: '💳' },
  { id: 'history', label: 'Purchase History', icon: '📋' },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sidebarOpen } = useUiStore();
  const { isMobile } = useResponsive();
  const { packs, loadPacks } = useCreditStore();
  
  const [activeTab, setActiveTab] = useState('buy');
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [purchaseStats, setPurchaseStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadPacks();
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && user) {
      fetchPurchaseHistory();
      fetchPurchaseStats();
    }
  }, [activeTab, user]);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/payments/history');
      setPurchaseHistory(response.data.payments || []);
    } catch (err) {
      console.error('Failed to fetch purchase history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseStats = async () => {
    try {
      const response = await api.get('/api/payments/stats');
      setPurchaseStats(response.data);
    } catch (err) {
      console.error('Failed to fetch purchase stats:', err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return statusStyles[status] || statusStyles.pending;
  };

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} p-4 md:p-8 transition-all duration-300`}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold mb-3">
              <span className="text-gradient">Subscription & Credits</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-text/70 max-w-2xl mx-auto mb-6">
              Manage your credits and view your purchase history
            </motion.p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-border">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-text/60 hover:text-text'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Buy Credits Tab */}
          {activeTab === 'buy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mb-12">
              <p className="text-sm text-text/70 text-center mb-8 max-w-lg mx-auto">
                Buy credits to generate prompts. Credits work across all AI providers and never expire.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {packs.length > 0 ? packs.map((pack) => (
                  <CreditPackCard
                    key={pack.id}
                    pack={pack}
                    onPurchaseSuccess={() => {
                      loadPacks();
                      fetchPurchaseHistory();
                      fetchPurchaseStats();
                    }}
                  />
                )) : (
                  <div className="col-span-full text-center py-8 text-text/50">
                    Loading credit packs...
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border p-5 bg-paper/50">
                <h4 className="text-sm font-semibold text-text mb-3">Credit Cost per Generation</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {CREDIT_COST_TABLE.map(({ provider, cost }) => (
                    <div key={provider} className="p-3 rounded-lg bg-bg border border-border text-center">
                      <div className="text-xs text-text/60 mb-1">{provider}</div>
                      <div className="font-bold text-accent">{cost} credit{cost > 1 ? 's' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-xl border border-border p-6 bg-gradient-to-br from-primary/5 to-accent/5 mt-8">
                <h3 className="text-lg font-bold text-white mb-6">Frequently Asked Questions</h3>
                <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {[
                    { q: 'How do credits work?', a: 'Each prompt generation consumes credits based on the AI provider. Groq and OpenCode cost 1 credit, Gemini and SambaNova cost 2, Anthropic costs 3.' },
                    { q: 'Do credits expire?', a: 'No, purchased credits never expire. Use them anytime.' },
                    { q: 'What payment methods are accepted?', a: 'Credit/debit cards, UPI, net banking, and wallets via Razorpay.' },
                    { q: 'Can I get a refund?', a: '30-day money-back guarantee if you are not satisfied with your credit purchase.' },
                  ].map((faq, i) => (
                    <div key={i} className="border-l-2 border-accent/30 pl-4">
                      <h4 className="font-semibold text-text mb-1 text-sm">{faq.q}</h4>
                      <p className="text-xs text-text/70">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Purchase History Tab */}
          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              
              {/* Stats Cards */}
              {purchaseStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="rounded-lg border border-border p-4 bg-paper/50">
                    <div className="text-xs text-text/60 mb-1">Total Spent</div>
                    <div className="text-2xl font-bold text-accent">₹{purchaseStats.totalSpent}</div>
                  </div>
                  <div className="rounded-lg border border-border p-4 bg-paper/50">
                    <div className="text-xs text-text/60 mb-1">Total Purchases</div>
                    <div className="text-2xl font-bold text-accent">{purchaseStats.totalPurchases}</div>
                  </div>
                  <div className="rounded-lg border border-border p-4 bg-paper/50">
                    <div className="text-xs text-text/60 mb-1">Credits Purchased</div>
                    <div className="text-2xl font-bold text-accent">{purchaseStats.totalCreditsSpent}</div>
                  </div>
                  <div className="rounded-lg border border-border p-4 bg-paper/50">
                    <div className="text-xs text-text/60 mb-1">Current Balance</div>
                    <div className="text-2xl font-bold text-accent">{purchaseStats.currentBalance}</div>
                  </div>
                </div>
              )}

              {/* Purchase History Table */}
              <div className="rounded-xl border border-border overflow-hidden bg-paper/50">
                {loading ? (
                  <div className="p-8 text-center text-text/50">
                    Loading purchase history...
                  </div>
                ) : purchaseHistory.length === 0 ? (
                  <div className="p-8 text-center text-text/50">
                    No purchases yet. Start by buying your first credit pack!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border bg-bg/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text">Pack</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text">Credits</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text">Price/Credit</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseHistory.map((purchase, idx) => (
                          <tr key={purchase.id} className={idx % 2 === 0 ? 'bg-bg/20' : ''}>
                            <td className="px-4 py-3 text-sm text-text">
                              {formatDate(purchase.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-sm text-text font-medium">
                              {purchase.packName}
                            </td>
                            <td className="px-4 py-3 text-sm text-accent font-semibold">
                              {purchase.creditsGranted}
                            </td>
                            <td className="px-4 py-3 text-sm text-text">
                              ₹{(purchase.amount / 100).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-text/70">
                              ₹{purchase.pricePerCredit}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(purchase.status)}`}>
                                {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
