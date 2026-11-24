# LibraryOS Design System Style Guide

**Version**: 2.0 (Proposal Parity)  
**Status**: Living Style Guide  
**Tokens Source of Truth**: `src/styles/index.css` & `tailwind.config.ts`

---

## 1. Color Palette & Semantic Tokens

LibraryOS uses HSL CSS variables configured to match modern professional digital library environments, with full AA-compliance across four active themes (`light`, `.dark`, `.theme-high-contrast`, and `.theme-warm-paper`).

### Core Design Tokens

| Token Name | Light HSL / Value | Purpose |
| :--- | :--- | :--- |
| `background` | `210 40% 98%` (#F8FAFC) | Primary surface / page backdrop |
| `foreground` | `222.2 84% 4.9%` (#0F172A) | Dark ink primary text (AA contrast) |
| `card` | `0 0% 100%` (#FFFFFF) | Elevated card surface |
| `card-foreground` | `222.2 84% 4.9%` (#0F172A) | Card body & heading typography |
| `primary` | `243 75% 59%` (#4338CA / #7654D7) | Brand primary violet / deep indigo |
| `primary-foreground`| `0 0% 100%` | High-contrast button text on primary |
| `primary-soft` | `243 100% 97%` (#F4F1FD) | Subtle tint for active items & panels |
| `secondary` | `173 80% 40%` (#0F766E) | Supporting teal accent |
| `secondary-soft` | `173 60% 95%` (#EDF9F3) | Subtle mint background |
| `success` | `142 72% 29%` (#15803D) | Validated scans, checked-in items |
| `success-soft` | `138 76% 97%` (#EDF9F3) | Mint pill badge background |
| `warning` | `32 95% 37%` (#B45309) | Low availability, overdue notice |
| `warning-soft` | `48 96% 95%` (#FEF3C7) | Warning badge background |
| `danger` | `0 74% 42%` (#B91C1C) | Suspended account, fine block |
| `danger-soft` | `0 86% 96%` (#FEE2E2) | Danger alert background |
| `border` | `214.3 31.8% 91.4%` (#E6E3EE) | Hairline 1px borders |
| `ring` | `243 75% 59%` | Keyboard focus ring |

### Highlighted Card Glow Accent
- Highlighted cards and panels feature `border-2 border-[#7654D7]`.
- Interactive hover trigger: `.hover-border-blink:hover` flashes an animated purple glow (`borderBlink` keyframes) without layout shift.

---

## 2. Typography

- **Primary Font**: Plus Jakarta Sans / Inter (`sans-serif`)
- **Sinhala Font**: Noto Sans Sinhala (`[lang="si"], .font-sinhala`)
- **Tamil Font**: Noto Sans Tamil (`[lang="ta"], .font-tamil`)
- **Code & Barcode Font**: JetBrains Mono / font-mono

### Scale
- **Eyebrow**: `text-[11px] font-bold tracking-widest uppercase text-primary`
- **Page Title**: `text-3xl sm:text-4xl font-bold font-heading text-foreground`
- **Section Heading**: `text-base sm:text-lg font-bold font-heading text-foreground`
- **Body Regular**: `text-sm text-foreground leading-relaxed`
- **Muted Supporting**: `text-xs sm:text-sm text-muted-foreground`
- **Microcopy & Meta**: `text-xs font-medium text-muted-foreground`

---

## 3. UI Component Inventory

### Existing & Standardized
1. **Button** (`src/components/ui/button.tsx`): Variants `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `success`, `warning`. Sizes `sm`, `default`, `lg`, `icon`, `icon-sm`. Supports `loading` state with spinner.
2. **Card** (`src/components/ui/card.tsx`): 16–18px rounded borders (`rounded-2xl` / `rounded-xl`), elevated shadow, solid surface.
3. **Badge** (`src/components/ui/badge.tsx`): Full pill geometry (`rounded-full`), variants `default`, `secondary`, `success`, `warning`, `danger`, `info`, `outline`.
4. **Input** (`src/components/ui/input.tsx`): 12px rounded (`rounded-xl`), 44px min height for touch, visible focus ring.
5. **PageHeader** (`src/components/ui/page-header.tsx`): Eyebrow, title, subtitle, badges, and primary action bar.
6. **StatCard** (`src/components/ui/stat-card.tsx`): Summary KPI tile with icon box, tabular numbers, and change metadata.
7. **EmptyState** (`src/components/ui/empty-state.tsx`): Editorial illustration or icon, heading, description, and primary CTA.
8. **Table** (`src/components/ui/table.tsx`): Alternating zebra rows (`#FFFFFF` vs `#F1EDFC`), hover highlight (`#E6DEF9`), sticky headers.

### New Components to Introduce in Wave A (Infrastructure)
1. **Kbd** (`src/components/ui/kbd.tsx`): Accessible keyboard shortcut keycaps.
2. **Stepper** (`src/components/ui/stepper.tsx`): Multi-step registration / promotion wizard progress bar.
3. **FileDropzone** (`src/components/ui/file-dropzone.tsx`): Drag-and-drop CSV/Excel and ZIP file upload with preview.
4. **CountdownRing** (`src/components/ui/countdown-ring.tsx`): Circular SVG countdown timer for kiosk auto-reset.
5. **BulkActionBar** (`src/components/ui/bulk-action-bar.tsx`): Sticky bottom floating action bar when multiple table items are selected.
6. **PhotoCapture** (`src/components/ui/photo-capture.tsx`): Integrated Webcam camera capture and crop dialog with fallback file upload.
7. **ShortcutsDialog** (`src/components/common/ShortcutsDialog.tsx`): Modal triggered by `?` showing desk shortcuts.

---

## 4. Motion & Micro-Interactions

- **Page Entrance**: `opacity: 0 -> 1, y: 8 -> 0`, duration 300ms.
- **Card Hover**: Subtle lift `translateY(-2px)` + elevated shadow.
- **Button Active**: Tactile spring `active:scale-[0.98]`.
- **Scanner Ready**: Pulsing dot animation on scanner badge.
- **Prefers-Reduced-Motion**: Enforced globally in `src/styles/index.css` by clamping `animation-duration: 0.01ms`.
