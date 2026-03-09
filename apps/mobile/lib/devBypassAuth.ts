/**
 * Dev-only: allow opening the main app without signing in.
 * Used when testing on device/emulator without Supabase configured.
 */
let _devBypassAuth = false;

export function getDevBypassAuth(): boolean {
  return _devBypassAuth;
}

export function setDevBypassAuth(value: boolean): void {
  _devBypassAuth = value;
}
