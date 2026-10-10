import { motion } from 'motion/react';

const DRAW = { duration: 1.15, ease: [0.25, 1, 0.5, 1] as const };

interface ShieldLogoProps {
  className?: string;
  animated?: boolean;
}

export function ShieldLogo({ className = '', animated = false }: ShieldLogoProps) {
  const fill = {
    initial: animated ? { opacity: 0 } : false,
    animate: animated ? { opacity: 1 } : undefined,
    transition: { duration: 0.7, ease: DRAW.ease },
  };
  const stroke = {
    initial: animated ? { pathLength: 0 } : false,
    animate: animated ? { pathLength: 1 } : undefined,
    transition: DRAW,
  };

  return (
    <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M50 5 L90 25 L90 80 L50 115 L10 80 L10 25 Z"
        stroke="currentColor"
        strokeWidth="4"
        {...stroke}
      />
      <motion.path d="M50 11 L84 28 L84 77 L50 107 L16 77 L16 28 Z" fill="#0A0A0A" {...fill} />
      <motion.path
        d="M50 35 L48 45 L40 50 L38 55 L45 53 L50 63 L55 53 L62 55 L60 50 L52 45 Z"
        fill="currentColor"
        {...fill}
      />
      <motion.path
        d="M35 30 Q41 35 47 41 M65 30 Q59 35 53 41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        {...stroke}
      />
    </svg>
  );
}