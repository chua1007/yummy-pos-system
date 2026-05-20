# Motion Design & UI Transitions

## Animation Philosophy

Yummy's motion design follows these principles:
- **Purposeful**: Every animation communicates state change or spatial relationship
- **Performant**: GPU-accelerated transforms only (translate, scale, rotate, opacity)
- **Subtle**: Enhance without distracting from the task
- **Consistent**: Shared timing and easing across the platform
- **Accessible**: Respects `prefers-reduced-motion`

## Animation Duration Standards

```typescript
// packages/ui/src/motion/constants.ts
export const duration = {
  instant: 100,    // Micro-interactions (button press, toggle)
  fast: 150,       // Tooltips, small state changes
  normal: 200,     // Standard transitions (modals, dropdowns)
  moderate: 300,   // Page transitions, panel slides
  slow: 400,       // Complex animations (charts, onboarding)
  slower: 500,     // Dramatic reveals (first-time experiences)
} as const;
```

## Easing Standards

```typescript
// packages/ui/src/motion/easings.ts
export const easing = {
  // Standard easing for most transitions
  default: [0.25, 0.1, 0.25, 1.0],

  // Enter: elements appearing (decelerate)
  enter: [0.0, 0.0, 0.2, 1.0],

  // Exit: elements disappearing (accelerate)
  exit: [0.4, 0.0, 1.0, 1.0],

  // Emphasis: attention-grabbing (overshoot)
  emphasis: [0.34, 1.56, 0.64, 1.0],

  // Spring-like for interactive elements
  spring: { type: 'spring', stiffness: 300, damping: 30 },

  // Smooth for continuous animations
  smooth: [0.4, 0.0, 0.2, 1.0],
} as const;
```

## Reusable Animation Variants (Framer Motion)

```typescript
// packages/ui/src/motion/variants.ts
import { Variants } from 'framer-motion';

// Fade in/out
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// Slide up (for modals, toasts, bottom sheets)
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

// Slide from side (for sidebars, panels)
export const slideFromLeftVariants: Variants = {
  hidden: { x: -280, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: -280, opacity: 0, transition: { duration: 0.2 } },
};

// Scale (for dropdowns, popovers)
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.1 } },
};

// Stagger children (for lists, grids)
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// Page transition
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

// Counter animation (for dashboard numbers)
export const counterVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};
```

## Shared Motion Components

```typescript
// packages/ui/src/motion/components/AnimatedPresence.tsx
import { AnimatePresence, motion } from 'framer-motion';

// Animated page wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Animated counter (revenue, order count)
export function AnimatedCounter({ value, prefix = '', suffix = '' }: Props) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return controls.stop;
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

// Animated list with stagger
export function AnimatedList({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={staggerItemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Skeleton with shimmer
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-tertiary',
        'relative overflow-hidden',
        'after:absolute after:inset-0',
        'after:translate-x-[-100%] after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent',
        'after:via-white/10 after:to-transparent',
        className
      )}
    />
  );
}
```

## Interaction-Specific Animations

### Navigation Animations

```typescript
// Animated sidebar
const sidebarVariants = {
  expanded: { width: 280, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  collapsed: { width: 72, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

// Tab indicator (sliding underline)
const tabIndicatorStyle = {
  position: 'absolute',
  bottom: 0,
  height: 2,
  backgroundColor: 'var(--color-brand-500)',
  transition: 'left 0.2s ease, width 0.2s ease',
};

// Route change transition
// Uses Next.js App Router with Framer Motion layout animations
```

### Dashboard Animations

```typescript
// Widget expand/collapse
const widgetVariants = {
  collapsed: { height: 'auto' },
  expanded: { height: 'auto', transition: { type: 'spring', stiffness: 200, damping: 25 } },
};

// Chart data animation
// Use Framer Motion's useSpring for smooth data transitions
// Animate path morphing for line/area charts

// Real-time counter updates
// Spring animation for number changes
// Color flash on significant changes (green for up, red for down)
```

### POS System Animations

```typescript
// Cart item add animation
const cartItemAdd = {
  initial: { opacity: 0, height: 0, scale: 0.8 },
  animate: { opacity: 1, height: 'auto', scale: 1 },
  exit: { opacity: 0, height: 0, scale: 0.8 },
  transition: { type: 'spring', stiffness: 300, damping: 25 },
};

// Button tactile feedback
const buttonTap = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

// Order status badge transition
const statusBadge = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: 'spring', stiffness: 500, damping: 30 },
};

// Swipe gestures (table management)
// Use Framer Motion's drag with constraints
// Snap points for swipe actions (edit, delete, move)
```

### Theme Switching Animation

```typescript
// Smooth dark/light mode transition
// Apply transition to background and text colors
document.documentElement.style.setProperty(
  'transition',
  'background-color 0.3s ease, color 0.2s ease'
);

// Animated toggle switch
const themeToggle = {
  light: { x: 0, rotate: 0 },
  dark: { x: 24, rotate: 180 },
  transition: { type: 'spring', stiffness: 300, damping: 20 },
};
```

## Performance Guidelines

### GPU-Accelerated Properties Only
```css
/* GOOD - GPU accelerated */
.animate-good {
  transform: translateX(100px);
  opacity: 0.5;
  will-change: transform, opacity;
}

/* BAD - triggers layout/paint */
.animate-bad {
  left: 100px;      /* triggers layout */
  width: 200px;     /* triggers layout */
  background: red;  /* triggers paint */
}
```

### Reduced Motion Support

```typescript
// packages/ui/src/motion/useReducedMotion.ts
import { useReducedMotion } from 'framer-motion';

export function useMotionPreference() {
  const shouldReduceMotion = useReducedMotion();

  return {
    // Return instant transitions if reduced motion preferred
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { duration: 0.2, ease: [0, 0, 0.2, 1] },

    // Disable spring animations
    spring: shouldReduceMotion
      ? { type: 'tween', duration: 0 }
      : { type: 'spring', stiffness: 300, damping: 30 },
  };
}

// Global CSS fallback
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Performance Budget

| Metric | Target |
|--------|--------|
| Frame rate | 60fps (16.67ms per frame) |
| First animation frame | < 100ms after trigger |
| Total animation duration | < 500ms for transitions |
| Concurrent animations | Max 3 simultaneous |
| Layout shifts | 0 during animations |
| Memory | No animation-related leaks |

## Motion Design Guidelines

1. **Enter > Exit**: Entry animations can be slightly longer than exits
2. **Natural direction**: Elements enter from where they logically come from
3. **Hierarchy**: Important elements animate first, secondary elements follow
4. **Consistency**: Same type of element = same animation everywhere
5. **Interruptible**: All animations can be interrupted by user action
6. **No blocking**: Animations never block user interaction
7. **Progressive**: Complex animations only on capable hardware
