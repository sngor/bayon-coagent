# UI/UX Enhancement Design Document

## Overview

This design document outlines a world-class UI/UX transformation for the real estate agent marketing platform, inspired by industry leaders like Stripe and Pocus. The goal is to create a sophisticated, premium SaaS experience that combines elegant visual design with powerful AI functionality.

The design philosophy centers on three pillars:

1. **Visual Excellence**: Sophisticated use of gradients, glass effects, depth, and micro-animations
2. **Fluid Interactions**: Physics-based animations, magnetic effects, and smooth transitions
3. **Intelligent Design**: Context-aware UI, progressive disclosure, and data-driven insights

The enhancement will transform the application into a cutting-edge platform that real estate agents are proud to use and show to clients. We'll achieve this through a distinctive visual identity, advanced animation system, interactive data visualizations, and thoughtful attention to every detail.

## Architecture

### Design System Architecture

The design system will be built on top of the existing Tailwind CSS and shadcn/ui foundation, extending it with:

1. **Token System**: Enhanced CSS custom properties for colors, spacing, typography, and animations
2. **Component Library**: Extended shadcn/ui components with additional variants and states
3. **Layout System**: Reusable layout components and patterns
4. **Animation System**: Coordinated animation utilities and presets
5. **Theme System**: Enhanced light/dark mode with smooth transitions

### Component Hierarchy

```
Application
├── Theme Provider (manages light/dark mode)
├── Layout Components
│   ├── AppLayout (sidebar + main content)
│   ├── PageLayout (page header + content)
│   └── SectionLayout (content sections)
├── Navigation Components
│   ├── Sidebar (desktop navigation)
│   ├── MobileNav (mobile navigation)
│   └── Breadcrumbs (contextual navigation)
├── Content Components
│   ├── Cards (various card types)
│   ├── Forms (enhanced form components)
│   ├── Tables (responsive tables)
│   └── Charts (data visualizations)
├── Feedback Components
│   ├── LoadingStates (skeletons, spinners)
│   ├── EmptyStates (no data states)
│   ├── Toasts (notifications)
│   └── Modals (dialogs)
└── Utility Components
    ├── Animations (transition wrappers)
    ├── Icons (icon system)
    └── Typography (text components)
```

### User Flow Architecture

```
Login → Onboarding → Dashboard → Tool Selection → Tool Usage → Results → Next Action
  ↓         ↓           ↓            ↓              ↓           ↓          ↓
Profile   Setup      Overview    Navigation     Execution   Review    Guidance
```

## Components and Interfaces

### 1. Enhanced Design Tokens

```typescript
// src/styles/tokens.ts
export const designTokens = {
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },
  borderRadius: {
    sm: "0.25rem", // 4px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    "2xl": "1.5rem", // 24px
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  },
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "350ms cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
};
```

### 2. Premium Color System with Gradients

```css
/* src/app/globals.css - Premium color tokens */
:root {
  /* Primary gradient palette - Sophisticated blues */
  --primary: 220 60% 50%;
  --primary-hover: 220 60% 45%;
  --primary-active: 220 60% 40%;
  --primary-light: 220 60% 95%;
  --primary-glow: 220 60% 50% / 0.3;

  /* Accent gradient - Purple to blue */
  --accent-start: 260 60% 55%;
  --accent-mid: 240 60% 52%;
  --accent-end: 220 60% 50%;

  /* Success palette with gradient */
  --success: 142 71% 45%;
  --success-light: 142 71% 95%;
  --success-glow: 142 71% 45% / 0.3;

  /* Warning palette with gradient */
  --warning: 38 92% 50%;
  --warning-light: 38 92% 95%;
  --warning-glow: 38 92% 50% / 0.3;

  /* Error palette with gradient */
  --error: 0 84% 60%;
  --error-light: 0 84% 95%;
  --error-glow: 0 84% 60% / 0.3;

  /* Sophisticated neutral palette */
  --gray-50: 220 20% 98%;
  --gray-100: 220 20% 95%;
  --gray-200: 220 15% 90%;
  --gray-300: 220 15% 80%;
  --gray-400: 220 10% 60%;
  --gray-500: 220 10% 45%;
  --gray-600: 220 15% 30%;
  --gray-700: 220 20% 20%;
  --gray-800: 220 25% 12%;
  --gray-900: 220 30% 8%;

  /* Glass morphism */
  --glass-bg: 255 255 255 / 0.7;
  --glass-border: 255 255 255 / 0.2;
  --glass-blur: 12px;

  /* Gradient meshes */
  --gradient-mesh-1: radial-gradient(
    at 0% 0%,
    hsl(var(--primary)) 0px,
    transparent 50%
  );
  --gradient-mesh-2: radial-gradient(
    at 100% 100%,
    hsl(var(--accent-start)) 0px,
    transparent 50%
  );
  --gradient-mesh-3: radial-gradient(
    at 50% 50%,
    hsl(var(--accent-mid)) 0px,
    transparent 50%
  );

  /* Elevation shadows with color */
  --shadow-sm-colored: 0 1px 2px 0 hsl(var(--primary) / 0.05);
  --shadow-md-colored: 0 4px 6px -1px hsl(var(--primary) / 0.1);
  --shadow-lg-colored: 0 10px 15px -3px hsl(var(--primary) / 0.1);
  --shadow-xl-colored: 0 20px 25px -5px hsl(var(--primary) / 0.15);
}
```

