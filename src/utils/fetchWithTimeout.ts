import { supabase } from './supabase';

/** Prevent UI requests from remaining pending when an API stops responding. */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 15_000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort(new DOMException(
      `The server did not respond within ${Math.ceil(timeoutMs / 1000)} seconds. Please try again.`,
      'TimeoutError'
    ));
  }, timeoutMs);

  try {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const headers = new Headers(init.headers);

    // Admin endpoints rely on the active Supabase session; public requests need no token.
    if (urlString.includes('/api/admin/')) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
      }
    }

    return await fetch(input, { ...init, headers, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}
