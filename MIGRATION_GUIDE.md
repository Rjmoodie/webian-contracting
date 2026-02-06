# Migration Guide: Moving to Config-Driven Architecture

This guide helps you migrate existing hardcoded values to the new configuration system.

## 🎯 Goal

Move all client-specific values from components to configuration files, making the codebase reusable for future clients.

## 📋 Migration Checklist

### Step 1: Identify Hardcoded Values

Search for these patterns in your codebase:

```bash
# Company names
grep -r "EventCoverageJamaica\|ECJ" src/app/components/

# Colors
grep -r "#755f52\|#B0DD16\|#c9a882" src/app/components/

# Text content
grep -r "Jamaica\|Parish\|Professional Event" src/app/components/
```

### Step 2: Update Components to Use Config

#### Before (Hardcoded):
```typescript
<h1>EventCoverageJamaica</h1>
<p>Professional Event Services</p>
<button style={{ backgroundColor: '#755f52' }}>Request Coverage</button>
```

#### After (Config-Driven):
```typescript
import { getBranding, getTheme, getContent } from '@/app/config';

const branding = getBranding();
const theme = getTheme();
const content = getContent();

<h1>{branding.companyName}</h1>
<p>{branding.tagline}</p>
<button style={{ backgroundColor: theme.colors.primary }}>
  {content.phrases.requestCoverage}
</button>
```

### Step 3: Common Replacements

| Hardcoded Value | Config Path |
|----------------|-------------|
| `"EventCoverageJamaica"` | `branding.companyName` |
| `"ECJ"` | `branding.companyShortName` |
| `"Professional Event Services"` | `branding.tagline` |
| `"#755f52"` | `theme.colors.primary` |
| `"#B0DD16"` | `theme.colors.secondary` |
| `"Request Coverage"` | `content.phrases.requestCoverage` |
| `"Jamaica"` | `app.region.country` |
| `["Kingston", ...]` | `branding.coverageAreas` |

## 🔧 Component-by-Component Migration

### Navigation Component

**File**: `src/app/components/Navigation.tsx`

**Changes Needed**:
- Replace hardcoded company name
- Use branding colors
- Use content labels

**Example**:
```typescript
import { getBranding, getTheme } from '@/app/config';

const branding = getBranding();
const theme = getTheme();

// Use branding.companyName instead of "EventCoverageJamaica"
// Use theme.colors.primary instead of "#755f52"
```

### HomePage Component

**File**: `src/app/components/HomePage.tsx`

**Changes Needed**:
- Hero title/subtitle from config
- Features list from config
- Coverage areas from config
- CTA text from config

### ServicesPage Component

**File**: `src/app/components/ServicesPage.tsx`

**Changes Needed**:
- Service category labels from config
- Company name references

### CoverageAreasPage Component

**File**: `src/app/components/CoverageAreasPage.tsx`

**Changes Needed**:
- Coverage area data from config
- Labels from config

## 🎨 CSS Variables Migration

### Update `src/styles/theme.css`

Replace hardcoded colors with CSS variables that reference config:

```css
:root {
  --color-primary: var(--brand-primary, #755f52);
  --color-secondary: var(--brand-secondary, #B0DD16);
  /* ... */
}
```

### Inject Theme into CSS

Create a utility to inject theme colors as CSS variables at runtime (optional but recommended for dynamic theming).

## 📝 Priority Order

### High Priority (Do First)
1. Navigation component
2. HomePage hero section
3. Footer
4. Email templates (backend)

### Medium Priority
5. Service pages
6. About page
7. Coverage areas page
8. Dashboard headers

### Low Priority (Nice to Have)
9. Error messages
10. Toast notifications
11. Loading states

## 🚀 Quick Wins

These are easy to migrate and have high impact:

1. **Company Name**: Search & replace `"EventCoverageJamaica"` → `branding.companyName`
2. **Colors**: Replace hex codes with `theme.colors.*`
3. **CTAs**: Replace button text with `content.phrases.*`

## ✅ Verification

After migration, verify:

1. **Switch client config** and verify all values change
2. **Check all pages** render correctly
3. **Test responsive design** still works
4. **Verify no console errors**

## 📚 Examples

See `src/app/config/README.md` for detailed usage examples.

---

**Note**: This is an ongoing process. Not all values need to be migrated immediately, but new code should always use the config system.
