/**
 * Shared Framer Motion animation variants
 */

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export const fadeDown = {
  hidden: { opacity: 0, y: -16 },
  show: { opacity: 1, y: 0 },
};

export const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0 },
};
