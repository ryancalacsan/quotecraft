import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Webhook } from 'svix';

const SECRET = 'whsec_' + Buffer.from('clerk-webhook-test-secret-key!!').toString('base64');

function signedRequest(payload: unknown, { tamper = false } = {}) {
  const body = JSON.stringify(payload);
  const timestamp = new Date();
  const headers = {
    'svix-id': 'msg_test',
    'svix-timestamp': String(Math.floor(timestamp.getTime() / 1000)),
    'svix-signature': new Webhook(SECRET).sign('msg_test', timestamp, body),
  };
  return { body: tamper ? body.replace('user_1', 'user_2') : body, headers };
}

describe('clerk webhook', () => {
  const onConflictDoUpdate = vi.fn(() => Promise.resolve());
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));
  const where = vi.fn(() => Promise.resolve());
  const del = vi.fn(() => ({ where }));

  async function post({ body, headers }: { body: string; headers: Record<string, string> }) {
    vi.doMock('next/headers', () => ({
      headers: vi.fn(() => Promise.resolve(new Headers(headers))),
    }));
    const { POST } = await import('@/app/api/webhooks/clerk/route');
    return POST(new Request('http://localhost/api/webhooks/clerk', { method: 'POST', body }));
  }

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CLERK_WEBHOOK_SECRET = SECRET;
    vi.doMock('@/lib/db', () => ({ db: { insert, delete: del } }));
  });

  afterEach(() => {
    vi.doUnmock('next/headers');
    vi.doUnmock('@/lib/db');
  });

  it('should upsert user on a validly signed user.created event', async () => {
    const response = await post(
      signedRequest({
        type: 'user.created',
        data: {
          id: 'user_1',
          email_addresses: [{ email_address: 'jo@example.com' }],
          first_name: 'Jo',
          last_name: 'Smith',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(values).toHaveBeenCalledWith({
      id: 'user_1',
      email: 'jo@example.com',
      businessName: 'Jo Smith',
    });
  });

  it('should delete user on user.deleted event', async () => {
    const response = await post(signedRequest({ type: 'user.deleted', data: { id: 'user_1' } }));

    expect(response.status).toBe(200);
    expect(del).toHaveBeenCalled();
  });

  it('should reject a payload that does not match its signature', async () => {
    const response = await post(
      signedRequest({ type: 'user.deleted', data: { id: 'user_1' } }, { tamper: true }),
    );

    expect(response.status).toBe(400);
    expect(del).not.toHaveBeenCalled();
  });

  it('should return 400 when svix headers are missing', async () => {
    const response = await post({ body: '{}', headers: {} });

    expect(response.status).toBe(400);
  });
});
