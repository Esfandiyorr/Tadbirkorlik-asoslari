import { it, expect, vi } from 'vitest';
import { legacySessionToken } from '../lib/legacy-session';
import { freshIdToken, isNetworkError, networkMessage } from '../lib/firebase-client';

function store(exp: number) {
  let value = JSON.stringify({ uid: 'original-owner', tok: 'old', ref: 'refresh', exp });
  return {
    getItem: () => value,
    setItem: (_: string, next: string) => {
      value = next;
    },
  };
}

it('uses a valid existing session without contacting authentication', async () => {
  const fetcher = vi.fn();
  expect(await legacySessionToken('web-key', store(500000), fetcher, 1000)).toBe('old');
  expect(fetcher).not.toHaveBeenCalled();
});

it('refreshes expired sessions while preserving the original ownership identity', async () => {
  const storage = store(1000),
    fetcher = vi.fn().mockResolvedValue(
      Response.json({
        id_token: 'renewed',
        user_id: 'original-owner',
        refresh_token: 'rotated',
        expires_in: '3600',
      }),
    );
  expect(await legacySessionToken('web-key', storage, fetcher, 2000)).toBe('renewed');
  expect(JSON.parse(storage.getItem())).toMatchObject({
    uid: 'original-owner',
    tok: 'renewed',
    ref: 'rotated',
  });
  expect(fetcher.mock.calls[0][0]).toContain('securetoken.googleapis.com/v1/token');
});

it('rejects failed or mismatched refreshes without replacing the stored account', async () => {
  const storage = store(1000),
    original = storage.getItem();
  await expect(
    legacySessionToken(
      'web-key',
      storage,
      vi.fn().mockResolvedValue(
        Response.json({
          id_token: 'another-token',
          user_id: 'another-owner',
        }),
      ),
      2000,
    ),
  ).rejects.toThrow();
  expect(storage.getItem()).toBe(original);
  await expect(legacySessionToken(undefined, storage, vi.fn(), 2000)).rejects.toThrow();
});

it('retries a token once after a network failure and then explains it in Uzbek', async () => {
  const fail = Object.assign(new Error('Firebase: Error (auth/network-request-failed).'), {
    code: 'auth/network-request-failed',
  });
  let calls = 0;
  const flaky = { getIdToken: async () => (++calls === 1 ? Promise.reject(fail) : 'tok') };
  expect(await freshIdToken(flaky, 'uz')).toBe('tok');
  expect(calls).toBe(2);
  const down = { getIdToken: () => Promise.reject(fail) };
  await expect(freshIdToken(down, 'uz')).rejects.toThrow(networkMessage('uz'));
  expect(isNetworkError(fail)).toBe(true);
  expect(networkMessage('uz')).toMatch(/internet/i);
});
