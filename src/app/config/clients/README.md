# Client Configurations

This directory contains client-specific configuration files.

## 📁 Files

- **`_template.ts`**: Template for creating new client configs
- **`eventCoverageJamaica.ts`**: Current client configuration

## ➕ Creating a New Client

1. Copy the template:
   ```bash
   cp _template.ts newClient.ts
   ```

2. Update all values in `newClient.ts`:
   - `clientId`: lowercase, no spaces (e.g., 'newclient')
   - `clientName`: Display name
   - `branding`: All company info, colors, content
   - `theme`: Color palette and styling
   - `content`: Text labels and phrases
   - `app`: App settings and regional config

3. Register in `../index.ts`:
   ```typescript
   import { newClient } from './clients/newClient';
   
   const clientConfigs = {
     'eventcoveragejamaica': eventCoverageJamaica,
     'newclient': newClient,
   };
   ```

4. Switch to new client:
   ```bash
   # Set in .env
   VITE_CLIENT_ID=newclient
   ```

## ✅ Checklist for New Client

- [ ] Company name and short name
- [ ] Tagline and description
- [ ] Logo URL (or icon fallback)
- [ ] All colors (primary, secondary, accent, background)
- [ ] Hero section content
- [ ] Features list
- [ ] Coverage areas
- [ ] Contact information
- [ ] Social media links
- [ ] Navigation labels
- [ ] Common phrases
- [ ] Regional settings

## 💡 Tips

- Use the template as a starting point
- Keep `clientId` lowercase and URL-friendly
- Test with the new config before deploying
- Document any client-specific customizations
