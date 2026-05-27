import React from 'react';
import { motion } from 'framer-motion';
import { useTier } from '../hooks/useTier.js';

const glowMap = {
  free: 'shadow-lg shadow-primary/20',
  pro: 'shadow-lg shadow-[rgba(255,77,28,0.2)]',
  team: 'shadow-lg shadow-[rgba(0,200,150,0.2)]',
};

export default function Button({ children, variant = 'primary', className = '', loading, disabled, ...props }) {
  const { plan, tier } = useTier();
  const base = 'px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2';
  const variants = {
    primary: `bg-primary hover:brightness-110 text-white ${glowMap[plan] || glowMap.free}`,
    ghost: 'bg-transparent border border-border hover:border-primary/40 hover:bg-white/[0.03] text-text',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20',
  };
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      className={`${base} ${variants[variant]} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block"
        />
      )}
      {children}
    </motion.button>
  );
}
