import { useState } from 'react';
import Button from './Button';
import Card from './Card';
import useCreditStore from '../stores/creditStore';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CreditPackCard({ pack, onPurchaseSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { purchasePack, verifyPurchase, loadBalance } = useCreditStore();

  const totalCredits = pack.credits + pack.bonusCredits;
  const priceInRupees = pack.priceInPaise / 100;
  const pricePerCredit = (priceInRupees / totalCredits).toFixed(2);

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const orderData = await purchasePack(pack.id);

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway. Please try again.');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'NexPrompt',
        description: `${pack.name} - ${totalCredits} credits`,
        handler: async (response) => {
          try {
            await verifyPurchase({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            
            // Reload balance
            await loadBalance();
            
            if (onPurchaseSuccess) {
              onPurchaseSuccess(pack);
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        theme: {
          color: '#4f6ef7',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Failed to initiate purchase:', error);
      alert('Failed to initiate purchase. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <Card className={`relative ${pack.popular ? 'ring-2 ring-purple-500' : ''}`}>
      {pack.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
            ⭐ Popular
          </span>
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {pack.name}
        </h3>
        
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ₹{priceInRupees}
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ₹{pricePerCredit} per credit
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">
              {pack.credits.toLocaleString()} base credits
            </span>
          </div>
          
          {pack.bonusCredits > 0 && (
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                +{pack.bonusCredits.toLocaleString()} bonus credits
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">
              Total: {totalCredits.toLocaleString()} credits
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              Never expires
            </span>
          </div>
        </div>

        <Button
          onClick={handlePurchase}
          disabled={isProcessing}
          className="w-full"
          variant={pack.popular ? 'primary' : 'secondary'}
        >
          {isProcessing ? 'Processing...' : 'Buy Now'}
        </Button>
      </div>
    </Card>
  );
}
