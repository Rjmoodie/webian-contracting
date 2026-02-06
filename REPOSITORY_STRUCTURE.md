# Repository Structure Guide

This repository is structured to be **client-agnostic** and **reusable**. All client-specific values are stored in configuration files, making it easy to switch between clients or reuse for new projects.

## 🏗️ Architecture Overview

```
Eventcoveragejamaica/
├── src/
│   ├── app/
│   │   ├── config/              # ⭐ CLIENT CONFIGURATION (Plug & Play)
│   │   │   ├── index.ts         # Main config loader
│   │   │   ├── types.ts         # TypeScript interfaces
│   │   │   ├── theme.ts         # Theme/color system
│   │   │   ├── content.ts       # Text content & labels
│   │   │   ├── app.ts           # App-level settings
│   │   │   ├── branding.ts      # Legacy (deprecated)
│   │   │   └── clients/        # Client-specific configs
│   │   │       ├── _template.ts # Template for new clients
│   │   │       └── eventCoverageJamaica.ts
│   │   ├── components/          # React components (client-agnostic)
│   │   ├── styles/              # Global styles
│   │   └── App.tsx              # Main app entry
│   └── main.tsx
├── supabase/                    # Backend functions
├── .env.example                 # Environment variables template
├── CLIENT_BRANDING_CHECKLIST.md # What clients need to provide
├── BRANDING_AND_PORTFOLIO_GUIDE.md
└── REPOSITORY_STRUCTURE.md      # This file
```

## 🎯 Key Principles

### 1. **Configuration-Driven**
- All client-specific values live in `src/app/config/clients/`
- Components use config helpers, never hardcode values
- Switch clients via environment variable

### 2. **Separation of Concerns**
- **Config**: Client-specific data
- **Components**: Reusable, client-agnostic UI
- **Styles**: Theme-aware, uses CSS variables

### 3. **Type Safety**
- All configs are TypeScript interfaces
- Type checking prevents missing values
- Autocomplete in IDE

## 📦 Configuration System

### Quick Switch Between Clients

**Method 1: Environment Variable (Recommended)**
```bash
# .env
VITE_CLIENT_ID=eventcoveragejamaica
```

**Method 2: Code Default**
```typescript
// src/app/config/index.ts
return 'eventcoveragejamaica'; // Change this
```

### Adding a New Client

1. **Copy template**:
   ```bash
   cp src/app/config/clients/_template.ts src/app/config/clients/newClient.ts
   ```

2. **Fill in values** in `newClient.ts`

3. **Register client** in `src/app/config/index.ts`

4. **Set environment variable**:
   ```bash
   VITE_CLIENT_ID=newclient
   ```

See `src/app/config/README.md` for detailed instructions.

## 🔧 What's Configurable

### ✅ Fully Configurable (Plug & Play)

- **Company Information**: Name, tagline, description
- **Branding**: Logo, colors, fonts
- **Content**: All text, labels, phrases
- **Coverage Areas**: Location names and descriptions
- **Contact Info**: Email, phone, social media
- **Theme**: Colors, typography, spacing
- **Regional Settings**: Country, currency, date format

### ⚠️ May Need Customization

- **Maps**: If using location-specific maps (e.g., Jamaica map)
- **Service Categories**: Currently hardcoded (photography/videography/audio)
- **User Roles**: Currently hardcoded (client/talent/admin/manager)
- **Email Templates**: Backend templates may need updates

### 🔨 Requires Code Changes

- **Database Schema**: If client needs different data structure
- **Business Logic**: Custom workflows or features
- **Third-Party Integrations**: Payment, SMS, etc.

## 📝 Migration Checklist

When reusing for a new client:

### Phase 1: Configuration (1-2 hours)
- [ ] Copy client template
- [ ] Fill in branding config
- [ ] Update theme colors
- [ ] Update content/labels
- [ ] Set coverage areas
- [ ] Add contact information

### Phase 2: Assets (2-4 hours)
- [ ] Add logo files
- [ ] Add hero images
- [ ] Add favicon
- [ ] Add portfolio items

### Phase 3: Content Review (1-2 hours)
- [ ] Review all pages for client-specific text
- [ ] Update About page content
- [ ] Update Terms & Policies (if custom)
- [ ] Update email templates (backend)

