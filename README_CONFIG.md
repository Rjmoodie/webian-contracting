# Configuration System - Quick Reference

## 🚀 Switching Clients

### Option 1: Environment Variable (Recommended)
```bash
# Create .env file
echo "VITE_CLIENT_ID=eventcoveragejamaica" > .env

# Or for a new client
echo "VITE_CLIENT_ID=newclient" > .env
```

### Option 2: Change Default
Edit `src/app/config/index.ts`:
```typescript
const getClientId = (): string => {
  return 'eventcoveragejamaica'; // Change this
};
```

## 📝 Using Config in Components

### Basic Usage

```typescript
import { getBranding, getTheme, getContent, getAppConfig } from '@/app/config';

function MyComponent() {
  const branding = getBranding();
  const theme = getTheme();
  const content = getContent();
  
  return (
    <div>
      <h1>{branding.companyName}</h1>
      <p style={{ color: theme.colors.primary }}>
        {content.phrases.getStarted}
      </p>
    </div>
  );
}
```

### Using Colors

```typescript
// Inline styles
<div style={{ backgroundColor: theme.colors.primary }}>

// CSS classes (if using Tailwind with CSS variables)
<div className="bg-primary text-secondary">
```

### Using Coverage Areas

```typescript
const branding = getBranding();

{branding.coverageAreas.map(area => (
  <div key={area}>{area}</div>
))}
```

## ➕ Adding a New Client

1. **Copy template**:
   ```bash
   cp src/app/config/clients/_template.ts src/app/config/clients/newClient.ts
   ```

2. **Edit `newClient.ts`** and fill in all values

3. **Register in `src/app/config/index.ts`**:
   ```typescript
   import { newClient } from './clients/newClient';
   
   const clientConfigs = {
     'eventcoveragejamaica': eventCoverageJamaica,
     'newclient': newClient,
   };
   ```

4. **Set environment variable**:
   ```bash
   VITE_CLIENT_ID=newclient
   ```

## 📋 What's Configurable

✅ **Fully Configurable**:
- Company name, tagline, description
- Logo URLs and icons
- All colors (primary, secondary, accent, background)
- Hero section content
- Features list
- Coverage areas
- Contact information
- Social media links
- Navigation labels
- Common phrases/CTAs
- Regional settings (country, currency, date format)

⚠️ **May Need Code Changes**:
- Maps (if location-specific)
- Service categories (currently hardcoded)
- User roles (currently hardcoded)
- Email templates (backend)

## 🔍 Finding What to Migrate

```bash
# Find hardcoded company names
grep -r "EventCoverageJamaica" src/app/components/

# Find hardcoded colors
grep -r "#755f52\|#B0DD16" src/app/components/

# Find hardcoded text
grep -r "Jamaica\|Parish" src/app/components/
```

## 📚 Full Documentation

- **Detailed Guide**: `src/app/config/README.md`
- **Repository Structure**: `REPOSITORY_STRUCTURE.md`
- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Client Checklist**: `CLIENT_BRANDING_CHECKLIST.md`
