import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api.js';
import Input from '../../components/Input';
import PasswordInput from '../../components/PasswordInput';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import { useToast } from '../../hooks/useToast.jsx';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 5) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-green-500' };
  }, [password]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain uppercase, lowercase, and number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/reset-password', { token, password });
      setSuccess(true);
      showToast('Password reset successful! Redirecting to login...', 'success');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-bg bg-grid flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-black/20 backdrop-blur-xl border border-border rounded-xl p-8 text-center animate-fade-in shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text mb-4">Invalid Reset Link</h1>
          <p className="text-text/60 mb-8">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button onClick={() => navigate('/forgot-password')} fullWidth>
            Request New Reset Link
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg bg-grid flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-black/20 backdrop-blur-xl border border-border rounded-xl p-8 text-center animate-fade-in shadow-2xl">
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text mb-4">Password Reset Successful!</h1>
          <p className="text-text/60 mb-6">
            Your password has been successfully reset. You can now login with your new password.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-text/50">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg bg-grid flex items-center justify-center px-6">
      <div className="max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl mb-4 glow-primary">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Reset Password
          </h1>
          <p className="text-text/60">Create a strong new password for your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-black/20 backdrop-blur-xl border border-border rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="animate-shake">
                <ErrorMessage message={error} />
              </div>
            )}

            {/* New Password Field */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                New Password
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text/60 font-medium">Password Strength</span>
                    <span className={`font-semibold ${
                      passwordStrength.score === 1 ? 'text-red-500' :
                      passwordStrength.score === 2 ? 'text-yellow-500' :
                      passwordStrength.score === 3 ? 'text-blue-500' :
                      'text-green-500'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-border/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <div className="mt-3 space-y-1.5">
                <PasswordRequirement 
                  met={password.length >= 8} 
                  text="At least 8 characters"
                />
                <PasswordRequirement 
                  met={/[A-Z]/.test(password)} 
                  text="One uppercase letter"
                />
                <PasswordRequirement 
                  met={/[a-z]/.test(password)} 
                  text="One lowercase letter"
                />
                <PasswordRequirement 
                  met={/\d/.test(password)} 
                  text="One number"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Confirm Password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className={`mt-2 flex items-center gap-2 text-xs font-medium animate-fade-in ${
                  passwordsMatch ? 'text-green-500' : 'text-red-500'
                }`}>
                  {passwordsMatch ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              fullWidth 
              loading={loading}
              className="mt-8"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            {/* Back to Login Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-sm text-text/50 hover:text-primary font-medium transition-colors group"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Login
              </button>
            </div>
          </form>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text/40 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Your password is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}

// Password Requirement Component
function PasswordRequirement({ met, text }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors ${
      met ? 'text-green-500' : 'text-text/40'
    }`}>
      <svg 
        className={`w-4 h-4 transition-all ${met ? 'scale-100' : 'scale-90 opacity-50'}`} 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        {met ? (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        )}
      </svg>
      <span className="font-medium">{text}</span>
    </div>
  );
}
