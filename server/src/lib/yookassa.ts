import { randomUUID } from 'crypto';

export const TEST_CARDS = {
  SUCCESS: '4111111111111111',
  FAILURE: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  EXPIRED: '4000000000000069',
  INVALID_CVC: '4000000000000127',
};

export const TEST_SBP_PHONES = {
  SUCCESS: '+79001234567',
  FAILURE: '+79001234568',
};

const YOOKASSA_API = 'https://api.yookassa.ru/v3';

export type YooKassaPayment = {
  id: string;
  status: string;
  amount: { value: string; currency: string };
  confirmation?: { type?: string; confirmation_url?: string };
  description?: string;
  metadata?: Record<string, string>;
  paid?: boolean;
  test?: boolean;
};

function shopId(): string {
  return (process.env.YOOKASSA_SHOP_ID || '').trim();
}

function secretKey(): string {
  return (process.env.YOOKASSA_SECRET_KEY || '').trim();
}

/** Explicit mock, or missing/placeholder credentials → local stub (test_ ids). */
export function shouldUseMockYooKassa(): boolean {
  if (process.env.YOOKASSA_USE_MOCK === 'true') return true;
  if (process.env.YOOKASSA_USE_MOCK === 'false') return false;
  const id = shopId();
  const key = secretKey();
  if (!id || !key) return true;
  if (/your-|changeme|example/i.test(id) || /your-|changeme|example/i.test(key)) {
    return true;
  }
  return false;
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${shopId()}:${secretKey()}`).toString('base64')}`;
}

function clientReturnUrl(paymentId?: string): string {
  const base = (process.env.CLIENT_URL || process.env.APP_BASE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const url = `${base}/payment/callback`;
  return paymentId ? `${url}?payment_id=${encodeURIComponent(paymentId)}` : url;
}

function stringifyMetadata(
  metadata?: Record<string, string | number | boolean | null | undefined>,
): Record<string, string> | undefined {
  if (!metadata) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) continue;
    out[key] = String(value);
  }
  return out;
}

async function yooKassaFetch<T>(
  path: string,
  init: RequestInit & { idempotenceKey?: string } = {},
): Promise<T> {
  const { idempotenceKey, ...rest } = init;
  const headers: Record<string, string> = {
    Authorization: authHeader(),
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string> | undefined),
  };
  if (idempotenceKey) {
    headers['Idempotence-Key'] = idempotenceKey;
  }

  const response = await fetch(`${YOOKASSA_API}${path}`, {
    ...rest,
    headers,
  });

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const detail =
      body && typeof body === 'object'
        ? JSON.stringify(body)
        : text || response.statusText;
    throw new Error(`YooKassa ${response.status}: ${detail}`);
  }

  return body as T;
}

const createMockPayment = (
  amount: number,
  description: string,
  metadata?: Record<string, string>,
): YooKassaPayment => {
  const paymentId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  return {
    id: paymentId,
    status: 'pending',
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB',
    },
    confirmation: {
      type: 'redirect',
      confirmation_url: clientReturnUrl(paymentId),
    },
    description,
    metadata: {
      ...metadata,
      test_mode: 'true',
    },
    test: true,
  };
};

export const createPayment = async (
  amount: number,
  description: string,
  metadata?: Record<string, string>,
  options?: { idempotenceKey?: string; returnUrlPaymentId?: string },
): Promise<YooKassaPayment> => {
  const meta = stringifyMetadata(metadata);
  const returnUrl = clientReturnUrl(options?.returnUrlPaymentId);

  if (shouldUseMockYooKassa()) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const mock = createMockPayment(amount, description, meta);
    if (options?.returnUrlPaymentId) {
      mock.confirmation = {
        type: 'redirect',
        confirmation_url: clientReturnUrl(options.returnUrlPaymentId),
      };
    }
    return mock;
  }

  return yooKassaFetch<YooKassaPayment>('/payments', {
    method: 'POST',
    idempotenceKey: options?.idempotenceKey || randomUUID(),
    body: JSON.stringify({
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      description: description.slice(0, 128),
      metadata: meta,
    }),
  });
};

export const getPayment = async (paymentId: string): Promise<YooKassaPayment> => {
  if (shouldUseMockYooKassa() || paymentId.startsWith('test_')) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      id: paymentId,
      status: 'succeeded',
      amount: { value: '199.00', currency: 'RUB' },
      description: 'Test payment',
      metadata: { test_mode: 'true' },
      test: true,
      paid: true,
    };
  }

  return yooKassaFetch<YooKassaPayment>(`/payments/${encodeURIComponent(paymentId)}`);
};

export const cancelPayment = async (
  paymentId: string,
): Promise<Pick<YooKassaPayment, 'id' | 'status'>> => {
  if (shouldUseMockYooKassa() || paymentId.startsWith('test_')) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { id: paymentId, status: 'canceled' };
  }

  return yooKassaFetch<YooKassaPayment>(`/payments/${encodeURIComponent(paymentId)}/cancel`, {
    method: 'POST',
    idempotenceKey: randomUUID(),
    body: '{}',
  });
};

export const checkPaymentStatus = async (paymentId: string): Promise<YooKassaPayment> => {
  return getPayment(paymentId);
};

export default {
  createPayment,
  getPayment,
  cancelPayment,
  checkPaymentStatus,
  shouldUseMockYooKassa,
};
