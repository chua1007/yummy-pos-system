# Frontend & UI/UX Architecture

## Frontend Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    APPLICATIONS (Next.js)                             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│  │  │Dashboard │ │POS       │ │Customer  │ │KDS       │ │Kiosk     │ │    │
│  │  │(SSR/CSR) │ │(PWA/     │ │Ordering  │ │(Real-time│ │(Touch    │ │    │
│  │  │          │ │ Offline) │ │(SSR)     │ │ WebSocket│ │ optimized│ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SHARED PACKAGES                                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│  │  │@yummy/ui │ │@yummy/   │ │@yummy/   │ │@yummy/   │ │@yummy/   │ │    │
│  │  │(Design   │ │hooks     │ │api-client│ │utils     │ │config    │ │    │
│  │  │ System)  │ │          │ │          │ │          │ │          │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    STATE MANAGEMENT                                   │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │ Zustand (Global State)                                        │   │    │
│  │  │  ├── authStore (user, tokens, permissions)                    │   │    │
│  │  │  ├── tenantStore (config, branding, features)                 │   │    │
│  │  │  ├── cartStore (POS cart state)                               │   │    │
│  │  │  ├── orderStore (active orders, real-time)                    │   │    │
│  │  │  ├── uiStore (theme, sidebar, modals)                        │   │    │
│  │  │  └── syncStore (offline queue, sync status)                   │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │ TanStack Query (Server State)                                 │   │    │
│  │  │  ├── Caching & deduplication                                  │   │    │
│  │  │  ├── Background refetching                                    │   │    │
│  │  │  ├── Optimistic updates                                       │   │    │
│  │  │  └── Infinite scroll / pagination                             │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Theme Architecture

### Design Token Strategy

```typescript
// packages/ui/src/tokens/colors.ts
export const colors = {
  // Brand colors (customizable per tenant)
  brand: {
    50: 'var(--color-brand-50)',
    100: 'var(--color-brand-100)',
    // ... 200-800
    900: 'var(--color-brand-900)',
  },

  // Semantic colors (adapt to light/dark)
  surface: {
    primary: 'var(--color-surface-primary)',
    secondary: 'var(--color-surface-secondary)',
    tertiary: 'var(--color-surface-tertiary)',
    elevated: 'var(--color-surface-elevated)',
    overlay: 'var(--color-surface-overlay)',
  },

  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    tertiary: 'var(--color-text-tertiary)',
    inverse: 'var(--color-text-inverse)',
    brand: 'var(--color-text-brand)',
  },

  border: {
    default: 'var(--color-border-default)',
    subtle: 'var(--color-border-subtle)',
    strong: 'var(--color-border-strong)',
  },

  status: {
    success: 'var(--color-status-success)',
    warning: 'var(--color-status-warning)',
    error: 'var(--color-status-error)',
    info: 'var(--color-status-info)',
  },
};
```

### CSS Variable Strategy

```css
/* packages/ui/src/styles/themes/light.css */
:root, [data-theme="light"] {
  /* Surface */
  --color-surface-primary: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-surface-tertiary: #f1f5f9;
  --color-surface-elevated: #ffffff;
  --color-surface-overlay: rgba(0, 0, 0, 0.5);

  /* Text */
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary: #94a3b8;
  --color-text-inverse: #ffffff;

  /* Border */
  --color-border-default: #e2e8f0;
  --color-border-subtle: #f1f5f9;
  --color-border-strong: #cbd5e1;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);

  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-blur: 12px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

/* packages/ui/src/styles/themes/dark.css */
[data-theme="dark"] {
  --color-surface-primary: #0f172a;
  --color-surface-secondary: #1e293b;
  --color-surface-tertiary: #334155;
  --color-surface-elevated: #1e293b;
  --color-surface-overlay: rgba(0, 0, 0, 0.7);

  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-tertiary: #64748b;
  --color-text-inverse: #0f172a;

  --color-border-default: #334155;
  --color-border-subtle: #1e293b;
  --color-border-strong: #475569;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5);

  --glass-bg: rgba(15, 23, 42, 0.8);
  --glass-border: rgba(51, 65, 85, 0.3);
  --glass-blur: 12px;
}
```

### Theme Provider Architecture

```typescript
// packages/ui/src/providers/ThemeProvider.tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  tenantBranding: TenantBranding | null;
  setTenantBranding: (branding: TenantBranding) => void;
}

interface TenantBranding {
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  fontFamily?: string;
  borderRadius?: string;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: (theme) => {
        const resolved = theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          : theme;
        document.documentElement.setAttribute('data-theme', resolved);
        set({ theme, resolvedTheme: resolved });
      },
      tenantBranding: null,
      setTenantBranding: (branding) => {
        // Apply tenant CSS variables
        const root = document.documentElement;
        root.style.setProperty('--color-brand-500', branding.primaryColor);
        // Generate color scale from primary
        set({ tenantBranding: branding });
      },
    }),
    { name: 'yummy-theme' }
  )
);
```

### Tailwind Theme Token Strategy

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: 'var(--color-surface-primary)',
          secondary: 'var(--color-surface-secondary)',
          tertiary: 'var(--color-surface-tertiary)',
          elevated: 'var(--color-surface-elevated)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        border: {
          DEFAULT: 'var(--color-border-default)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
        },
        brand: {
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          900: 'var(--color-brand-900)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
};
```

## Typography System

```css
:root {
  /* Font Scale (modular scale 1.25) */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Letter Spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
}
```

## Spacing System

```css
:root {
  /* 4px base unit */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

## Responsive Layout System

```typescript
// Breakpoints
const breakpoints = {
  sm: '640px',    // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Ultra-wide
};

// Layout patterns
// Dashboard: Sidebar + Main content
// POS: Full-width, touch-optimized
// Mobile: Bottom navigation, stacked layout
// KDS: Grid layout, large text
// Kiosk: Centered, large touch targets
```

## Advanced UI Features Architecture

### Command Palette
```typescript
// Cmd+K global search overlay
// Inspired by Linear, Vercel, Raycast
interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  action: () => void;
  category: 'navigation' | 'action' | 'search';
}
```

### Toast Notification System
```typescript
// Global toast with queue management
// Supports: success, error, warning, info, loading
// Features: auto-dismiss, action buttons, progress bar
// Stack: max 3 visible, FIFO queue
```

### Optimistic UI Updates
```typescript
// TanStack Query optimistic updates pattern
const mutation = useMutation({
  mutationFn: updateOrder,
  onMutate: async (newOrder) => {
    await queryClient.cancelQueries({ queryKey: ['orders'] });
    const previous = queryClient.getQueryData(['orders']);
    queryClient.setQueryData(['orders'], (old) => optimisticUpdate(old, newOrder));
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['orders'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});
```

### Skeleton Loaders
```typescript
// Consistent skeleton components matching actual content layout
// Shimmer animation with CSS gradient
// Respects reduced-motion preference
```

## Accessibility Standards

- **WCAG 2.1 AA** compliance target
- Keyboard navigation for all interactive elements
- Screen reader support with proper ARIA labels
- Focus management for modals and overlays
- Color contrast ratios: 4.5:1 (text), 3:1 (large text/UI)
- Touch targets: minimum 44x44px
- `prefers-reduced-motion` respected globally
- Semantic HTML structure
- Skip navigation links