### Phase 4: Testing (2-3 hours)
- [ ] Test with new client config
- [ ] Verify colors display correctly
- [ ] Check all text is updated
- [ ] Test responsive design
- [ ] Verify email templates

**Total Time**: ~6-11 hours for a new client setup

## 🎨 Customization Levels

### Level 1: Configuration Only (Recommended)
- Change config files only
- No code changes needed
- Fastest setup (~2-4 hours)

### Level 2: Configuration + Assets
- Config files + media assets
- No code changes
- Standard setup (~4-8 hours)

### Level 3: Configuration + Custom Components
- Config + custom page components
- Some code changes
- Advanced setup (~8-16 hours)

### Level 4: Full Customization
- Custom features, workflows, integrations
- Significant code changes
- Enterprise setup (16+ hours)

## 📂 File Organization

### Client-Specific Files
- `src/app/config/clients/*.ts` - Client configs
- `src/assets/` - Client media (logos, images)
- `.env` - Environment variables

### Shared/Reusable Files
- `src/app/components/` - All React components
- `src/app/styles/` - Global styles
- `supabase/functions/` - Backend logic

### Documentation
- `CLIENT_BRANDING_CHECKLIST.md` - What clients provide
- `BRANDING_AND_PORTFOLIO_GUIDE.md` - How to customize
- `src/app/config/README.md` - Config system docs
- `REPOSITORY_STRUCTURE.md` - This file

## 🔄 Workflow for New Client

```
1. Create Client Config
   └─> Copy template
   └─> Fill in values
   └─> Register in index.ts

2. Gather Assets
   └─> Logo files
   └─> Hero images
   └─> Portfolio items

3. Set Environment
   └─> VITE_CLIENT_ID=newclient

4. Test & Verify
   └─> Check all pages
   └─> Verify branding
   └─> Test functionality

5. Deploy
   └─> Build with client config
   └─> Deploy to hosting
```

## 🚀 Quick Start: Reusing for New Client

1. **Copy client template**:
   ```bash
   cp src/app/config/clients/_template.ts src/app/config/clients/newClient.ts
   ```

2. **Update newClient.ts** with client values

3. **Register in index.ts**:
   ```typescript
   import { newClient } from './clients/newClient';
   const clientConfigs = {
     'eventcoveragejamaica': eventCoverageJamaica,
     'newclient': newClient,
   };
   ```

4. **Set environment variable**:
   ```bash
   echo "VITE_CLIENT_ID=newclient" > .env
   ```

5. **Start dev server**:
   ```bash
   npm run dev
   ```

## 📚 Documentation Files

- **`CLIENT_BRANDING_CHECKLIST.md`**: Complete checklist of what clients need to provide
- **`BRANDING_AND_PORTFOLIO_GUIDE.md`**: How to customize branding and manage portfolio
- **`src/app/config/README.md`**: Detailed config system documentation
- **`REPOSITORY_STRUCTURE.md`**: This file - overall architecture

## 🎯 Best Practices

1. **Never hardcode client values** in components
2. **Always use config helpers** (`getBranding()`, `getTheme()`, etc.)
3. **Keep client configs separate** - one file per client
4. **Test with multiple clients** to ensure reusability
5. **Document customizations** if you add client-specific code

## 🔍 Finding Hardcoded Values

To find values that need to be moved to config:

```bash
# Search for hardcoded company names
grep -r "EventCoverageJamaica" src/

# Search for hardcoded colors
grep -r "#755f52\|#B0DD16" src/

# Search for hardcoded text
grep -r "Jamaica\|Parish" src/
```

## 💡 Tips

- **Use CSS variables** for colors (defined in `src/styles/theme.css`)
- **Create reusable components** that accept config as props
- **Keep business logic separate** from client-specific content
- **Version control client configs** - they're part of the codebase
- **Document any client-specific code** that can't be config-driven

## 🐛 Troubleshooting

**Config not loading?**
- Check `.env` file exists and has `VITE_CLIENT_ID`
- Verify client is registered in `index.ts`
- Restart dev server after changing `.env`

**Colors not updating?**
- Check `src/styles/theme.css` for CSS variables
- Ensure components use theme colors, not hardcoded hex codes

**Content not changing?**
- Verify components use `getContent()` helper
- Check that content values are in client config

---

**Last Updated**: January 2026
**Version**: 2.0 (Config-Driven Architecture)
