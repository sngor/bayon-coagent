# Mobile Optimization Quick Reference Guide

## For Developers

This guide provides quick reference for implementing mobile-friendly features in the application.

---

## 🎯 Key Requirements

- **Minimum Touch Target**: 44x44px (WCAG 2.1 Level AAA)
- **Font Size on Mobile**: 16px (text-base) to prevent iOS zoom
- **Single Column Layout**: Below 768px viewport width
- **Appropriate Keyboards**: Auto-detect input types for mobile

---

## 📱 Using Mobile-Optimized Components

### Input Fields

The Input component automatically detects appropriate keyboard types:

```tsx
// Email field - automatically gets type="email"
<Input name="email" placeholder="your@email.com" />

// Phone field - automatically gets type="tel"
<Input name="phone" placeholder="(555) 123-4567" />

// URL field - automatically gets type="url"
<Input name="website" placeholder="https://example.com" />

// Number field - automatically gets type="number"
<Input name="yearsOfExperience" placeholder="10" />

// Override auto-detection if needed
<Input name="email" type="text" />
```

### Buttons

All button sizes meet touch target requirements:

```tsx
<Button size="default">Default (44px)</Button>
<Button size="sm">Small (40px)</Button>
<Button size="lg">Large (48px)</Button>
<Button size="xl">Extra Large (52px)</Button>
<Button size="icon">Icon (44x44px)</Button>
```

### Cards

Cards automatically adjust padding for mobile:

```tsx
<Card>
  <CardHeader>
    {" "}
    {/* p-4 on mobile, p-6 on desktop */}
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {" "}
    {/* p-4 on mobile, p-6 on desktop */}
    Content
  </CardContent>
  <CardFooter>
    {" "}
    {/* Stacks vertically on mobile */}
    <Button>Action 1</Button>
    <Button>Action 2</Button>
  </CardFooter>
</Card>
```

---

## 🔧 Utility Functions

### Import the utilities:

```tsx
import {
  getInputType,
  isMobileViewport,
  isTabletViewport,
  getMobileClasses,
  auditMobileResponsiveness,
  MIN_TOUCH_TARGET_SIZE,
  BREAKPOINTS,
} from "@/lib/mobile-optimization";
```

### Check viewport size:

```tsx
if (isMobileViewport()) {
  // Show mobile-specific UI
}

if (isTabletViewport()) {
  // Show tablet-specific UI
}
```

### Get appropriate input type:

```tsx
const inputType = getInputType("email"); // Returns 'email'
const inputType = getInputType("phone"); // Returns 'tel'
const inputType = getInputType("website"); // Returns 'url'
```

### Add mobile-friendly classes:

```tsx
const classes = getMobileClasses("button", "bg-primary text-white");
// Returns: 'min-h-[44px] min-w-[44px] touch-manipulation bg-primary text-white'
```

### Audit page for mobile issues:

```tsx
const results = auditMobileResponsiveness();
console.log(results);
// {
//   issues: ['Page has horizontal overflow'],
//   warnings: ['5 interactive elements are smaller than 44x44px'],
//   passed: false
// }
```

---

## 📐 Responsive Layout Patterns

### Single Column on Mobile

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

### Stack on Mobile, Row on Desktop

```tsx
<div className="flex flex-col sm:flex-row gap-4">{/* Content */}</div>
```

### Responsive Padding

```tsx
<div className="p-4 sm:p-6 md:p-8">{/* Content */}</div>
```

### Responsive Text Size

```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl">Heading</h1>
```

---

## ✅ Mobile Optimization Checklist

When creating a new page or component:

- [ ] All buttons meet 44x44px minimum
- [ ] Form inputs use appropriate keyboard types
- [ ] Layout uses single column on mobile
- [ ] No horizontal scrolling on mobile
- [ ] Text is readable without zooming (16px minimum)
- [ ] Touch targets have adequate spacing
- [ ] Cards and containers use responsive padding
- [ ] Test on actual mobile devices or DevTools

