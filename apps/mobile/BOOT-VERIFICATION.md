# Boot verification (blank screen fix)

## What was changed

1. **Safe first frame** (`app/_layout.tsx`): The very first paint is now a minimal screen (dark background + "Roam" text) that does **not** use `GestureHandlerRootView`, Reanimated, Supabase, or Expo Router. After 500ms we mount the full app. If the full app crashes (e.g. GHR/Reanimated), you still get that first screen and the error boundary can show the error.
2. **Outermost error boundary**: Wraps the whole tree so any throw (including from GHR) is caught and shown as "App error" + message.
3. **Init timeout**: After 8s a "Continue" button appears on the safe first frame so you can force into the app if something hangs.
4. **Session timeout**: Reduced to 5s in `lib/hooks/useSession.ts` so "Continue anyway" appears sooner when Supabase is missing or unreachable.
5. **Console logs**: `[BOOT] 0..5` at key points for Metro/logcat.

## How to verify

### Development (Metro)

```bash
cd apps/mobile
npx expo start --offline
```

- You should see: splash → "Roam" (0.5s) → loading spinner or auth/session screen.
- In Metro logs: `[BOOT] 0. RootLayout render`, `[BOOT] 1. app/_layout.tsx loaded`, … `[BOOT] 5. RootNavigator mounted`.
- If you see "App error" + message, the error boundary caught the cause (e.g. GHR/Reanimated or session).

### Built APK (EAS)

1. Build: `eas build -p android --profile preview`
2. Install the new APK on the device.
3. Open the app.
   - **Expected**: Splash → "Roam" (brief) → loading or "Something went wrong" / "Continue anyway" or home.
   - If it stays on splash: native splash hide may be failing (check logcat for `[BOOT]` and `SplashScreen`).
   - If you see "Roam" then blank: the crash is in `GestureHandlerRootView` or `RootNavigator`; check for "App error" or use logcat.
   - If you see "Something went wrong" and "Continue anyway": Supabase env vars are missing or unreachable in the build; add them in EAS env for the profile or tap "Continue anyway" to open the app.

### Logcat (Android)

```bash
adb logcat *:S ReactNative:V ReactNativeJS:V
```

Look for `[BOOT]` and any red error lines after "RootNavigator mounted".

## If it’s still blank

- **Stuck on native splash**: Splash hide runs in SafeFirstFrame’s useEffect; if JS never runs, the native layer may be crashing before React. Check logcat for native crashes (ReactNative, SoLoader, expo).
- **"Roam" then white**: Crash after first frame; ErrorBoundary should show "App error". If not, the crash may be in native (e.g. Reanimated). Ensure you did a **full rebuild** after adding `react-native-reanimated/plugin` to Babel.
- **Expo Go “Failed to download”**: Phone can’t reach Metro (firewall/network). Use USB + `npx expo start` then press `a`, or add firewall rule for port 8081 and use LAN URL.
