import { NextRequest, NextResponse } from 'next/server';
import { COURSE_RECEIPT_MAX } from '@/lib/course-access';
import { actor, check, sameOrigin } from '@/lib/server/auth';
import { courseReceipt, submitCoursePayment } from '@/lib/server/course-access';
import { failure } from '@/lib/server/http';

export const runtime = 'nodejs';
const privateHeaders = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest) {
  try {
    const a = await actor(req);
    const q = req.nextUrl.searchParams;
    const receipt = await courseReceipt(
      a,
      q.get('course') || '',
      q.get('uid') || '',
      q.get('id') || '',
    );
    return new NextResponse(new Uint8Array(receipt.bytes), {
      headers: {
        ...privateHeaders,
        'Content-Type': receipt.type,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    check(
      Number(req.headers.get('content-length') || 0) <= COURSE_RECEIPT_MAX + 64_000,
      413,
      'Chek rasmi 1 MB gacha bo‘lsin.',
    );
    const a = await actor(req);
    check(
      req.headers.get('content-type')?.startsWith('multipart/form-data'),
      415,
      'Chek rasmini yuklang.',
    );
    const form = await req.formData();
    const file = form.get('receipt');
    check(file instanceof File && file.size > 0, 400, 'Chek rasmini tanlang.');
    check((file as File).size <= COURSE_RECEIPT_MAX, 413, 'Chek rasmi 1 MB gacha bo‘lsin.');
    return NextResponse.json(
      await submitCoursePayment(
        a,
        { course: form.get('course'), note: form.get('note') ?? '' },
        Buffer.from(await (file as File).arrayBuffer()),
      ),
      { headers: privateHeaders },
    );
  } catch (e) {
    return failure(e);
  }
}
