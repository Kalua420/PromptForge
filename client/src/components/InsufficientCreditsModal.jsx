import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import Button from './Button';

export default function InsufficientCreditsModal({ isOpen, onClose, balance, required, provider }) {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    onClose();
    navigate('/credits');
  };

  const handleUpgradePlan = () => {
    onClose();
    navigate('/subscription');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insufficient Credits">
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Not Enough Credits
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You need <strong>{required}</strong> credit{required > 1 ? 's' : ''} to generate with{' '}
            <strong>{provider}</strong>, but you only have <strong>{balance}</strong> credit
            {balance !== 1 ? 's' : ''}.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Credit Costs per Generation
          </h4>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex justify-between">
              <span>Groq, OpenCode:</span>
              <span className="font-semibold">1 credit</span>
            </div>
            <div className="flex justify-between">
              <span>Gemini, SambaNova:</span>
              <span className="font-semibold">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span>Anthropic:</span>
              <span className="font-semibold">3 credits</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={handleBuyCredits} className="w-full" variant="primary">
            Buy Credits
          </Button>
          <Button onClick={handleUpgradePlan} className="w-full" variant="secondary">
            Upgrade to Pro (Unlimited)
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Pro and Team plans include unlimited prompts with all providers
        </p>
      </div>
    </Modal>
  );
}
