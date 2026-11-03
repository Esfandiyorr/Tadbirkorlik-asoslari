import 'server-only';
import { catalog } from '../seed';
export type SitePolicy = {
  maintenance: boolean;
  // Kept for older clients; guest rankings are always disabled.
  publicLeaderboard: boolean;
  allowInitialCode: boolean;
};
export const defaultSitePolicy: SitePolicy = {
  maintenance: false,
  publicLeaderboard: false,
  allowInitialCode: true,
};
let cached: { value: SitePolicy; until: number } | undefined;
export function normalizePolicy(value: any): SitePolicy {
  return Object.fromEntries(
    Object.entries(defaultSitePolicy).map(([key, fallback]) => [
      key,
      key === 'publicLeaderboard'
        ? false
        : typeof value?.[key] === 'boolean'
          ? value[key]
          : fallback,
    ]),
  ) as SitePolicy;
}
export function clearPolicyCache() {
  cached = undefined;
}
export async function sitePolicy(): Promise<SitePolicy> {
  if (process.env.PLATFORM_MAINTENANCE === 'true')
    return { ...defaultSitePolicy, maintenance: true };
  if (
    process.env.NODE_ENV === 'test' ||
    (process.env.STUDYQUEST_DEMO === 'true' &&
      process.env.NODE_ENV !== 'production' &&
      !process.env.VERCEL)
  )
    return defaultSitePolicy;
  if (cached && cached.until > Date.now()) return cached.value;
  const url =
    process.env.FIREBASE_DATABASE_URL ||
    (process.env.FIREBASE_PROJECT_ID === catalog.projectId ? catalog.databaseURL : '');
  if (!url) return defaultSitePolicy;
  try {
    const response = await fetch(url.replace(/\/$/, '') + '/meta/platformPolicy.json', {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) throw Error('Policy unavailable');
    const value = normalizePolicy(await response.json());
    cached = { value, until: Date.now() + 5000 };
    return value;
  } catch {
    return cached?.value || defaultSitePolicy;
  }
}
