import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../../components/Button.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import api from '../../utils/api.js';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [status, setStatus] = useState(token ? 'verifying' : 'pending');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-verify when token is in URL
  useEffect(() => {
    if (!token) return;
    api
      .post('/api/auth/verify-email', { token })
      .then(({ data }) => {
        login(data.user, data.accessToken, data.refreshToken);
        setStatus('success');
        setTimeout(() => navigate('/dashboard', { state: { welcome: true, credits: data.credits || 0 } }), 2000);
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.error || 'Verification failed. The link may have expired.');
        setStatus('error');
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-bg bg-grid flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-black/20 backdrop-blur-xl border border-border rounded-xl p-8 space-y-6 shadow-2xl text-center"
      >
        {/* Verifying */}
        {status === 'verifying' && (
          <>
            <Loader2 size={40} className="mx-auto text-primary animate-spin" />
            <div>
              <h1 className="text-xl font-bold">Verifying your email…</h1>
              <p className="text-sm text-text/50 mt-1">Just a moment.</p>
            </div>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <CheckCircle2 size={40} className="mx-auto text-green-400" />
            <div>
              <h1 className="text-xl font-bold">Email verified!</h1>
              <p className="text-sm text-text/50 mt-1">Redirecting you to your dashboard…</p>
            </div>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <XCircle size={40} className="mx-auto text-red-400" />
            <div>
              <h1 className="text-xl font-bold">Verification failed</h1>
              <p className="text-sm text-text/50 mt-2">{errorMsg}</p>
            </div>
            <ResendForm prefillEmail={state?.email} />
            <p className="text-sm text-text/50">
              Already verified?{' '}
              <Link to="/login" className="text-primary hover:text-accent transition-colors">Sign in</Link>
            </p>
          </>
        )}

        {/* Pending — just registered, no token in URL */}
        {status === 'pending' && (
          <>
            <MailCheck size={40} className="mx-auto text-primary" />
            <div>
              <h1 className="text-xl font-bold">Check your inbox</h1>
              <p className="text-sm text-text/50 mt-2">
                We sent a verification link to{' '}
                {state?.email
                  ? <strong className="text-text">{state.email}</strong>
                  : 'your email address'
                }
                . Click it to activate your account and receive your 5 free credits.
              </p>
            </div>
            <div className="bg-black/30 border border-border/50 rounded-lg p-4 text-xs text-text/50 text-left space-y-1">
              <p>• Check your spam / junk folder if you don't see it</p>
              <p>• The link expires in 24 hours</p>
            </div>
            <ResendForm prefillEmail={state?.email} />
            <p className="text-sm text-text/50">
              Already verified?{' '}
              <Link to="/login" className="text-primary hover:text-accent transition-colors">Sign in</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

function ResendForm({ prefillEmail = '' }) {
  const [email, setEmail] = useState(prefillEmail);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/resend-verification', { email });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to resend. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <p className="text-sm text-green-400">
        Verification email sent! Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleResend} className="space-y-3 text-left">
      <p className="text-xs text-text/40 text-center">Didn't receive it? Resend below.</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-primary transition-colors placeholder:text-text/30"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button type="submit" className="w-full" loading={loading} variant="ghost">
        Resend verification email
      </Button>
    </form>
  );
}
