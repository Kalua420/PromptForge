import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import api from '../../utils/api.js';
import { getApiError } from '../../utils/errors.js';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError('You must accept the Terms and Conditions to register');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/register', { name, email, password });
      // Account created — redirect to the "check your inbox" screen, pass email for resend pre-fill
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      const data = err?.response?.data;
      // Unverified duplicate — still send them to the pending screen
      if (data?.requiresVerification) {
        navigate('/verify-email', { state: { email } });
        return;
      }
      setError(getApiError(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

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
            <span className="text-gradient">Create account</span>
          </h1>
          <p className="text-sm text-text/50 mt-1">Start crafting perfect prompts</p>
        </div>
        <ErrorMessage message={error} />
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="At least 8 characters"
        />

        <div className="flex items-start gap-3 p-4 bg-black/30 border border-border/50 rounded-lg">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border bg-black/50 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
            required
          />
          <label htmlFor="terms" className="text-sm text-text/70 leading-relaxed cursor-pointer">
            I agree to the{' '}
            <Link to="/legal/terms" target="_blank" className="text-primary hover:text-accent transition-colors underline">
              Terms and Conditions
            </Link>
            {' '}and{' '}
            <Link to="/legal/privacy" target="_blank" className="text-primary hover:text-accent transition-colors underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          <UserPlus size={16} />
          Get started
        </Button>
        <p className="text-sm text-center text-text/50">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-accent transition-colors">Sign in</Link>
        </p>
      </motion.form>
    </div>
  );
}