---

## 🧪 Testing

### Manual Testing

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these viewports:
   - 320px (iPhone SE)
   - 375px (iPhone 12/13)
   - 414px (iPhone 12 Pro Max)
   - 768px (iPad)
   - 1024px (iPad Pro)

### Automated Testing

```bash
# Run mobile optimization tests
npm test -- mobile-optimization.test.ts

# Run all tests
npm test
```

### Visual Testing

Visit the mobile test page:

```
http://localhost:3000/mobile-test
```

---

## 🎨 Tailwind Classes Reference

### Touch-Friendly Sizes

```css
min-h-[44px]  /* Minimum height for touch targets */
min-w-[44px]  /* Minimum width for touch targets */
touch-manipulation  /* Improves touch responsiveness */
```

### Responsive Text

```css
text-base     /* 16px - prevents iOS zoom */
sm:text-sm    /* 14px on desktop */
```

### Responsive Spacing

```css
p-4 sm:p-6    /* 16px mobile, 24px desktop */
gap-4 md:gap-6  /* 16px mobile, 24px desktop */
space-y-4 md:space-y-6  /* Vertical spacing */
```

---

## 🐛 Common Issues and Solutions

### Issue: iOS zooms in on input focus

**Solution**: Use `text-base` on mobile

```tsx
<Input className="text-base sm:text-sm" />
```

### Issue: Buttons too small on mobile

**Solution**: Use `min-h-[44px]` instead of `h-10`

```tsx
<Button className="min-h-[44px]">Click Me</Button>
```

### Issue: Horizontal scrolling on mobile

**Solution**: Use responsive grid classes

```tsx
<div className="grid grid-cols-1 md:grid-cols-2">{/* Content */}</div>
```

### Issue: Wrong keyboard on mobile

**Solution**: Let Input component auto-detect or specify type

```tsx
<Input name="email" /> {/* Auto-detects email keyboard */}
<Input type="tel" />   {/* Explicitly set phone keyboard */}
```

---

## 📚 Resources

- [WCAG 2.1 Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [iOS Safari Input Zoom Prevention](https://stackoverflow.com/questions/2989263/disable-auto-zoom-in-input-text-tag-safari-on-iphone)
- [Mobile Input Types](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types)
- [Touch-action CSS Property](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)

---

## 🔄 Migration Guide

### Updating Existing Components

If you have existing components that need mobile optimization:

1. **Update Input fields**:

   ```tsx
   // Before
   <input type="text" name="email" className="h-10" />

   // After
   <Input name="email" /> {/* Auto-detects type="email" */}
   ```

2. **Update Buttons**:

   ```tsx
   // Before
   <button className="h-10 px-4">Click</button>

   // After
   <Button>Click</Button> {/* Already min-h-[44px] */}
   ```

3. **Update Layouts**:

   ```tsx
   // Before
   <div className="grid grid-cols-3">

   // After
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
   ```

---

## 💡 Best Practices

1. **Always test on real devices** - Emulators don't capture all touch interactions
2. **Use semantic HTML** - Proper elements improve accessibility
3. **Maintain consistent spacing** - Use Tailwind's spacing scale
4. **Avoid fixed widths** - Use responsive units (%, rem, etc.)
5. **Test with different font sizes** - Users may have accessibility settings
6. **Consider landscape orientation** - Test both portrait and landscape
7. **Optimize images** - Use responsive images with srcset
8. **Minimize tap delays** - Use `touch-manipulation` CSS property

---

## 📞 Support

If you encounter issues with mobile optimization:

1. Check the [Mobile Optimization Summary](./MOBILE_OPTIMIZATION_SUMMARY.md)
2. Run the audit function: `auditMobileResponsiveness()`
3. Visit the test page: `/mobile-test`
4. Review component documentation in `src/components/ui/`

---

**Last Updated**: Task 24 Implementation
**Version**: 1.0.0
