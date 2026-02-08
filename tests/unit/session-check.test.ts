import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('session-check', () => {
  describe('rate limiting', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    afterEach(() => {
      vi.doUnmock('@clerk/nextjs/server');
    });

    it('should return 401 when user is not authenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { GET } = await import('@/app/api/session-check/route');
      const request = new Request('http://localhost/api/session-check', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const response = await GET(request as never);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
    });

    it('should return 200 when user is authenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'user-123' })),
      }));

      const { GET } = await import('@/app/api/session-check/route');
      const request = new Request('http://localhost/api/session-check', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const response = await GET(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
    });

    it('should return 429 when rate limit is exceeded', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'user-123' })),
      }));

      const { GET } = await import('@/app/api/session-check/route');

      // Make 101 requests from the same IP to exceed the limit
      const testIp = `rate-limit-test-${Date.now()}`;
      let lastResponse;

      for (let i = 0; i < 101; i++) {
        const request = new Request('http://localhost/api/session-check', {
          headers: { 'x-forwarded-for': testIp },
        });
        lastResponse = await GET(request as never);
      }

      expect(lastResponse?.status).toBe(429);
    });
  });
});
