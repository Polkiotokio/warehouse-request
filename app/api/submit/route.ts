import { NextRequest, NextResponse } from 'next/server';
import { callN8nWebhook } from '@/lib/n8n';

/**
 * POST /api/submit
 * Proxies to n8n /webhook/submit-order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Accept both naming styles
    const name =
      (body as any).requesterName ||
      (body as any).name ||
      '';
    const project =
      (body as any).projectName ||
      (body as any).project ||
      '';
    const items = (body as any).items;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!project || typeof project !== 'string' || project.trim().length < 1) {
      return NextResponse.json({ error: 'Project is required' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item || typeof item !== 'object') {
        return NextResponse.json({ error: 'Invalid item' }, { status: 400 });
      }
      const qty = Number((item as any).quantity ?? (item as any).qty);
      if (!Number.isFinite(qty) || qty < 1 || qty > 50) {
        return NextResponse.json(
          { error: 'Quantity must be between 1 and 50 per line' },
          { status: 400 }
        );
      }
    }

    // Forward the original body shape so n8n keeps working
    const n8nRes = await callN8nWebhook('/webhook/submit-order', {
      method: 'POST',
      body: {
        requesterName: name.trim(),
        projectName: project.trim(),
        items,
      },
    });

    const responseText = await n8nRes.text();
    const contentType = n8nRes.headers.get('content-type') || 'application/json';

    return new NextResponse(responseText, {
      status: n8nRes.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[api/submit]', err);
    return NextResponse.json(
      { error: err.message || 'Submit failed' },
      { status: 500 }
    );
  }
}
