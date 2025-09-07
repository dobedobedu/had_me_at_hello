import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const model = process.env.OPENROUTER_MODEL || '(unset)';
  const key = process.env.OPENROUTER_API_KEY || '';
  const referer = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  if (!key) {
    return NextResponse.json({ ok: false, reason: 'no_api_key', model, referer }, { status: 200 });
  }

  try {
    const res = await fetch(`${baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'Referer': referer,
        'X-Title': 'Had Me At Hello'
      }
    });
    const ok = res.ok;
    const status = res.status;
    let body: any = undefined;
    try { body = await res.json(); } catch { body = await res.text(); }

    return NextResponse.json({ ok, status, model, referer, sample: typeof body === 'string' ? body.slice(0, 200) : (body?.data?.slice?.(0, 3) || body) });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err), model, referer }, { status: 200 });
  }
}

