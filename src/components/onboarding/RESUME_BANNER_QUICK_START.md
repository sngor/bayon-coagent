# Resume Banner - Quick Start

## 🚀 5-Minute Integration

### Step 1: Import

```tsx
import { ResumeBannerWrapper } from "@/components/onboarding/resume-banner-wrapper";
```

### Step 2: Add to Layout

```tsx
export default function Layout({ children }) {
  return (
    <>
      <ResumeBannerWrapper />
      {children}
    </>
  );
}
```

### Step 3: Done! ✅

The banner will automatically:

- Show when onboarding is incomplete
- Hide when complete
- Be dismissible for current session
- Reappear in new sessions

---

## 📋 What It Does

✅ **Shows Progress**: Displays completion percentage and visual bar
✅ **Next Step**: Shows name of next incomplete step
✅ **Resume Button**: Navigates to next step
✅ **Dismissible**: Can be dismissed for current session
✅ **Reappears**: Shows again in new sessions if incomplete
✅ **Mobile Responsive**: Optimized for all devices
✅ **Accessible**: Full ARIA labels and keyboard navigation

---

## 🎯 Requirements Satisfied

- **5.2**: Resume banner for incomplete flows
- **5.3**: Resume navigation correctness
- **5.4**: Dismissible banner for current session
- **5.5**: Banner reappears in new sessions

---

## 📱 Mobile Optimization

**Mobile (< 768px)**

- Compact text
- Smaller buttons
- Touch-optimized (44x44px)

**Tablet/Desktop**

- Full text and descriptions
- Spacious layout
- Icon displayed

---

## 🔧 Customization

### Custom Styling

```tsx
<ResumeBanner
  nextStepName={nextStepName}
  progress={progress}
  onResume={handleResume}
  onDismiss={handleDismiss}
  className="custom-class"
/>
```

### Custom Logic

```tsx
import { useResumeBanner } from "@/hooks/use-resume-banner";
import { useOnboarding } from "@/hooks/use-onboarding";

const { state, isLoading } = useOnboarding({ userId: "user-123" });
const banner = useResumeBanner({ state, isLoading });

// Use banner.shouldShowBanner, banner.progress, etc.
```

---

## 🧪 Testing

### Quick Test

1. Start onboarding but don't complete
2. Navigate to dashboard
3. Banner should appear
4. Click X to dismiss
5. Refresh page - banner stays hidden
6. Open new tab - banner reappears

### Clear Dismissal

```javascript
sessionStorage.removeItem("onboarding-banner-dismissed");
```

---

## 🐛 Troubleshooting

**Banner not showing?**

- Check user is authenticated
- Verify onboarding is incomplete
- Clear session storage

**Banner won't dismiss?**

- Check browser console for errors
- Verify session storage is accessible

**Wrong next step?**

- Refresh onboarding state
- Check completed steps array

---

## 📚 Full Documentation

- [Complete Guide](./RESUME_BANNER_GUIDE.md)
- [Integration Guide](./RESUME_BANNER_INTEGRATION.md)
- [Task Summary](./.kiro/specs/user-onboarding/TASK_13_RESUME_BANNER_SUMMARY.md)

---

## 💡 Pro Tips

1. Add to main layout for consistent display
2. Use wrapper component for simplest integration
3. Test on mobile devices
4. Monitor dismissal rates
5. Track resume interactions

---

## 🎨 Component API

### ResumeBanner Props

```typescript
interface ResumeBannerProps {
  nextStepName: string; // "Profile Setup"
  progress: number; // 0-100
  onResume: () => void; // Navigate to next step
  onDismiss: () => void; // Dismiss banner
  className?: string; // Optional custom styles
}
```

### useResumeBanner Hook

```typescript
const {
  shouldShowBanner, // boolean
  nextStepName, // string
  progress, // number (0-100)
  nextStepPath, // string
  handleResume, // () => void
  handleDismiss, // () => void
} = useResumeBanner({ state, isLoading });
```

---

## ✨ Features

- 🎯 Smart detection of incomplete onboarding
- 📊 Real-time progress tracking
- 🔄 Automatic state synchronization
- 📱 Mobile-first responsive design
- ♿ Full accessibility support
- 🎨 Smooth Framer Motion animations
- 💾 Session-based dismissal
- 🔒 Type-safe TypeScript

---

**Need help?** Check the [full documentation](./RESUME_BANNER_GUIDE.md) or [integration guide](./RESUME_BANNER_INTEGRATION.md).
