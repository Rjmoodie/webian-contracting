# Configuration System

This directory contains all client-specific and application-wide configuration. The system is designed to be **plug-and-play** - switch clients by changing a single environment variable.

## 📁 Directory Structure

```
src/app/config/
├── index.ts              # Main config loader (exports getClientConfig, getBranding, etc.)
├── types.ts              # TypeScript interfaces for all configs
├── theme.ts              # Theme/color system
├── content.ts            # Text content and labels
├── app.ts                # App-level settings
├── branding.ts           # Legacy (deprecated - use clients/)
└── clients/
    ├── _template.ts      # Template for new clients
    └── eventCoverageJamaica.ts  # Current client config
```

## 🚀 Quick Start: Switching Clients

### Method 1: Environment Variable (Recommended)

1. Create/update `.env` file:
```bash
VITE_CLIENT_ID=eventcoveragejamaica
```

2. Restart dev server:
```bash
npm run dev
```

### Method 2: Change Default in Code

Edit `src/app/config/index.ts`:
```typescript
const getClientId = (): string => {
  return 'eventcoveragejamaica'; // Change this
};
```

## ➕ Adding a New Client

### Step 1: Create Client Config File

1. Copy the template:
```bash
cp src/app/config/clients/_template.ts src/app/config/clients/newClient.ts
```

2. Update all values in the new file:
```typescript
export const newClient: ClientConfig = {
  clientId: 'newclient',
  clientName: 'New Client Name',
  branding: { /* ... */ },
  theme: { /* ... */ },
  content: { /* ... */ },
  app: { /* ... */ },
};
```

### Step 2: Register Client

Add to `src/app/config/index.ts`:
```typescript
import { newClient } from './clients/newClient';

const clientConfigs: Record<string, ClientConfig> = {
  'eventcoveragejamaica': eventCoverageJamaica,
  'newclient': newClient, // Add here
};
```

### Step 3: Switch to New Client

Set environment variable:
```bash
VITE_CLIENT_ID=newclient
```

## 📖 Using Configuration in Components

### Import Config Helpers

```typescript
import { getBranding, getTheme, getContent, getAppConfig } from '@/app/config';

// In your component
const branding = getBranding();
const theme = getTheme();
const content = getContent();
```

### Example Usage

```typescript
// Instead of hardcoded values
<h1>{branding.companyName}</h1>
<p>{branding.tagline}</p>
<button style={{ backgroundColor: theme.colors.primary }}>
  {content.phrases.getStarted}
</button>
```

### Dynamic Colors

```typescript
// Use theme colors
<div style={{ 
  backgroundColor: theme.colors.primary,
  color: theme.colors.secondary 
}}>
  Content
</div>

// Or use CSS variables (recommended)
<div className="bg-primary text-secondary">
  Content
</div>
```

## 🎨 Configuration Categories

### 1. Branding (`branding`)
- Company name, tagline, description
- Logo URLs and icons
- Colors (primary, secondary, accent, background)
- Contact information
- Social media links
- Hero section content
- Features list
- Coverage areas

### 2. Theme (`theme`)
- Color palette
- Typography (fonts)
- Border radius
- Shadows
- Spacing (can be extended)

### 3. Content (`content`)
- Page titles
- Navigation labels
- Service category names
- Coverage area labels
- Legal page titles
- Common phrases/CTAs

### 4. App Config (`app`)
- App name and version
- Feature flags
- Regional settings (country, currency, date format, timezone)
- API configuration

## 🔧 Advanced: Custom Theme

If you need more control than `createThemeFromBranding`:

```typescript
theme: {
  ...defaultTheme,
  colors: {
    primary: '#custom',
    secondary: '#custom',
    // ... override specific colors
  },
  // ... override other theme properties
}
```

## 📝 Migration Guide

### Moving from Hardcoded Values

1. **Find hardcoded values**:
   ```typescript
   // Before
   <h1>EventCoverageJamaica</h1>
   ```

2. **Replace with config**:
   ```typescript
   // After
   import { getBranding } from '@/app/config';
   const branding = getBranding();
   <h1>{branding.companyName}</h1>
   ```

3. **Common replacements**:
   - Company name → `branding.companyName`
   - Colors → `theme.colors.primary`, etc.
   - Text content → `content.phrases.*`
   - Coverage areas → `branding.coverageAreas`

## 🎯 Best Practices

1. **Never hardcode client-specific values** in components
2. **Use config helpers** (`getBranding()`, `getTheme()`, etc.)
3. **Keep client configs separate** - one file per client
4. **Use TypeScript** - all configs are typed
5. **Test with different clients** - switch `VITE_CLIENT_ID` to verify

## 🐛 Troubleshooting

**Config not loading?**
- Check `VITE_CLIENT_ID` is set correctly
- Verify client is registered in `index.ts`
- Check browser console for warnings

**Colors not updating?**
- Ensure CSS variables are updated (see `src/styles/theme.css`)
- Check that components use theme colors, not hardcoded values

**Content not changing?**
- Verify you're using `getContent()` in components
- Check that content values are updated in client config

## 📚 Related Files

- `src/styles/theme.css` - CSS variables (may need updates for new themes)
- `src/styles/index.css` - Global styles
- `.env` - Environment variables
