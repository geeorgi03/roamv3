# Recovery workflow: get from blank screen to visible first screen

Run these steps in order. Do not skip.

---

## SECTION A — What is probably happening (plain English)

**Two separate problems:**

1. **Expo Go / QR "not working"**  
   Your phone and your PC cannot talk over Wi‑Fi (firewall, router, or different networks). The phone never receives the app code from your computer. So Expo Go has nothing to run. This is a **network** issue, not an app bug.

2. **APK blank / stuck on splash**  
   The installed APK runs entirely on the phone. It does **not** use your PC. So even if Expo Go is broken, the APK could still work. Blank screen means either:  
   - The JavaScript bundle never runs (native crash or wrong entry), or  
   - It runs but something throws before the first screen draws, or  
   - The first screen draws but the native splash never hides so you never see it.

So: **Expo Go** = “Can my phone load JS from my PC?” (no). **APK** = “Does the JS inside the APK run and draw?” (we don’t know yet). Fixing one does not fix the other. We will **ignore Expo Go for now** and prove whether JS runs at all using an **emulator on your PC** and then the **APK**.

---

## SECTION B — Fastest path to progress (next 30 minutes)

1. **Prove JS runs locally**  
   Use the **Android emulator** on your PC and run the app with `expo run:android`. The app will load JS from Metro on the same machine (no phone, no QR). You will see either “Roam” + next screen or an error. That tells us if the code path works.

2. **If you don’t have an emulator**  
   Install Android Studio, create one AVD, then run step 1. If you cannot or don’t want to use an emulator, the only other way to see logs from a **real device** is: connect the phone by **USB**, enable USB debugging, run `expo run:android` and pick the device. That also loads JS from your PC over USB (no Wi‑Fi).

3. **Prove what the APK does**  
   After step 1 works, build a new APK with EAS and install it. If the APK is still blank, capture **logcat** while opening the app. The logs will show whether JS started and where it stopped ([BOOT] lines or a red error).

4. **Env vars**  
   Only do this after you see “Roam” or “Something went wrong” in the app. If you see “Something went wrong” and “Continue anyway”, then env vars are missing in that build; add them in EAS and rebuild.

Order: **emulator (or USB) first** → then **new APK** → then **env vars if needed**.

---

## SECTION C — Exact commands

**All from a single terminal. Use PowerShell; if a command fails, read SECTION D for that step.**

### Step 1: Go to the app folder

```powershell
cd C:\Users\Georges\Documents\Cursor\apps\mobile
```

### Step 2: Start Metro (leave this running)

```powershell
npx expo start --offline
```

Wait until you see “Metro waiting on …” and a QR code. Leave this window open.

### Step 3: Open a second terminal, same folder, run the app on the emulator

```powershell
cd C:\Users\Georges\Documents\Cursor\apps\mobile
npx expo run:android
```

- If you have an Android emulator already running, the app will install and open on it and load JS from Metro.  
- If you don’t have an emulator, this command may offer to open Android Studio or list devices. Start an emulator from Android Studio (AVD Manager), then run the same command again.

### Step 4 (only if Step 3 works and you see “Roam” or the next screen): Build a new APK

In a **new** terminal:

```powershell
cd C:\Users\Georges\Documents\Cursor\apps\mobile
eas build -p android --profile preview --non-interactive
```

When the build finishes, install the APK from the EAS link on your phone and open it.

### Step 5 (only if the new APK is still blank): Capture logs from the phone

Connect the phone by USB, enable USB debugging, then run:

```powershell
adb logcat -c
adb logcat *:S ReactNative:V ReactNativeJS:V EXPO:V | findstr /i "BOOT ReactNativeJS ERROR"
```

Then **on the phone**: open the app (the new APK) and leave it on the blank/splash screen for about 10 seconds. In the terminal you should see lines. Copy the last 50–100 lines and use them to see where boot stopped (look for `[BOOT]` and any `ERROR`).

---

## SECTION D — What success/failure looks like

### Step 2 (Metro)

- **Success:** Terminal shows “Metro waiting on exp://…” and “Logs for your project will appear below.”  
- **Failure:** Error like “bodyStream” or “Cannot find module”.  
  - **Meaning:** Expo/Metro or node modules issue. Run:  
    `npx expo start --offline --clear`  
    If it still fails, the error message is the blocker.

### Step 3 (expo run:android)

