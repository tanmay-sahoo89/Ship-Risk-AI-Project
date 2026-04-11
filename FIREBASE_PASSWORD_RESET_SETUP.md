# Firebase Password Reset Configuration

## Overview

I've created a beautiful, branded password reset page for your Ship Risk AI app. Now you need to configure Firebase to use it.

## What Was Done

1. ✅ Created a custom password reset page (`ResetPassword.tsx`) with:
   - Beautiful gradient background matching your app theme
   - Password visibility toggles
   - Form validation
   - Error handling
   - Success confirmation
   - Responsive design

2. ✅ Added the route `/auth/action` to your React app to handle password reset

3. ✅ Updated Firebase configuration for auth persistence

## How to Configure Firebase

### Step 1: Go to Firebase Console

1. Open https://console.firebase.google.com
2. Select your project
3. Go to **Authentication** → **Templates** (or **Settings** → **Email Templates**)

### Step 2: Customize Password Reset Email Template

1. Find the **Password reset** email template
2. Click **Edit template**
3. In the **Customization** section, set the **Custom domain** to your hosted domain
   - Example: `https://your-domain.com` or `https://ship-risk-ai.firebaseapp.com`

### Step 3: Set Action URL

1. In the password reset email template, look for the "Password reset link"
2. The default link format is: `https://your-auth-domain.firebaseapp.com/__/auth/action?...`
3. Firebase will automatically route `/__/auth/action` requests to `/auth/action` in your React app

### Step 4: Test It Out

1. Deploy your app to Firebase Hosting
2. Try the "Forgot Password" flow
3. You should receive an email with your custom reset link
4. Clicking the link will take you to the beautiful new reset page!

## Important Notes

### Password Reset Link Format

Firebase sends links like:

```
https://your-domain.com/__/auth/action?mode=resetPassword&oobCode=ABC123&apiKey=XYZ
```

The `/__/auth/action` path routes to your React component via the new route.

### CORS & Security

- Your reset page uses Firebase SDK functions directly
- All operations are secure (server-side password reset)
- No credentials are exposed

### If You Get Errors

**"Invalid action code" or "Expired link":**

- The reset link may have expired (they expire after 1 hour by default)
- User should request a new password reset

**"Firebase not configured":**

- Make sure your `.env.local` has all Firebase credentials

## Deployment Steps

When you're ready to deploy:

1. **Build the app:**

   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting:**

   ```bash
   firebase deploy
   ```

3. **Configure Firebase Console** (if not already done):
   - Go to Authentication → Templates
   - Customize the password reset email
   - Update the custom domain to your hosted URL

## File Changes

- **Created:** `src/pages/ResetPassword.tsx` - Beautiful password reset page
- **Updated:** `src/App.tsx` - Added `/auth/action` route
- **Updated:** `src/services/firebase.ts` - Added auth persistence

## Styling

The reset page uses:

- Your app's color scheme (dark theme by default)
- Framer Motion for smooth animations
- Glass-morphism effects matching your design system
- Tailwind CSS for responsive design
- Lucide React icons

You can customize the colors in `ResetPassword.tsx` if needed!
