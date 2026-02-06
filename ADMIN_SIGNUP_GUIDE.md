# Admin Signup Guide

## ✅ Recommended Approach: Separate Admin Signup Route

I've implemented a **separate admin signup route** that's not linked from the main navigation. This provides a good balance between security and accessibility.

## 🔐 How It Works

### Public Signup (`/signup`)
- Shows: **Client** and **Talent** options only
- Accessible from: Main navigation "Sign Up" button
- For: Regular users

### Admin Signup (`/admin-signup`)
- Shows: **Admin** option only
- Accessible from: Direct URL only (not linked publicly)
- For: Admin account creation

## 📍 How to Access Admin Signup

### Option 1: Direct URL (Hash-based)
Navigate to: `http://localhost:5173/#admin-signup` (or your domain)

**Note**: This app uses hash-based routing. Use `#admin-signup` (with `#`), not `/admin-signup` (with `/`).

### Option 2: Browser Console
```javascript
// In browser console
window.location.hash = 'admin-signup';
```

### Option 3: Add Temporary Link (for testing)
You can temporarily add a link in the code for testing, then remove it before production.

## 🎯 Benefits of This Approach

✅ **Security**: Not discoverable from main site  
✅ **Accessibility**: Easy to access when needed (just share the URL)  
✅ **Simple**: No complex invite codes or verification  
✅ **Flexible**: Can be shared privately with trusted people  

## 🔒 Alternative: Remove Admin from Public Signup

If you want even more security, you can:

1. **Remove admin option completely** from public signup
2. **Create admins manually** via:
   - Supabase Dashboard → Authentication → Users → Add User
   - Then update KV store to set role to "admin"

## 📝 Current Implementation

- ✅ Admin option removed from public signup
- ✅ Separate `/admin-signup` route created
- ✅ Admin signup shows only admin role option
- ✅ Company field available for admins too

## 🚀 Usage

To create an admin account:
1. Navigate to `/admin-signup` (direct URL)
2. Fill out the form
3. Select "Admin Access" (only option shown)
4. Complete signup
5. You'll be automatically logged in and redirected to Admin Dashboard

---

**This is the recommended approach** - secure but still accessible when needed!