- **Success (emulator or USB device):** App opens; you see a dark screen with “Roam” then either a loading spinner or “Something went wrong” / “Continue anyway” or the sign-in/home screen. In the Metro terminal you see `[BOOT] 0. RootLayout render`, `[BOOT] 1. app/_layout.tsx loaded`, … up to `[BOOT] 5. RootNavigator mounted`.  
- **Failure – “No Android devices”:** Start an emulator from Android Studio (AVD Manager) or connect a phone with USB debugging and run the command again.  
- **Failure – app installs but screen stays blank:** In the **Metro** terminal look for the last `[BOOT]` line. If you see 0, 1, 2, 3 but not 4 or 5, the crash is between SafeFirstFrame and RootNavigator (e.g. GestureHandlerRootView). If you see a red error after a [BOOT] line, that error is the blocker.  
- **Failure – red “App error” screen:** The error boundary caught something. The message on screen is the cause (e.g. missing module, Reanimated, etc.).

### Step 4 (EAS build)

- **Success:** Build finishes; you get a link to download the APK. Install on phone and open.  
- **Failure:** Build fails (e.g. compile error). The EAS build log shows the exact error; fix that before continuing.

### Step 5 (logcat with new APK)

- **Success:** You see lines in the terminal when you open the app. Look for `[BOOT]`.  
  - Last line is `[BOOT] 5. RootNavigator mounted` → JS ran; problem may be splash not hiding or a later screen.  
  - Last line is `[BOOT] 3. SafeFirstFrame mounted` and no 4 or 5 → Something crashed when showing the real app (GestureHandlerRootView / RootNavigator).  
  - You see `RootErrorBoundary caught:` or `ERROR` → Next line usually is the real error.  
- **Failure:** No lines at all when you open the app.  
  - **Meaning:** JS might not be running (native crash before React, or wrong bundle). Try: `adb logcat -c` then `adb logcat` (no filter), open the app, and search the output for “ReactNative”, “expo”, “Error”, “FATAL”.

---

## SECTION E — Cursor repo checks (already done)

| Item | Present? | Where |
|------|----------|--------|
| SafeFirstFrame | Yes | `app/_layout.tsx` – first paint is View + “Roam”, then after 500ms the real app |
| [BOOT] logs | Yes | `app/_layout.tsx` (0–5), `lib/hooks/useSession.ts` (auth/supabase), `lib/supabase.ts` |
| RootErrorBoundary | Yes | `app/_layout.tsx` – wraps whole app, shows “App error” + message |
| SplashScreen.hideAsync | Yes | `app/_layout.tsx` in SafeFirstFrame useEffect and in RootNavigator |
| EXPO_PUBLIC_SUPABASE_URL usage | Yes | `lib/supabase.ts` via `@roam/db`; `_layout` logs it |
| EXPO_PUBLIC_API_URL usage | Yes | Many files; fallback `'http://localhost:3001'` |
| Fallback to localhost | Yes | `process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'` in app and services |

No code changes are required for this recovery workflow. The next step is to **run the commands** and use the results to decide: fix Metro/emulator, fix EAS build, or fix env vars.

---

## SECTION F — If Expo Go keeps failing (backup path, no QR)

Do **not** rely on scanning the QR code. Use one of these:

1. **Android emulator on your PC**  
   Start the emulator, run `npx expo run:android`. The app loads from Metro on localhost. No phone, no Wi‑Fi.

2. **Phone over USB**  
   Connect the phone with USB, enable USB debugging, run `npx expo run:android` and choose the device. Metro serves the app over USB. No Wi‑Fi, no QR.

3. **APK only**  
   Build with `eas build -p android --profile preview`, install the APK, and test. No Metro, no Expo Go. If it’s blank, use logcat (Section C Step 5) to see why.

---

## SECTION G — Final decision

- **Right now:**  
  **Run Section C Steps 1–3** (Metro + `expo run:android` on emulator or USB device).  
  - If you see “Roam” (and then the next screen or “Something went wrong”), **JS and the first screen work**. Then run **Step 4** (new EAS build) and test the new APK. If that APK is still blank, run **Step 5** (logcat) and use the last [BOOT] line and any ERROR to identify the blocker.  
  - If you never see “Roam” and the app is blank even in the emulator, the Metro terminal and any red error (or last [BOOT] line) are the answer; fix that before rebuilding the APK.

- **Do not:**  
  - Fix env vars first (we don’t know yet if the app even reaches the screen that needs them).  
  - Rebuild the APK before proving the app works in the emulator or over USB.  
  - Spend more time on Expo Go / QR until the app is proven to render with `expo run:android`.

**Summary:** Prove rendering locally with `expo run:android` (emulator or USB). Then rebuild APK and, if it’s still blank, use logcat to find the first real blocker.