### 3. Premium Button Component with Advanced Effects

```typescript
// src/components/ui/button.tsx - Premium variants
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all",
        premium:
          "bg-gradient-to-r from-[hsl(var(--accent-start))] via-[hsl(var(--accent-mid))] to-[hsl(var(--accent-end))] text-white shadow-lg hover:shadow-2xl hover:shadow-[hsl(var(--primary-glow))] hover:-translate-y-1 transition-all duration-300",
        glass:
          "bg-[hsl(var(--glass-bg))] backdrop-blur-xl border border-[hsl(var(--glass-border))] text-foreground hover:bg-white/80 shadow-lg hover:shadow-xl transition-all",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary hover:shadow-md transition-all",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground transition-all",
        magnetic:
          "bg-primary text-primary-foreground shadow-lg hover:shadow-2xl hover:shadow-[hsl(var(--primary-glow))] transition-all cursor-none",
        shimmer:
          "relative overflow-hidden bg-gradient-to-r from-[hsl(var(--accent-start))] via-[hsl(var(--accent-mid))] to-[hsl(var(--accent-end))] bg-[length:200%_100%] animate-shimmer text-white shadow-lg hover:shadow-2xl",
        success:
          "bg-success text-white hover:bg-success/90 shadow-md hover:shadow-lg hover:shadow-[hsl(var(--success-glow))] hover:-translate-y-0.5 transition-all",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
  }
);

// Magnetic button effect (cursor follows)
export function MagneticButton({ children, ...props }: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    buttonRef.current.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;
    buttonRef.current.style.transform = "translate(0, 0)";
  };

  return (
    <Button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Button>
  );
}
```

### 4. Enhanced Card Component

```typescript
// src/components/ui/enhanced-card.tsx
interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered" | "glass" | "gradient";
  interactive?: boolean;
  loading?: boolean;
}

const cardVariants = cva("rounded-xl transition-all duration-300", {
  variants: {
    variant: {
      default: "bg-card border shadow-sm",
      elevated: "bg-card shadow-lg hover:shadow-xl",
      bordered: "bg-card border-2 border-primary/20",
      glass: "bg-card/80 backdrop-blur-sm border shadow-lg",
      gradient:
        "bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20",
    },
    interactive: {
      true: "cursor-pointer hover:scale-[1.02] hover:shadow-xl",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    interactive: false,
  },
});
```

### 5. Loading State Components

