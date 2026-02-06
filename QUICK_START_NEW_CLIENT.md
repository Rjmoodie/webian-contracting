# Quick Start: Setting Up a New Client

This is a step-by-step guide to quickly set up the application for a new client.

## ⚡ 5-Minute Setup

### Step 1: Create Client Config (2 minutes)

```bash
# Copy template
cp src/app/config/clients/_template.ts src/app/config/clients/newClient.ts
```

Edit `src/app/config/clients/newClient.ts`:
- Update `clientId` and `clientName`
- Fill in company information
- Update colors
- Update hero content

### Step 2: Register Client (30 seconds)

Edit `src/app/config/index.ts`:
```typescript
import { newClient } from './clients/newClient';

const clientConfigs = {
  'eventcoveragejamaica': eventCoverageJamaica,
  'newclient': newClient, // Add this line
};
```

### Step 3: Set Environment Variable (30 seconds)

Create `.env` file:
```bash
VITE_CLIENT_ID=newclient
```

### Step 4: Test (2 minutes)

```bash
npm run dev
```

Visit the site and verify:
- Company name appears correctly
- Colors match client branding
- Hero section shows new content

## 📋 Full Setup Checklist

### Essential (Required for Launch)
- [ ] Company name, tagline, description
- [ ] Primary and secondary colors
- [ ] Hero section title and subtitle
- [ ] CTA button text
- [ ] Contact email

### Important (Enhance Branding)
- [ ] Logo URL
- [ ] Favicon
- [ ] Hero image
- [ ] Social media links
- [ ] Coverage areas list

### Nice to Have (Polish)
- [ ] Custom fonts
- [ ] Additional accent colors
- [ ] Custom phrases/labels
- [ ] Regional settings

## 🎨 Minimum Viable Config

Here's the absolute minimum to get started:

```typescript
export const newClient: ClientConfig = {
  clientId: 'newclient',
  clientName: 'New Client',
  
  branding: {
    companyName: 'New Client Name',
    companyShortName: 'NCN',
    tagline: 'Your Tagline',
    description: 'Your description',
    primaryColor: '#your-color',
    secondaryColor: '#your-color',
    accentColor: '#your-color',
    backgroundColor: '#your-color',
    heroTitle: 'Your Hero Title',
    heroSubtitle: 'Your hero subtitle',
    ctaText: 'Get Started',
    features: ['Feature 1', 'Feature 2'],
    coverageAreas: ['Area 1', 'Area 2'],
  },
  
  theme: createThemeFromBranding({
    primaryColor: '#your-color',
    secondaryColor: '#your-color',
    accentColor: '#your-color',
    backgroundColor: '#your-color',
  }),
  
  content: defaultContent,
  app: defaultAppConfig,
};
```

## 🚀 Next Steps

1. **Gather Assets**: See `CLIENT_BRANDING_CHECKLIST.md`
2. **Add Portfolio Items**: Use Admin Dashboard → Portfolio tab
3. **Customize Content**: Update About page, Terms, etc.
4. **Test Thoroughly**: Switch between clients to verify

## 📞 Need Help?

- **Config System**: See `src/app/config/README.md`
- **What to Provide**: See `CLIENT_BRANDING_CHECKLIST.md`
- **Repository Structure**: See `REPOSITORY_STRUCTURE.md`

---

**Time Estimate**: 5-15 minutes for basic setup, 1-2 hours for complete customization
