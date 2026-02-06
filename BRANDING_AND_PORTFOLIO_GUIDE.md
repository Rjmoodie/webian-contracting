# Branding & Portfolio Customization Guide

This guide explains how to customize your site's branding and manage portfolio items.

> **📋 For Clients**: See `CLIENT_BRANDING_CHECKLIST.md` for a complete checklist of all branding assets and media you need to provide.

## 🎨 Branding Configuration

### Location
Branding settings are located in: `src/app/config/branding.ts`

### Customizable Elements

1. **Company Information**
   - `companyName`: Full company name
   - `companyShortName`: Short name/abbreviation
   - `tagline`: Tagline shown under logo
   - `description`: Company description

2. **Logo & Media**
   - `logoUrl`: URL to your logo image (optional - will use icon fallback if not provided)
   - `logoIcon`: Icon component name (currently 'Camera')
   - `faviconUrl`: Favicon URL
   - `heroImageUrl`: Hero section background image

3. **Colors**
   - `primaryColor`: Main brand color (default: #755f52 - brown)
   - `secondaryColor`: Accent color (default: #B0DD16 - lime green)
   - `accentColor`: Secondary accent (default: #c9a882 - gold)
   - `backgroundColor`: Background color (default: #f5f1eb - cream)

4. **Contact & Social Media**
   - `contactEmail`: Contact email
   - `contactPhone`: Contact phone number
   - `website`: Website URL
   - `socialMedia`: Social media links (Instagram, Facebook, Twitter, LinkedIn)

5. **Content**
   - `heroTitle`: Main hero section title
   - `heroSubtitle`: Hero section subtitle
   - `ctaText`: Call-to-action button text
   - `features`: Array of feature highlights
   - `coverageAreas`: Array of coverage area names

### How to Update Branding

1. Open `src/app/config/branding.ts`
2. Update the `defaultBranding` object with your values
3. Save the file
4. The changes will be reflected across the site

### Example Customization

```typescript
export const defaultBranding: BrandingConfig = {
  companyName: 'Your Company Name',
  companyShortName: 'YCN',
  tagline: 'Your Custom Tagline',
  description: 'Your company description here',
  
  logoUrl: 'https://yourdomain.com/logo.png',
  heroImageUrl: 'https://yourdomain.com/hero-image.jpg',
  
  primaryColor: '#your-color',
  secondaryColor: '#your-color',
  // ... etc
};
```

## 📸 Portfolio Management

### What is the Portfolio?

The Portfolio page showcases your best work to potential clients. It displays submitted media (photos, videos, audio) in a beautiful grid or list view.

### Accessing Portfolio Management

1. Log in as Admin or Manager
2. Go to Admin Dashboard
3. Click the "Portfolio" tab

### Adding Portfolio Items

1. Click "Add Portfolio Item" button
2. Fill in the form:
   - **Title** (required): Name of the work/project
   - **Description**: Brief description
   - **Category** (required): Photography, Videography, or Audio
   - **Media URL** (required): Direct link to the media file
   - **Thumbnail URL** (optional): Custom thumbnail image
   - **Event Type**: e.g., Wedding, Corporate, Festival
   - **Parish**: Location in Jamaica
   - **Date**: Date of the event
   - **Talent Name**: Name of the professional who created it
   - **Featured**: Check to highlight this item prominently
3. Click "Add Item"

### Editing Portfolio Items

1. Find the item in the portfolio grid
2. Click "Edit"
3. Update the fields
4. Click "Update Item"

### Deleting Portfolio Items

1. Find the item in the portfolio grid
2. Click the red "X" button
3. Confirm deletion

### Portfolio Item Requirements

- **Media URL**: Must be a direct link to an image, video, or audio file
  - Images: `.jpg`, `.png`, `.webp`
  - Videos: `.mp4`, `.webm` (or hosted on YouTube/Vimeo)
  - Audio: `.mp3`, `.wav`
- **Thumbnail URL**: Optional, but recommended for better display
  - Should be a square or landscape image
  - Recommended size: 800x600px or larger

### Best Practices

1. **Use High-Quality Media**: Portfolio showcases your best work
2. **Add Descriptions**: Help visitors understand the context
3. **Feature Your Best Work**: Mark exceptional items as "Featured"
4. **Organize by Category**: Makes it easier for visitors to find what they need
5. **Include Event Details**: Parish, event type, and date help with filtering

## 🔗 Portfolio Page Access

The Portfolio page is accessible:
- Via navigation menu: "Portfolio" link in the header
- Direct URL: `/portfolio` (when routing is set up)
- From Services page: Can link to portfolio from service cards

## 📋 Submission Workflow

### Current Workflow

1. **Admin/Manager submits portfolio item** via Admin Dashboard
2. **Item appears immediately** on the Portfolio page
3. **No approval needed** (admins have full control)

### Future Enhancement Ideas

- Allow talent to submit portfolio items for admin approval
- Auto-populate portfolio from completed requests
- Bulk upload functionality
- Portfolio categories/tags
- Client testimonials linked to portfolio items

## 🎯 Next Steps

1. **Customize Branding**: Update `src/app/config/branding.ts` with your company details
2. **Add Logo**: Upload your logo and update `logoUrl`
3. **Add Portfolio Items**: Start adding your best work through Admin Dashboard
4. **Test Portfolio Page**: Visit the portfolio page to see your items
5. **Link from Navigation**: Portfolio is already linked in the navigation menu

## 📝 Notes

- Portfolio items are stored in the backend database
- The Portfolio page automatically fetches and displays all approved items
- Items can be filtered by category (Photography, Videography, Audio)
- View can be switched between Grid and List modes
- Featured items appear with a special badge

## 🐛 Troubleshooting

**Portfolio items not showing?**
- Check that items are saved correctly in Admin Dashboard
- Verify media URLs are accessible
- Check browser console for errors

**Images not loading?**
- Ensure media URLs are direct links (not requiring authentication)
- Check CORS settings if hosting media yourself
- Use a CDN or image hosting service for best performance

**Need to bulk update?**
- Currently, items must be edited one at a time
- Consider exporting/importing via API in the future
