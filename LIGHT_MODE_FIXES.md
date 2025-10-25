# Light Mode Visual Fixes Needed

**Created:** 2025-10-25  
**Status:** Documentation - Fixes Pending  
**Priority:** Medium (for future sprint)

---

## Overview

Light mode currently has several visual issues with contrast, readability, and consistency. This document tracks elements that need attention when polishing the light theme.

---

## 🎨 Color Contrast Issues

### Text Readability
- [ ] **Primary text** (`colors.text`) may be too dark/harsh on light backgrounds
  - Consider softer black (#1A1A1A instead of pure #000000)
  - Test WCAG AA contrast ratios (4.5:1 minimum for body text)

- [ ] **Secondary text** (`colors.textSecondary`) may lack sufficient contrast
  - Current: Often grey that's too light
  - Needs: Darker grey for readability (#666666 or #555555)

### Background Layers
- [ ] **Card backgrounds** (`colors.card`) vs **surface** (`colors.surface`)
  - May be too similar in light mode
  - Consider more distinction (card: #FFFFFF, surface: #F5F5F5)

- [ ] **Border colors** (`colors.border`)
  - Often invisible or too faint in light mode
  - Increase opacity or use slightly darker shade

---

## 🔴 Status Indicators

### Game State Icons
- [ ] **Red urgency backgrounds** (time pills, live games)
  - Red (#FF3B30) may be too bright on white
  - Consider muted red or add subtle shadow

- [ ] **Cyan primary color** (#00E5FF)
  - Very bright on white backgrounds
  - May need desaturated version for light mode (#00B8D4)

### Badge Colors
- [ ] **Available (Green)**
  - Check contrast on white cards
  - May need darker green in light mode

- [ ] **National (Blue)**
  - Ensure sufficient contrast
  - Test with colorblind simulation

- [ ] **Elsewhere (Yellow)**
  - Yellow often problematic on white
  - Consider amber/orange alternative

---

## 📊 Specific Components

### Game Cards (VerticalGameCard, VerticalGameCardExpanded)
- [ ] Time pill text color (needs darker in light mode)
- [ ] Team name secondary text (too light?)
- [ ] Venue text readability
- [ ] Score text (ensure high contrast)
- [ ] Broadcast service badges (background colors)

### Filters Sheet
- [ ] Chip borders (Quick Views, Sports, Teams)
- [ ] Selected state contrast
- [ ] Section dividers visibility
- [ ] Search input border

### Profile Menu (SettingsScreen)
- [ ] Section header text
- [ ] Collapsible chevron icons
- [ ] Menu button backgrounds
- [ ] Switch toggle colors (on/off states)
- [ ] Empty state icon opacity

### Buttons
- [ ] Cyan primary buttons (#00E5FF bg + black text)
  - Ensure black text is readable on cyan
  - May need white text in light mode?

- [ ] Outline buttons
  - Border visibility
  - Text color contrast

---

## 🎯 Recommended Token Updates

**For `src/styles/tokens.ts` light mode:**

```typescript
light: {
  bg: '#FFFFFF',           // Keep pure white
  surface: '#F5F5F5',      // Slightly darker for cards
  card: '#FFFFFF',         // Cards stay white
  
  text: '#1A1A1A',         // Softer black (was #000000)
  textSecondary: '#555555', // Darker grey (was #666666)
  
  border: '#D0D0D0',       // More visible (was #E0E0E0)
  stroke: '#CCCCCC',       // Slightly darker
  
  primary: '#00B8D4',      // Desaturated cyan for light
  accent: '#FF9500',       // Orange (unchanged)
  
  // Status colors - adjusted for light backgrounds
  success: '#28A745',      // Darker green
  warning: '#FF9500',      // Keep orange
  error: '#DC3545',        // Slightly darker red
}
```

---

## 🧪 Testing Checklist

Before marking light mode as "polished":

- [ ] Test all screens in light mode
- [ ] Use macOS Accessibility Inspector (contrast checker)
- [ ] Test with iOS accessibility settings (bold text, increase contrast)
- [ ] Check colorblind simulations (protanopia, deuteranopia)
- [ ] Compare to design system (ensure consistency)
- [ ] Get feedback from 3+ users on light mode
- [ ] Screenshot comparison (dark vs light for parity)

---

## 📸 Visual Regression Testing

**Before/After Screenshots Needed:**
1. Home screen (DailyV3) with game cards
2. Expanded game card with all sections
3. Filters sheet (all tabs)
4. Profile menu (all sections)
5. Onboarding screens
6. Empty states

---

## 🔧 Implementation Plan

**Phase 1: Token Updates (1 hour)**
- Update `src/styles/tokens.ts` light theme
- Test basic screens
- Commit: "fix(theme): improve light mode contrast and readability"

**Phase 2: Component-Specific Fixes (2-3 hours)**
- Game cards
- Filters sheet
- Profile menu
- Buttons and badges

**Phase 3: Testing & Polish (1 hour)**
- Accessibility checks
- User feedback
- Screenshot comparisons
- Final tweaks

**Total:** ~4-5 hours

---

## 📝 Notes

- **Dark mode is primary** - Most users prefer dark mode
- Light mode is secondary but must be professional
- Don't sacrifice dark mode quality for light mode
- Consider adaptive colors that work in both modes
- Use iOS/Android native palettes where possible

---

## ✅ When to Address

**Priority:**
- After MVP launch
- During "polish sprint"
- Before marketing/press screenshots
- If user complaints about light mode

**Not Urgent Because:**
- Most sports fans prefer dark mode
- Dark mode is our primary design target
- Feature completion more important than light mode perfection
- Can be addressed in v1.1 update

---

**Last Updated:** 2025-10-25
