DEP-2 · Mobile Runtime Configuration + Supabase Deep-Link Auth Readiness
=========================================================================

## Pre-build: Supabase Dashboard
[ ] 1. Open Supabase Dashboard → Authentication → URL Configuration
[ ] 2. Under "Redirect URLs", add:  roam://**
[ ] 3. Save.

## EAS Build Profiles (already configured in eas.json — verify before each build)
[ ] 4. preview.env.EXPO_PUBLIC_SUPABASE_URL  = https://onlmbynqfdqqzeqzzzpq.supabase.co
[ ] 5. preview.env.EXPO_PUBLIC_API_URL       = https://roam-api.onrender.com
[ ] 6. production.env values match preview (already set)

## Build + Distribute
[ ] 7. cd apps/mobile && npx eas build -p android --profile preview
[ ] 8. Install APK on test device.

## Smoke Test — Auth Deep Link
[ ] 9.  Sign up with a real email address.
[ ] 10. Tap the confirmation link in the email.
[ ] 11. Verify the app opens (roam:// scheme handled).
[ ] 12. Verify the user is signed in and lands on the home screen.

## Smoke Test — Runtime API Override (no rebuild)
[ ] 13. Open app → Profile tab.
[ ] 14. Tap the plan badge 5 times to reveal Developer Settings.
[ ] 15. Enter a new API URL and tap Save.
[ ] 16. Verify API calls use the new URL (check network logs or server logs).
[ ] 17. Tap Reset to restore default.

## Sign-in Regression
[ ] 18. Sign out, sign back in with email + password.
[ ] 19. Verify home screen loads and clips/sessions are accessible.

