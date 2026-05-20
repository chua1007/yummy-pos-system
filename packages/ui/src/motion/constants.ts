export const duration = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  moderate: 0.3,
  slow: 0.4,
  slower: 0.5,
} as const;

export const easing = {
  default: [0.25, 0.1, 0.25, 1.0] as const,
  enter: [0.0, 0.0, 0.2, 1.0] as const,
  exit: [0.4, 0.0, 1.0, 1.0] as const,
  emphasis: [0.34, 1.56, 0.64, 1.0] as const,
  smooth: [0.4, 0.0, 0.2, 1.0] as const,
} as const;

export const spring = {
  default: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 17 },
  stiff: { type: 'spring' as const, stiffness: 500, damping: 35 },
} as const;