```typescript
// src/components/ui/loading-states.tsx

// Skeleton Loader
export function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}

// AI Processing Loader
export function AILoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        {message || "AI is working its magic..."}
      </p>
    </div>
  );
}

// Progress Loader with Steps
export function StepLoader({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="space-y-4 p-6">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
              index < currentStep && "bg-success text-white",
              index === currentStep && "bg-primary text-white animate-pulse",
              index > currentStep && "bg-gray-200 text-gray-400"
            )}
          >
            {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
          </div>
          <span
            className={cn(
              "text-sm transition-colors duration-300",
              index <= currentStep
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### 6. Empty State Components

```typescript
// src/components/ui/empty-states.tsx

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="text-center py-12">
      <CardContent className="space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {description}
          </p>
        </div>
        {action && (
          <Button onClick={action.onClick} size="lg" className="mt-4">
            {action.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### 7. Enhanced Toast System

```typescript
// src/components/ui/enhanced-toast.tsx

export function showSuccessToast(title: string, description?: string) {
  toast({
    title,
    description,
    className: "bg-success-light border-success text-success-foreground",
    duration: 3000,
  });
}

export function showErrorToast(title: string, description?: string) {
  toast({
    variant: "destructive",
    title,
    description,
    duration: 5000,
  });
}

export function showAIToast(title: string, description?: string) {
  toast({
    title,
    description,
    className:
      "bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary",
    duration: 4000,
  });
}
```

### 8. Premium Page Layout with Orchestrated Animations

```typescript
// src/components/layouts/page-layout.tsx

interface PageLayoutProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  children: React.ReactNode;
  gradient?: boolean;
}

export function PageLayout({
  title,
  description,
  action,
  breadcrumbs,
  children,
  gradient = false,
}: PageLayoutProps) {
  return (
    <div className="relative">
      {/* Optional gradient mesh background */}
      {gradient && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-primary/10 to-transparent blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-accent-start/10 to-transparent blur-3xl" />
        </div>
      )}

      <div className="space-y-8">
        {/* Breadcrumbs with slide-in animation */}
        {breadcrumbs && (
          <div className="animate-slide-in-right">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        {/* Header with staggered animations */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent animate-fade-in-up">
              {title}
            </h1>
            {description && (
              <p className="text-lg text-muted-foreground animate-fade-in-up animate-delay-100">
                {description}
              </p>
            )}
          </div>
          {action && (
            <div className="animate-fade-in-up animate-delay-200">{action}</div>
          )}
        </div>

        {/* Content with fade-in */}
        <div className="animate-fade-in-up animate-delay-300">{children}</div>
      </div>
    </div>
  );
}
```

### 9. Glass Morphism Card Component

```typescript
// src/components/ui/glass-card.tsx

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: "sm" | "md" | "lg" | "xl";
  tint?: "light" | "dark" | "primary";
  border?: boolean;
  glow?: boolean;
}

export function GlassCard({
  children,
  blur = "md",
  tint = "light",
  border = true,
  glow = false,
  className,
  ...props
}: GlassCardProps) {
  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
  };

  const tintClasses = {
    light: "bg-white/70 dark:bg-gray-900/70",
    dark: "bg-gray-900/70 dark:bg-white/70",
    primary: "bg-primary/10",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        blurClasses[blur],
        tintClasses[tint],
        border && "border border-white/20 dark:border-gray-800/20",
        glow && "shadow-2xl shadow-primary/10 hover:shadow-primary/20",
        "hover:scale-[1.02] hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

### 10. Interactive Data Visualization Components

```typescript
// src/components/ui/animated-chart.tsx

interface AnimatedChartProps {
  data: number[];
  labels: string[];
  type: "line" | "bar" | "area";
  gradient?: boolean;
  interactive?: boolean;
}

export function AnimatedChart({
  data,
  labels,
  type,
  gradient = true,
  interactive = true,
}: AnimatedChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="relative">
      {/* Gradient background */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent-start/5 rounded-xl" />
      )}

      {/* Chart with smooth animations */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            fill="url(#colorGradient)"
            animationDuration={1000}
            animationEasing="ease-out"
          />
          {interactive && (
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Animated number counter
export function AnimatedNumber({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setDisplayValue(Math.floor(start + (end - start) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}
```

### 11. Magnetic Cursor Effect

```typescript
// src/components/ui/magnetic-cursor.tsx

export function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cursorRef.current) return;

      cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;

      // Check if hovering over interactive element
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, [role="button"]');
      setIsHovering(!!isInteractive);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={cursorRef}
      className={cn(
        "fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-50 transition-all duration-200",
        "border-2 border-primary mix-blend-difference",
        isHovering && "scale-150 bg-primary/20"
      )}
      style={{ transform: "translate(-50%, -50%)" }}
    />
  );
}
```

### 12. Particle Effect System

```typescript
// src/components/ui/particle-effect.tsx

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function ParticleEffect({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    // Generate particles
    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 1,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    }));

    setParticles(newParticles);

    // Animate particles
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: p.x,
            top: p.y,
            backgroundColor: p.color,
            opacity: p.life,
            transform: `scale(${p.life})`,
          }}
        />
      ))}
    </div>
  );
}
```

### 13. AI-Powered Personalization System

```typescript
// src/lib/ai-personalization.ts

