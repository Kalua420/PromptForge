import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Shield, MailCheck } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import api from '../../utils/api.js';
import { getApiError } from '../../utils/errors.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      login(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      const data = err?.response?.data;
      if (data?.requiresVerification) {
        setUnverifiedEmail(data.email || email);
      } else {
        setError(getApiError(err, 'Login failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Unverified account banner
  if (unverifiedEmail) {
    return (
      <div className="min-h-screen bg-bg bg-grid flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-black/20 backdrop-blur-xl border border-border rounded-xl p-8 space-y-5 shadow-2xl text-center"
        >
          <MailCheck size={40} className="mx-auto text-primary" />
          <div>
            <h1 className="text-xl font-bold">Verify your email first</h1>
            <p className="text-sm text-text/50 mt-2">
              Your account hasn't been verified yet. Check your inbox for the verification link we sent to{' '}
              <strong className="text-text">{unverifiedEmail}</strong>.
            </p>
          </div>
          <Button
            className="w-full"
            onClick={() => navigate('/verify-email')}
          >
            Go to verification page
          </Button>
          <button
            onClick={() => setUnverifiedEmail('')}
            className="text-sm text-text/40 hover:text-text transition-colors"
          >
            ← Back to login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg bg-grid flex items-center justify-center px-6">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-black/20 backdrop-blur-xl border border-border rounded-xl p-8 space-y-5 shadow-2xl"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-gradient">Welcome back</span>
          </h1>
          <p className="text-sm text-text/50 mt-1">Sign in to your account</p>
        </div>
        <ErrorMessage message={error} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
        />
        <Button type="submit" className="w-full" loading={loading}>
          <LogIn size={16} />
          Sign in
        </Button>
        <div className="flex justify-between text-sm text-text/50">
          <Link to="/register" className="hover:text-primary transition-colors">Create account</Link>
          <Link to="/forgot-password" className="hover:text-primary transition-colors">Forgot password?</Link>
        </div>
        <div className="text-center pt-2 border-t border-border/50">
          <Link to="/admin/login" className="inline-flex items-center gap-1.5 text-xs text-text/40 hover:text-accent transition-colors">
            <Shield size={12} />
            Admin login
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
