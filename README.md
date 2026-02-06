# Event Coverage Platform

A professional event coverage management platform built with React, TypeScript, and Supabase.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## ⚙️ Configuration System

This repository uses a **plug-and-play configuration system** that makes it easy to reuse for different clients.

### Switching Clients

Set the `VITE_CLIENT_ID` environment variable:

```bash
# .env
VITE_CLIENT_ID=eventcoveragejamaica
```

### Adding a New Client

1. Copy the template: `cp src/app/config/clients/_template.ts src/app/config/clients/newClient.ts`
2. Fill in client values
3. Register in `src/app/config/index.ts`
4. Set `VITE_CLIENT_ID=newclient`

See **[QUICK_START_NEW_CLIENT.md](./QUICK_START_NEW_CLIENT.md)** for detailed instructions.

## 📚 Documentation

- **[Configuration System](./src/app/config/README.md)** - Complete config system guide
- **[Repository Structure](./REPOSITORY_STRUCTURE.md)** - Architecture overview
- **[Migration Guide](./MIGRATION_GUIDE.md)** - Moving to config-driven architecture
- **[Client Checklist](./CLIENT_BRANDING_CHECKLIST.md)** - What clients need to provide
- **[Quick Start](./QUICK_START_NEW_CLIENT.md)** - 5-minute new client setup

## 🏗️ Project Structure

```
src/
├── app/
│   ├── config/          # ⭐ Client configurations (plug & play)
│   │   └── clients/     # Client-specific configs
│   ├── components/       # React components
│   └── styles/          # Global styles
└── main.tsx
```

## 🎯 Key Features

- **Multi-Client Support**: Switch between clients via configuration
- **Type-Safe Config**: Full TypeScript support for all configurations
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Premium UI/UX**: Modern, polished interface
- **Portfolio Management**: Admin dashboard for managing portfolio items
- **Role-Based Access**: Client, Talent, Admin, and Manager roles

## 🔧 Configuration

All client-specific values are stored in `src/app/config/clients/`. See the [config README](./src/app/config/README.md) for details.

## 📝 License

Private project - All rights reserved.

---

**Original Design**: [Figma Design](https://www.figma.com/design/HQvk4Cz1p3ClxeEzKpAICx/Design-Managed-Marketplace-Website)