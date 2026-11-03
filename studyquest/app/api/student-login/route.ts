import { NextRequest, NextResponse } from 'next/server';
import { authAdmin, configured } from '@/lib/server/repository';
import { ApiError, check, sameOrigin } from '@/lib/server/auth';
import { isOwnerIdentity } from '@/lib/server/admin-access';
import { sitePolicy } from '@/lib/server/site-policy';
import { sharedLogin } from '@/lib/server/shared-login';
import { failure } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    check(configured(), 503, 'Kirish xizmati hali sozlanmagan.');
    check(!(await sitePolicy()).maintenance, 403, 'Platforma vaqtincha yopiq.');
    const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
    check(token, 401, 'Kirishni qayta boshlang.');
    let identity;
    try {
      identity = await authAdmin().verifyIdToken(token!, true);
    } catch {
      throw new ApiError(401, 'Seans tugagan.');
    }
    check(
      identity.firebase?.sign_in_provider === 'anonymous' && !isOwnerIdentity(identity),
      403,
      'Talaba kirish usulidan foydalaning.',
    );
    const text = await req.text();
    check(text.length < 4096, 413, 'So‘rov juda katta.');
    return NextResponse.json(
      await sharedLogin(identity.uid, JSON.parse(text), (await sitePolicy()).allowInitialCode),
    );
  } catch (error) {
    return failure(error);
  }
}
