type SessionStorage = Pick<Storage, 'getItem' | 'setItem'>;

// Reuse the original anonymous account. Refreshing must never create a new owner.
export async function legacySessionToken(
  apiKey: string | undefined,
  storage: SessionStorage = localStorage,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
) {
  const session = JSON.parse(storage.getItem('terdu_sa') || 'null');
  if (!session?.tok) throw new Error('Seans tugagan. Mavjud hisobingizga qayta kiring.');
  if (session.exp > now + 120000) return session.tok as string;
  if (!session.ref || !apiKey) throw new Error('Seans tugagan. Mavjud hisobingizga qayta kiring.');
  const response = await fetcher(
    'https://securetoken.googleapis.com/v1/token?key=' + encodeURIComponent(apiKey),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: session.ref }),
      signal: AbortSignal.timeout(10000),
    },
  );
  const result = await response.json();
  if (!response.ok || !result.id_token || result.user_id !== session.uid)
    throw new Error('Seans tugagan. Mavjud hisobingizga qayta kiring.');
  storage.setItem(
    'terdu_sa',
    JSON.stringify({
      ...session,
      tok: result.id_token,
      ref: result.refresh_token || session.ref,
      exp: now + Number(result.expires_in || 3600) * 1000,
    }),
  );
  return result.id_token as string;
}
