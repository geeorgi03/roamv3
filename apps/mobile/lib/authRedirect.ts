/**
 * Handle Supabase auth redirect from email confirmation / magic link.
 * Call this when the app opens via a deep link (roam://auth/callback#...).
 */
export async function createSessionFromUrl(
  url: string,
  supabase: {
    auth: {
      setSession: (params: { access_token: string; refresh_token: string }) => Promise<{
        data: unknown;
        error: unknown;
      }>;
    };
  }
): Promise<boolean> {
  try {
    const parsed = new URL(url);

    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    if (parsed.hash && parsed.hash.length > 1) {
      const hashParams = new URLSearchParams(parsed.hash.slice(1));
      accessToken = hashParams.get('access_token');
      refreshToken = hashParams.get('refresh_token');
    }

    if (!accessToken || !refreshToken) {
      const searchParams = parsed.searchParams;
      accessToken = accessToken ?? searchParams.get('access_token');
      refreshToken = refreshToken ?? searchParams.get('refresh_token');
    }

    if (!accessToken || !refreshToken) {
      return false;
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('[authRedirect] setSession failed:', (error as any).message ?? error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('[authRedirect] createSessionFromUrl failed:', e);
    return false;
  }
}
