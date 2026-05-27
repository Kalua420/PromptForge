import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import api from '../../utils/api.js';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      if (data.user.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }
      login(data.user, data.accessToken, data.refreshToken);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-black/20 backdrop-blur-xl border border-border rounded-xl p-8 space-y-5 shadow-2xl"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-accent">Admin</span> Login
          </h1>
          <p className="text-sm text-text/50 mt-1">Sign in with your admin account</p>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-center">
            {error}
          </motion.p>
        )}

        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@nexprompt.site" />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
          suffix={
            <button type="button" onClick={() => setShowPassword((p) => !p)} className="text-text/30 hover:text-text transition-colors" tabIndex={-1}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <Button type="submit" className="w-full" loading={loading}>
          <Shield size={16} />
          Sign in as Admin
        </Button>

        <div className="text-center text-sm text-text/50">
          <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
            <ArrowLeft size={14} />
            Back to user login
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
