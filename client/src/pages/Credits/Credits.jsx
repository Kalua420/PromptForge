import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCreditStore from '../../stores/creditStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import CreditPackCard from '../../components/CreditPackCard';
import Card from '../../components/Card';
import Tabs from '../../components/Tabs';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';

export default function Credits() {
  const navigate = useNavigate();
  const { balance, transactions, packs, isLoading, loadBalance, loadPacks, loadTransactions } = useCreditStore();
  const { currentTier } = useSubscriptionStore();
  const [activeTab, setActiveTab] = useState('buy');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadBalance().catch(console.error);
    loadPacks().catch(console.error);
  }, [loadBalance, loadPacks]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadTransactions().catch(console.error);
    }
  }, [activeTab, loadTransactions]);

  const handlePurchaseSuccess = (pack) => {
    setToast({
      type: 'success',
      message: `Successfully purchased ${pack.name}! ${pack.credits + pack.bonusCredits} credits added to your account.`,
    });
    
    // Reload transactions
    if (activeTab === 'history') {
      loadTransactions().catch(console.error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'usage':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
      case 'refund':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
        );
      case 'bonus':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Credits
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Purchase credits to use premium AI providers beyond your monthly quota
          </p>
        </div>

        {/* Balance Banner */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Current Balance
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {balance.toLocaleString()} <span className="text-2xl text-gray-500">credits</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            {currentTier !== 'free' && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 You're on the <strong>{currentTier}</strong> plan with unlimited prompts. Credits are optional for pay-as-you-go usage.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'buy', label: 'Buy Credits' },
            { id: 'history', label: 'Transaction History' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'buy' && (
            <div>
              {isLoading && packs.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {packs.map((pack) => (
                    <CreditPackCard
                      key={pack.id}
                      pack={pack}
                      onPurchaseSuccess={handlePurchaseSuccess}
                    />
                  ))}
                </div>
              )}

              {/* Credit Cost Info */}
              <Card className="mt-8">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Credit Cost per Generation
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { provider: 'Groq', cost: 1, color: 'orange' },
                      { provider: 'OpenCode', cost: 1, color: 'green' },
                      { provider: 'Gemini', cost: 2, color: 'blue' },
                      { provider: 'SambaNova', cost: 2, color: 'indigo' },
                      { provider: 'Anthropic', cost: 3, color: 'red' },
                    ].map((item) => (
                      <div
                        key={item.provider}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.provider}
                        </span>
                        <span className={`text-sm font-bold text-${item.color}-600 dark:text-${item.color}-400`}>
                          {item.cost} credit{item.cost > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {isLoading && transactions.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader />
                </div>
              ) : transactions.length === 0 ? (
                <Card>
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No transactions yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your credit transaction history will appear here
                    </p>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Balance
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {getTransactionIcon(transaction.type)}
                                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                  {transaction.type}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {transaction.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span
                                className={`text-sm font-semibold ${
                                  transaction.amount > 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {transaction.amount > 0 ? '+' : ''}
                                {transaction.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {transaction.balance.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(transaction.createdAt)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
