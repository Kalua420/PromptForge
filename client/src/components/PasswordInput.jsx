import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Input from './Input.jsx';

/**
 * Password input with visibility toggle
 */
export default function PasswordInput({ label = 'Password', value, onChange, ...props }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      label={label}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      suffix={
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-text/30 hover:text-text transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
      {...props}
    />
  );
}
