import { NextRequest, NextResponse } from 'next/server';
import { callN8nWebhook } from '../../lib/n8n';

/**
 * GET /api/inventory-search?q=...
 * Proxies to n8n /webhook/inventory-search
 * Add real auth middleware later.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    // Basic sanitisation – expand later
    if (q.length > 200) {
      return NextResponse.json({ error: 'Query too long' }, { status: 400 });
    }

    // Pass through all query params the frontend already sends
    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const n8nRes = await callN8nWebhook('/webhook/inventory-search', {
      method: 'GET',
      query,
    });

    const body = await n8nRes.text();
    const contentType = n8nRes.headers.get('content-type') || 'application/json';

    return new NextResponse(body, {
      status: n8nRes.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[api/inventory-search]', err);
    return NextResponse.json(
      { error: err.message || 'Search failed' },
      { status: 500 }
    );
  }
}
