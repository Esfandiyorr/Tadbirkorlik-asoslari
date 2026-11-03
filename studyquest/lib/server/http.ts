import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError } from './auth';
import { quotaExceeded, quotaMessage } from './quota';
export function failure(e: unknown) {
  if (quotaExceeded(e))
    return NextResponse.json(
      { error: quotaMessage, code: 'QUOTA_EXCEEDED' },
      { status: 503, headers: { 'Retry-After': '60' } },
    );
  if (e instanceof SyntaxError)
    return NextResponse.json({ error: 'So‘rov formati noto‘g‘ri' }, { status: 400 });
  if (e instanceof z.ZodError)
    return NextResponse.json(
      {
        error: 'Maydonlarni tekshiring',
        details: e.issues.map((x) => ({ path: x.path, message: x.message })),
      },
      { status: 400 },
    );
  if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(
    'Tadbirkorlik asoslari request failed:',
    e instanceof Error ? e.message : 'unknown',
  );
  return NextResponse.json({ error: 'Amal bajarilmadi. Qayta urining.' }, { status: 500 });
}