interface PersonalizationProfile {
  userId: string;
  marketFocus: string[];
  frequentFeatures: Record<string, number>;
  contentPreferences: {
    preferredContentTypes: string[];
    optimalPostingTimes: string[];
    audienceInsights: Record<string, any>;
  };
  workflowPatterns: {
    commonSequences: string[][];
    timeOfDayUsage: Record<string, number>;
  };
  goals: {
    shortTerm: string[];
    longTerm: string[];
    progress: Record<string, number>;
  };
}

export class AIPersonalizationEngine {
  // Track feature usage
  async trackFeatureUsage(userId: string, feature: string) {
    // Update usage patterns
    // Use AI to detect patterns
  }

  // Get personalized dashboard
  async getPersonalizedDashboard(userId: string) {
    const profile = await this.getProfile(userId);

    return {
      priorityActions: await this.getAIPriorityActions(profile),
      suggestedContent: await this.getAISuggestedContent(profile),
      marketInsights: await this.getMarketInsights(profile),
      nextBestActions: await this.getNextBestActions(profile),
    };
  }

  // AI-powered suggestions
  async getAISuggestions(userId: string, context: string) {
    // Use Bedrock to generate contextual suggestions
    const profile = await this.getProfile(userId);

    return await bedrockClient.generateSuggestions({
      profile,
      context,
      marketData: await this.getMarketData(profile.marketFocus),
    });
  }

  // Predict optimal actions
  async predictOptimalActions(userId: string) {
    const profile = await this.getProfile(userId);
    const patterns = profile.workflowPatterns;

    // Use AI to predict what the user likely wants to do next
    return await bedrockClient.predictActions({
      patterns,
      timeOfDay: new Date().getHours(),
      recentActivity: await this.getRecentActivity(userId),
    });
  }
}
```

### 14. Bold Typography System for Real Estate

````typescript
// src/styles/typography.ts

export const realEstateTypography = {
  // Display fonts for impact
  display: {
    hero: {
      fontSize: '4.5rem', // 72px
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    large: {
      fontSize: '3.5rem', // 56px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    medium: {
      fontSize: '2.5rem', // 40px
      fontWeight: 700,
      lineHeight: 1.2,
    },
  },

  // Headings with authority
  heading: {
    h1: {
      fontSize: '2rem', // 32px
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h2: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h3: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.4,
    },
  },

  // Metrics and numbers
  metric: {
    large: {
      fontSize: '3rem', // 48px
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
    },
    medium: {
      fontSize: '2rem', // 32px
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
    },
  },
};

// CSS implementation
```css
/* src/app/globals.css - Typography */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --font-display: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
}

