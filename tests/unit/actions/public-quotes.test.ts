import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { sentQuote, draftQuote, acceptedQuote, expiredQuote } from '../../helpers/fixtures';

// Set DATABASE_URL before any imports that might need it
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

describe('public-quotes actions', () => {
  beforeEach(() => {
    vi.resetModules();
    // Mock db module before importing actions
    vi.doMock('@/lib/db', () => ({
      db: {
        query: {
          quotes: { findFirst: vi.fn(), findMany: vi.fn() },
        },
        update: vi.fn(),
      },
    }));
  });

  afterEach(() => {
    vi.doUnmock('@/lib/db');
    vi.doUnmock('next/cache');
  });

  describe('acceptQuote', () => {
    it('should return error for invalid share token format', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(null)),
            },
          },
        },
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      // Empty token
      const result1 = await acceptQuote('');
      expect(result1).toEqual({ error: 'Invalid share token' });

      // Token with invalid characters
      const result2 = await acceptQuote('invalid!@#$%token');
      expect(result2).toEqual({ error: 'Invalid share token' });
    });

    it('should return error when quote not found', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(null)),
            },
          },
        },
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      const result = await acceptQuote('nonexistent123');

      expect(result).toEqual({ error: 'Quote not found' });
    });

    it('should return error when quote is not in sent status', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(draftQuote)),
            },
          },
        },
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      const result = await acceptQuote(draftQuote.shareToken);

      expect(result).toEqual({ error: 'Quote is no longer available for response' });
    });

    it('should return error when quote is already accepted', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(acceptedQuote)),
            },
          },
        },
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      const result = await acceptQuote(acceptedQuote.shareToken);

      expect(result).toEqual({ error: 'Quote is no longer available for response' });
    });

    it('should return error when quote is expired', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(expiredQuote)),
            },
          },
        },
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      const result = await acceptQuote(expiredQuote.shareToken);

      expect(result).toEqual({ error: 'This quote has expired' });
    });

    it('should accept sent quote successfully', async () => {
      const mockUpdateReturning = vi.fn(() => Promise.resolve([{ id: sentQuote.id }]));
      const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }));
      const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
      const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(sentQuote)),
            },
          },
          update: mockUpdate,
        },
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      const result = await acceptQuote(sentQuote.shareToken);

      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle race condition when quote status changes concurrently', async () => {
      // Simulate a race condition where another request changed the status
      const mockUpdateReturning = vi.fn(() => Promise.resolve([])); // No rows updated
      const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }));
      const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
      const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(sentQuote)),
            },
          },
          update: mockUpdate,
        },
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      const result = await acceptQuote(sentQuote.shareToken);

      expect(result).toEqual({ error: 'Quote is no longer available for response' });
    });

    it('should increment version when accepting', async () => {
      let capturedSetArgs: Record<string, unknown> | undefined;
      const mockUpdateReturning = vi.fn(() => Promise.resolve([{ id: sentQuote.id }]));
      const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }));
      const mockUpdateSet = vi.fn((args) => {
        capturedSetArgs = args;
        return { where: mockUpdateWhere };
      });
      const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve({ ...sentQuote, version: 5 })),
            },
          },
          update: mockUpdate,
        },
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      await acceptQuote(sentQuote.shareToken);

      expect(capturedSetArgs?.status).toBe('accepted');
      expect(capturedSetArgs?.version).toBe(6);
    });
  });

  describe('declineQuote', () => {
    it('should return error for invalid share token', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(null)),
            },
          },
        },
      }));

      const { declineQuote } = await import('@/app/actions/public-quotes');

      const result = await declineQuote('');

      expect(result).toEqual({ error: 'Invalid share token' });
    });

    it('should return error when quote not found', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(null)),
            },
          },
        },
      }));

      const { declineQuote } = await import('@/app/actions/public-quotes');

      const result = await declineQuote('nonexistent123');

      expect(result).toEqual({ error: 'Quote not found' });
    });

    it('should return error when quote is not sent', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(draftQuote)),
            },
          },
        },
      }));

      const { declineQuote } = await import('@/app/actions/public-quotes');

      const result = await declineQuote(draftQuote.shareToken);

      expect(result).toEqual({ error: 'Quote is no longer available for response' });
    });

    it('should return error when quote is expired', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(expiredQuote)),
            },
          },
        },
      }));

      const { declineQuote } = await import('@/app/actions/public-quotes');

      const result = await declineQuote(expiredQuote.shareToken);

      expect(result).toEqual({ error: 'This quote has expired' });
    });

    it('should decline sent quote successfully', async () => {
      let capturedSetArgs: Record<string, unknown> | undefined;
      const mockUpdateReturning = vi.fn(() => Promise.resolve([{ id: sentQuote.id }]));
      const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }));
      const mockUpdateSet = vi.fn((args) => {
        capturedSetArgs = args;
        return { where: mockUpdateWhere };
      });
      const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(sentQuote)),
            },
          },
          update: mockUpdate,
        },
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { declineQuote } = await import('@/app/actions/public-quotes');

      const result = await declineQuote(sentQuote.shareToken);

      expect(result).toEqual({ success: true });
      expect(capturedSetArgs?.status).toBe('declined');
    });

    it('should handle race condition when declining', async () => {
      const mockUpdateReturning = vi.fn(() => Promise.resolve([])); // No rows updated
      const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }));
      const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
      const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(sentQuote)),
            },
          },
          update: mockUpdate,
        },
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { declineQuote } = await import('@/app/actions/public-quotes');

      const result = await declineQuote(sentQuote.shareToken);

      expect(result).toEqual({ error: 'Quote is no longer available for response' });
    });
  });

  describe('share token validation', () => {
    it('should accept valid alphanumeric tokens', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(null)),
            },
          },
        },
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      // Valid nanoid-style tokens
      const result1 = await acceptQuote('abc123XYZ');
      expect(result1.error).toBe('Quote not found'); // Passed validation

      const result2 = await acceptQuote('ABC-def_123');
      expect(result2.error).toBe('Quote not found'); // Passed validation
    });

    it('should reject tokens that are too long', async () => {
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(null)),
            },
          },
        },
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      // Token longer than 30 characters
      const longToken = 'a'.repeat(31);
      const result = await acceptQuote(longToken);

      expect(result).toEqual({ error: 'Invalid share token' });
    });
  });

  describe('quote with null validUntil', () => {
    it('should accept quote without expiration date', async () => {
      const quoteWithoutExpiry = {
        ...sentQuote,
        validUntil: null,
      };

      const mockUpdateReturning = vi.fn(() => Promise.resolve([{ id: quoteWithoutExpiry.id }]));
      const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }));
      const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
      const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(quoteWithoutExpiry)),
            },
          },
          update: mockUpdate,
        },
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { acceptQuote } = await import('@/app/actions/public-quotes');

      const result = await acceptQuote(quoteWithoutExpiry.shareToken);

      expect(result).toEqual({ success: true });
    });
  });
});
