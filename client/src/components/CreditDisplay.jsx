import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCreditStore from '../stores/creditStore';

export default function CreditDisplay() {
  const navigate = useNavigate();
  const { balance, loadBalance } = useCreditStore();

  useEffect(() => {
    loadBalance().catch(() => {});
  }, [loadBalance]);

  return (
    <button
      onClick={() => navigate('/subscription')}
      className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-600 hover:to-blue-600 border border-white/10 shadow-lg backdrop-blur-sm transition-all text-sm font-medium text-white"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{balance.toLocaleString()}</span>
    </button>
  );
}