.text-display-hero {
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-display-large {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.text-metric-large {
  font-size: 3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.text-bold-cta {
  font-size: 1.125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
````

````

### 15. Custom Real Estate Icon System

```typescript
// src/components/ui/real-estate-icons.tsx

import { motion } from 'framer-motion';

// Animated house icon
export function HouseIcon({ animated = true }: { animated?: boolean }) {
  if (!animated) {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M12 3l10 9h-3v9h-6v-6H11v6H5v-9H2l10-9z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="w-6 h-6"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <motion.path
        d="M12 3l10 9h-3v9h-6v-6H11v6H5v-9H2l10-9z"
        fill="currentColor"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
    </motion.svg>
  );
}

// Animated chart icon
export function ChartIcon({ animated = true }: { animated?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="w-6 h-6"
      whileHover={animated ? { scale: 1.1 } : {}}
    >
      <motion.rect
        x="4"
        y="14"
        width="4"
        height="6"
        fill="currentColor"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.1 }}
      />
      <motion.rect
        x="10"
        y="10"
        width="4"
        height="10"
        fill="currentColor"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.2 }}
      />
      <motion.rect
        x="16"
        y="6"
        width="4"
        height="14"
        fill="currentColor"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.3 }}
      />
    </motion.svg>
  );
}

// Success checkmark with celebration
export function SuccessIcon() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="w-12 h-12 text-success"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        fill="currentColor"
        opacity={0.2}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
    </motion.svg>
  );
}

// AI sparkle icon
export function AISparkleIcon() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="w-6 h-6"
      animate={{
        rotate: [0, 360],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <motion.path
        d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"
        fill="url(#sparkle-gradient)"
      />
      <defs>
        <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent-start))" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
````

### 16. AI-Powered Dashboard Component

```typescript
// src/components/ai-dashboard.tsx

interface AIDashboardProps {
  userId: string;
}

export function AIDashboard({ userId }: AIDashboardProps) {
  const [personalizedData, setPersonalizedData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // Load AI-personalized dashboard
    const engine = new AIPersonalizationEngine();
    engine.getPersonalizedDashboard(userId).then(setPersonalizedData);
    engine.getAISuggestions(userId, "dashboard").then(setSuggestions);
  }, [userId]);

  return (
    <div className="space-y-8">
      {/* AI-powered greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-display-large"
      >
        Good {getTimeOfDay()}, {userName}
      </motion.div>

      {/* AI-curated priority actions */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <AISparkleIcon />
          <h2 className="text-xl font-bold">AI-Recommended Actions</h2>
        </div>
        <div className="space-y-3">
          {personalizedData?.priorityActions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-start flex items-center justify-center text-white font-bold">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{action.title}</p>
                <p className="text-sm text-muted-foreground">{action.reason}</p>
              </div>
              <Button variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Market insights */}
      <GlassCard>
        <h2 className="text-xl font-bold mb-4">Market Insights</h2>
        {personalizedData?.marketInsights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="mb-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent-start/5"
          >
            <p className="font-semibold">{insight.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {insight.description}
            </p>
          </motion.div>
        ))}
      </GlassCard>
    </div>
  );
}
```

## Data Models

### Theme Configuration

```typescript
// src/types/theme.ts

export interface ThemeConfig {
  mode: "light" | "dark" | "system";
  primaryColor: string;
  accentColor: string;
  borderRadius: "none" | "sm" | "md" | "lg" | "xl";
  animations: "none" | "reduced" | "full";
}

export interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleMode: () => void;
}
```

### Animation Configuration

```typescript
// src/types/animation.ts

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface PageTransition {
  enter: AnimationConfig;
  exit: AnimationConfig;
}

export const defaultAnimations = {
  fadeIn: {
    duration: 300,
    easing: "ease-in-out",
  },
  slideUp: {
    duration: 400,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  scale: {
    duration: 200,
    easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
};
```

### User Flow State

```typescript
// src/types/user-flow.ts

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  steps: OnboardingStep[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface UserFlowContext {
  onboarding: OnboardingState;
  hasSeenFeature: (featureId: string) => boolean;
  markFeatureAsSeen: (featureId: string) => void;
  getNextSuggestedAction: () => SuggestedAction | null;
}

export interface SuggestedAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  priority: "high" | "medium" | "low";
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Theme consistency across components

_For any_ component rendered in the Application, the component should use colors, spacing, and typography from the design token system
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Accessibility focus indicators

_For any_ interactive element, when focused via keyboard navigation, the element should display a visible focus indicator with sufficient contrast
**Validates: Requirements 6.1, 6.3**

### Property 3: Responsive layout adaptation

_For any_ page layout, when the viewport width changes, the layout should adapt appropriately without content overflow or horizontal scrolling
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 4: Loading state presence

_For any_ asynchronous operation, while the operation is pending, the UI should display an appropriate loading indicator
**Validates: Requirements 3.1, 3.2, 8.1**

### Property 5: Empty state guidance

_For any_ data display component, when no data exists, the component should render an empty state with clear next steps
**Validates: Requirements 3.3, 18.4**

### Property 6: Form validation feedback

_For any_ form input, when invalid data is entered, the input should display inline validation feedback immediately
**Validates: Requirements 5.2, 5.4**

### Property 7: Animation respect for reduced motion

_For any_ animation, when the user has enabled reduced motion preferences, the animation should be disabled or simplified
**Validates: Requirements 10.5**

### Property 8: Toast notification dismissal

_For any_ toast notification, the notification should automatically dismiss after its configured duration or when manually dismissed
**Validates: Requirements 11.2, 11.4**

### Property 9: Navigation active state

_For any_ navigation item, when the current route matches the item's route, the item should display an active state indicator
**Validates: Requirements 2.1**

### Property 10: Button interaction feedback

_For any_ button, when clicked, the button should provide immediate visual feedback through state changes
**Validates: Requirements 10.3**

### Property 11: Card hover effects

_For any_ interactive card, when hovered, the card should display hover effects that indicate interactivity
**Validates: Requirements 9.2**

### Property 12: Mobile touch target sizing

_For any_ interactive element on mobile viewport, the element should have a minimum touch target size of 44x44 pixels
**Validates: Requirements 16.1, 4.5**

### Property 13: Color contrast compliance

_For any_ text element, the text should maintain a minimum contrast ratio of 4.5:1 against its background
**Validates: Requirements 6.3**

### Property 14: Skeleton loader shape matching

_For any_ skeleton loader, the skeleton should match the approximate shape and layout of the content it represents
**Validates: Requirements 3.2**

### Property 15: Page transition smoothness

_For any_ page navigation, the transition should complete within 300ms without janky animations
**Validates: Requirements 10.1, 17.2**

### Property 16: Form submission state management

_For any_ form, when submitting, the submit button should be disabled and show loading state until completion
**Validates: Requirements 5.3**

### Property 17: Error recovery options

_For any_ error state, the error message should include actionable recovery options or next steps
**Validates: Requirements 3.5**

### Property 18: Onboarding step progression

_For any_ onboarding flow, completing a step should automatically progress to the next incomplete step
**Validates: Requirements 19.1, 20.1**

### Property 19: Search result filtering

_For any_ search input, typing should filter results in real-time without page reload
**Validates: Requirements 22.2**

### Property 20: Layout visual hierarchy

_For any_ page layout, primary actions should be more visually prominent than secondary actions
**Validates: Requirements 21.3**

## Error Handling

### 1. Network Errors

```typescript
// src/lib/error-handling.ts

export function handleNetworkError(error: Error) {
  showErrorToast(
    "Connection Error",
    "Unable to reach the server. Please check your internet connection."
  );

  // Log to monitoring service
  logError("network_error", error);
}
```

### 2. AI Operation Errors

```typescript
export function handleAIError(error: Error, operation: string) {
  showErrorToast(
    "AI Operation Failed",
    `We couldn't complete ${operation}. Please try again or contact support if the issue persists.`
  );

  // Provide recovery options
  return {
    retry: true,
    fallback: "manual_input",
  };
}
```

### 3. Form Validation Errors

```typescript
export function handleValidationError(errors: Record<string, string[]>) {
  // Display inline errors
  Object.entries(errors).forEach(([field, messages]) => {
    displayInlineError(field, messages[0]);
  });

  // Show summary toast
  showErrorToast(
    "Validation Error",
    "Please correct the highlighted fields and try again."
  );
}
```

### 4. Theme Loading Errors

```typescript
export function handleThemeError(error: Error) {
  // Fallback to default theme
  applyDefaultTheme();

  console.error("Theme loading failed, using defaults:", error);
}
```

## Testing Strategy

### Unit Testing

We'll write unit tests for:

1. **Design Token Utilities**: Test that token functions return correct values
2. **Component Variants**: Test that variant props apply correct classes
3. **Animation Utilities**: Test animation timing and easing functions
4. **Theme Utilities**: Test theme switching and persistence
5. **Layout Calculations**: Test responsive breakpoint logic

Example unit test:

```typescript
// src/components/ui/__tests__/button.test.tsx
describe("Button Component", () => {
  it("applies correct variant classes", () => {
    const { container } = render(<Button variant="ai">Click me</Button>);
    expect(container.firstChild).toHaveClass("bg-gradient-to-r");
  });

  it("shows loading state when pending", () => {
    const { getByRole } = render(<Button disabled>Loading</Button>);
    expect(getByRole("button")).toBeDisabled();
  });
});
```

### Property-Based Testing

We'll use **fast-check** for property-based testing in TypeScript/React.

#### Property Test 1: Theme Consistency

```typescript
// src/__tests__/properties/theme-consistency.test.ts
import fc from "fast-check";

/**
 * Feature: ui-ux-enhancement, Property 1: Theme consistency across components
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */
describe("Property: Theme consistency", () => {
  it("all components use design tokens", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("Button", "Card", "Input", "Select"),
        (componentName) => {
          const component = renderComponent(componentName);
          const styles = getComputedStyle(component);

          // Check that colors come from CSS variables
          const usesTokens =
            styles.color.includes("var(--") ||
            styles.backgroundColor.includes("var(--");

          return usesTokens;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property Test 2: Accessibility Focus Indicators

```typescript
/**
 * Feature: ui-ux-enhancement, Property 2: Accessibility focus indicators
 * Validates: Requirements 6.1, 6.3
 */
describe("Property: Focus indicators", () => {
  it("interactive elements show focus indicators", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("button", "a", "input", "select"),
        (tagName) => {
          const element = document.createElement(tagName);
          element.className = "focus-visible:ring-2";
          document.body.appendChild(element);

          element.focus();
          const styles = getComputedStyle(element);

          // Check for focus indicator
          const hasFocusIndicator =
            styles.outline !== "none" || styles.boxShadow !== "none";

          document.body.removeChild(element);
          return hasFocusIndicator;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property Test 3: Responsive Layout Adaptation

```typescript
/**
 * Feature: ui-ux-enhancement, Property 3: Responsive layout adaptation
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */
describe("Property: Responsive layouts", () => {
  it("layouts adapt without overflow", () => {
    fc.assert(
      fc.property(fc.integer({ min: 320, max: 1920 }), (viewportWidth) => {
        // Set viewport width
        global.innerWidth = viewportWidth;
        window.dispatchEvent(new Event("resize"));

        const layout = render(<PageLayout />);
        const container = layout.container.firstChild as HTMLElement;

        // Check no horizontal overflow
        const hasOverflow = container.scrollWidth > container.clientWidth;

        return !hasOverflow;
      }),
      { numRuns: 100 }
    );
  });
});
```

#### Property Test 4: Loading State Presence

```typescript
/**
 * Feature: ui-ux-enhancement, Property 4: Loading state presence
 * Validates: Requirements 3.1, 3.2, 8.1
 */
describe("Property: Loading states", () => {
  it("async operations show loading indicators", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("fetchData", "generatePlan", "runAudit"),
        async (operation) => {
          const { getByTestId } = render(
            <AsyncComponent operation={operation} />
          );

          // Trigger operation
          fireEvent.click(getByTestId("trigger-button"));

          // Check for loading indicator
          const hasLoader = getByTestId("loading-indicator");

          return hasLoader !== null;
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

#### Property Test 5: Form Validation Feedback

```typescript
/**
 * Feature: ui-ux-enhancement, Property 6: Form validation feedback
 * Validates: Requirements 5.2, 5.4
 */
describe("Property: Form validation", () => {
  it("invalid inputs show immediate feedback", () => {
    fc.assert(
      fc.property(fc.string(), (inputValue) => {
        const { getByRole, queryByText } = render(<EmailInput />);
        const input = getByRole("textbox");

        // Enter invalid email
        fireEvent.change(input, { target: { value: inputValue } });
        fireEvent.blur(input);

        // Check for validation message if invalid
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue);
        const hasError = queryByText(/invalid email/i) !== null;

        return isValidEmail || hasError;
      }),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

We'll write integration tests for:

1. **Complete User Flows**: Test login → dashboard → tool usage flows
2. **Theme Switching**: Test theme changes persist across navigation
3. **Form Submissions**: Test complete form submission flows with validation
4. **Navigation**: Test sidebar navigation and mobile menu
5. **Toast Notifications**: Test notification display and dismissal

### Visual Regression Testing

We'll use **Chromatic** or **Percy** for visual regression testing:

1. Capture screenshots of all major pages in light/dark mode
2. Test responsive layouts at multiple breakpoints
3. Test component variants and states
4. Test animation keyframes

### Accessibility Testing

We'll use **axe-core** and **jest-axe** for automated accessibility testing:

```typescript
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Accessibility", () => {
  it("dashboard has no accessibility violations", async () => {
    const { container } = render(<DashboardPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Performance Testing

We'll test:

1. **Page Load Times**: Ensure pages load within 2 seconds
2. **Animation Performance**: Ensure 60fps during animations
3. **Bundle Size**: Monitor JavaScript bundle size
4. **Image Optimization**: Test progressive image loading

## Implementation Notes

### Phase 1: Foundation (Design System)

- Enhance design tokens and CSS variables
- Create enhanced component variants
- Implement animation system
- Set up theme provider

### Phase 2: Core Components

- Implement loading states
- Implement empty states
- Enhance toast system
- Create layout components

### Phase 3: Page Enhancements

- Redesign login page
- Enhance dashboard layout
- Improve marketing plan page
- Enhance brand audit page
- Improve content engine

### Phase 4: User Flow & Polish

- Implement onboarding flow
- Add breadcrumbs and navigation improvements
- Implement search and filter
- Add micro-interactions
- Performance optimization

### Phase 5: Testing & Refinement

- Write property-based tests
- Conduct accessibility audit
- Visual regression testing
- Performance testing
- User testing and refinement
