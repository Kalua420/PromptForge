import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable error message component
 */
export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <motion.p
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-center"
    >
      {message}
    </motion.p>
  );
}
