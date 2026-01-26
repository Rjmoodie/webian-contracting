# Deployment Guide for Hostinger

This guide will help you deploy the EventCoverageJamaica application to Hostinger hosting.

## Prerequisites

- Node.js installed on your local machine (v18 or higher)
- Access to your Hostinger hosting account
- FTP/SFTP credentials or File Manager access
- Supabase project configured and running

## Step 1: Build the Production Version

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   # or
   pnpm build
   ```

   This will create a `dist` folder with all the production-ready files.

## Step 2: Prepare Files for Upload

The build process creates a `dist` folder containing:
- `index.html` - Main HTML file
- `assets/` - All CSS, JS, and other assets
- `.htaccess` - Apache configuration (already included in project root)

## Step 3: Upload to Hostinger

### Option A: Using File Manager (Recommended)

1. Log in to your **Hostinger hPanel**
2. Navigate to **File Manager**
3. Go to your domain's `public_html` folder (or `www` folder)
4. **Delete or backup** any existing files in this folder
5. Upload all contents from the `dist` folder:
   - Select all files in `dist`
   - Upload them to `public_html`
   - Make sure `.htaccess` is uploaded (it may be hidden - enable "Show hidden files")

### Option B: Using FTP/SFTP

1. Connect to your Hostinger server using an FTP client (FileZilla, Cyberduck, etc.)
2. Navigate to `public_html` directory
3. Upload all files from the `dist` folder
4. Ensure file permissions are set correctly:
   - Folders: `755`
   - Files: `644`
   - `.htaccess`: `644`

## Step 4: Verify Configuration

### Check .htaccess File

Ensure the `.htaccess` file is in your `public_html` root directory. This file:
- Enables client-side routing (React Router)
- Sets up compression
- Configures browser caching
- Adds security headers

### Verify File Structure

Your `public_html` should look like:
```
public_html/
├── index.html
├── .htaccess
└── assets/
    ├── index-[hash].js
    ├── index-[hash].css
    └── [other assets]
```

## Step 5: Test Your Deployment

1. Visit your domain: `https://yourdomain.com`
2. Test all routes:
   - Home page
   - Services page
   - Login/Signup
   - Dashboard pages
3. Check browser console for any errors
4. Test on mobile devices

## Step 6: SSL Certificate (if not already configured)

Hostinger usually provides free SSL certificates. Ensure:
1. SSL is enabled in hPanel
2. Your site redirects HTTP to HTTPS
3. All assets load over HTTPS

## Troubleshooting

### Issue: 404 Errors on Routes

**Solution**: Ensure `.htaccess` file is uploaded and Apache mod_rewrite is enabled. Contact Hostinger support if needed.

### Issue: Assets Not Loading

**Solution**: 
- Check file paths in browser console
- Verify all files were uploaded
- Check file permissions (644 for files, 755 for folders)

### Issue: CORS Errors

**Solution**: 
- Verify Supabase CORS settings allow your domain
- Check Supabase project settings → API → CORS origins

### Issue: Build Errors

**Solution**:
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)
- Review build output for specific errors

## Environment Variables

This project uses hardcoded Supabase credentials in `utils/supabase/info.tsx`. If you need to change them:

1. Update the file before building
2. Rebuild: `npm run build`
3. Re-upload the new `dist` folder

**Note**: For production, consider using environment variables. You may need to:
- Create a `.env.production` file
- Update `vite.config.ts` to use environment variables
- Rebuild and redeploy

## Updating Your Site

When you make changes:

1. Make your code changes locally
2. Test locally: `npm run dev`
3. Build: `npm run build`
4. Upload new `dist` contents to Hostinger
5. Clear browser cache or do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

## Performance Optimization

The build is already optimized with:
- Code splitting (vendor chunks)
- Minification
- Asset optimization
- Browser caching via `.htaccess`

## Support

If you encounter issues:
1. Check Hostinger documentation
2. Contact Hostinger support
3. Review browser console for errors
4. Check Supabase dashboard for API issues

## Additional Notes

- **Supabase Edge Functions**: These are hosted on Supabase, not Hostinger. No additional configuration needed.
- **Database**: All database operations go through Supabase API, no database setup needed on Hostinger.
- **Email Service**: Configured in Supabase Edge Functions (see `SETUP_INSTRUCTIONS.md`).

---

**Last Updated**: $(date)
**Build Command**: `npm run build`
**Output Directory**: `dist/`
