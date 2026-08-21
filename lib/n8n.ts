/**
 * Shared helper for calling hardened n8n webhooks.
 * The secret and base URL live only on the server.
 */

const N8N_BASE = process.env.N8N_WEBHOOK_BASE;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!N8N_BASE) {
  console.warn('N8N_WEBHOOK_BASE is not set');
}
if (!WEBHOOK_SECRET) {
  console.warn('WEBHOOK_SECRET is not set');
}

export type N8nMethod = 'GET' | 'POST';

export async function callN8nWebhook(
  path: string, // e.g. "/webhook/inventory-search" or "/webhook/submit-order"
  options: {
    method?: N8nMethod;
    query?: Record<string, string | number | undefined>;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  if (!N8N_BASE || !WEBHOOK_SECRET) {
    throw new Error('Server misconfiguration: missing N8N_WEBHOOK_BASE or WEBHOOK_SECRET');
  }

  const url = new URL(path.startsWith('http') ? path : `${N8N_BASE.replace(/\/$/, '')}${path}`);

  if (options.query) {
    Object.entries(options.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const headers: Record<string, string> = {
    'X-Webhook-Secret': WEBHOOK_SECRET,
    ...options.headers,
  };

  // Only set Content-Type when we actually send a body
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url.toString(), {
    method: options.method || (options.body ? 'POST' : 'GET'),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    // Do not cache webhook responses
    cache: 'no-store',
  });

  return res;
}

/**
 * Convenience: parse JSON or return text, and re-throw clean errors.
 */
export async function callN8nJson<T = unknown>(
  path: string,
  options: Parameters<typeof callN8nWebhook>[1] = {}
): Promise<T> {
  const res = await callN8nWebhook(path, options);

  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // leave as text
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as any).message)
        : text || res.statusText;
    throw new Error(`n8n error ${res.status}: ${message}`);
  }

  return data as T;
}
