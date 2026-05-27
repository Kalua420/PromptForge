import React from 'react';
import { motion } from 'framer-motion';

export default function Tabs({ tabs, active, onChange, id = 'tab' }) {
  return (
    <div className="flex gap-1 bg-black/20 rounded-lg p-1 border border-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`relative px-4 py-2 text-sm rounded-md whitespace-nowrap transition-all duration-200 ${
            active === tab
              ? 'text-white'
              : 'text-text/50 hover:text-text hover:bg-white/[0.04]'
          }`}
        >
          {active === tab && (
            <motion.div
              layoutId={`${id}-bg`}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute inset-0 rounded-md bg-primary/30"
            />
          )}
          <span className="relative z-10">{tab}</span>
          {active === tab && (
            <motion.div
              layoutId={`${id}-line`}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-primary"
            />
          )}
        </button>
      ))}
    </div>
  );
}
