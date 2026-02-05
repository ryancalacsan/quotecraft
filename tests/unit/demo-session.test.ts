import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('demo-session', () => {
  const originalEnv = process.env.DEMO_USER_ID;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    mockGet = vi.fn();
    vi.doMock('next/headers', () => ({
      cookies: vi.fn(() => Promise.resolve({ get: mockGet })),
    }));
  });

  afterEach(() => {
    process.env.DEMO_USER_ID = originalEnv;
    vi.doUnmock('next/headers');
  });

  describe('getDemoSessionId', () => {
    it('should return null if DEMO_USER_ID is not set', async () => {
      process.env.DEMO_USER_ID = '';
      const { getDemoSessionId } = await import('@/lib/demo-session');

      const result = await getDemoSessionId('any-user-id');

      expect(result).toBeNull();
    });

    it('should return null if DEMO_USER_ID is undefined', async () => {
      delete process.env.DEMO_USER_ID;
      const { getDemoSessionId } = await import('@/lib/demo-session');

      const result = await getDemoSessionId('any-user-id');

      expect(result).toBeNull();
    });

    it('should return null if userId does not match DEMO_USER_ID', async () => {
      process.env.DEMO_USER_ID = 'demo-user-123';
      const { getDemoSessionId } = await import('@/lib/demo-session');

      const result = await getDemoSessionId('different-user-456');

      expect(result).toBeNull();
    });

    it('should return session ID from cookie when user is demo user', async () => {
      process.env.DEMO_USER_ID = 'demo-user-123';
      mockGet.mockReturnValue({ value: 'session-abc-123' });
      const { getDemoSessionId } = await import('@/lib/demo-session');

      const result = await getDemoSessionId('demo-user-123');

      expect(result).toBe('session-abc-123');
    });

    it('should return null if demo_session_id cookie is not set', async () => {
      process.env.DEMO_USER_ID = 'demo-user-123';
      mockGet.mockReturnValue(undefined);
      const { getDemoSessionId } = await import('@/lib/demo-session');

      const result = await getDemoSessionId('demo-user-123');

      expect(result).toBeNull();
    });

    it('should call cookies().get with demo_session_id cookie name', async () => {
      process.env.DEMO_USER_ID = 'demo-user-123';
      mockGet.mockReturnValue({ value: 'test-session' });
      const { getDemoSessionId } = await import('@/lib/demo-session');

      await getDemoSessionId('demo-user-123');

      expect(mockGet).toHaveBeenCalledWith('demo_session_id');
    });
  });
});
