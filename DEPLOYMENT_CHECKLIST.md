# Quick Deployment Checklist for Hostinger

## Pre-Deployment

- [ ] All code changes committed
- [ ] Tested locally with `npm run dev`
- [ ] Supabase project is configured and running
- [ ] Environment variables are set in Supabase (if needed)

## Build Process

1. [ ] Run `npm install` (or `pnpm install`) to ensure dependencies are up to date
2. [ ] Run `npm run build` to create production build
3. [ ] Verify `dist` folder contains:
   - [ ] `index.html`
   - [ ] `.htaccess` file
   - [ ] `assets/` folder with JS and CSS files

## Upload to Hostinger

1. [ ] Log in to Hostinger hPanel
2. [ ] Navigate to File Manager
3. [ ] Go to `public_html` folder
4. [ ] Backup existing files (if any)
5. [ ] Upload ALL contents from `dist` folder:
   - [ ] `index.html`
   - [ ] `.htaccess` (enable "Show hidden files" if not visible)
   - [ ] `assets/` folder (entire folder)

## Post-Deployment Verification

- [ ] Visit your domain: `https://yourdomain.com`
- [ ] Test home page loads correctly
- [ ] Test navigation/routing (try different pages)
- [ ] Test login/signup functionality
- [ ] Check browser console for errors (F12)
- [ ] Test on mobile device
- [ ] Verify SSL certificate is active (HTTPS)

## Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| 404 on routes | Check `.htaccess` is uploaded |
| Assets not loading | Verify file permissions (644 for files, 755 for folders) |
| CORS errors | Check Supabase CORS settings |
| White screen | Check browser console for JavaScript errors |

## Need Help?

- See `DEPLOYMENT_HOSTINGER.md` for detailed instructions
- Check Hostinger documentation
- Contact Hostinger support

---

**Quick Command**: `npm run deploy:prepare` - Builds and prepares files for deployment
