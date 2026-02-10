import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  createFormData,
  validQuoteFormData,
  draftQuote,
  sentQuote,
  fixedLineItem,
  hourlyLineItem,
} from '../../helpers/fixtures';

// Set DATABASE_URL before any imports that might need it
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

describe('quotes actions', () => {
  beforeEach(() => {
    vi.resetModules();
    // Mock db module before importing actions
    vi.doMock('@/lib/db', () => ({
      db: {
        query: {
          quotes: { findFirst: vi.fn(), findMany: vi.fn() },
          lineItems: { findMany: vi.fn() },
        },
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    }));
  });

  afterEach(() => {
    vi.doUnmock('@clerk/nextjs/server');
    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/db/queries');
    vi.doUnmock('@/lib/demo-session');
    vi.doUnmock('@/lib/quote-number');
    vi.doUnmock('next/cache');
    vi.doUnmock('next/navigation');
    vi.doUnmock('nanoid');
  });

  describe('createQuote', () => {
    it('should return error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { createQuote } = await import('@/app/actions/quotes');
      const formData = createFormData(validQuoteFormData);

      const result = await createQuote(formData);

      expect(result).toEqual({
        error: { _form: ['You must be signed in to create a quote'] },
      });
    });

    it('should return validation errors for missing title', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
      }));

      const { createQuote } = await import('@/app/actions/quotes');
      const formData = createFormData({
        clientName: 'Test Client',
      });

      const result = await createQuote(formData);

      expect(result.error).toBeDefined();
      expect(result.error?.title).toBeDefined();
    });

    it('should return validation errors for missing clientName', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
      }));

      const { createQuote } = await import('@/app/actions/quotes');
      const formData = createFormData({
        title: 'Test Quote',
      });

      const result = await createQuote(formData);

      expect(result.error).toBeDefined();
      expect(result.error?.clientName).toBeDefined();
    });

    it('should return validation errors for invalid email format', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
      }));

      const { createQuote } = await import('@/app/actions/quotes');
      const formData = createFormData({
        ...validQuoteFormData,
        clientEmail: 'invalid-email',
      });

      const result = await createQuote(formData);

      expect(result.error).toBeDefined();
      expect(result.error?.clientEmail).toBeDefined();
    });

    it('should return validation errors for deposit percent out of range', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
      }));

      const { createQuote } = await import('@/app/actions/quotes');
      const formData = createFormData({
        ...validQuoteFormData,
        depositPercent: '150', // Over 100%
      });

      const result = await createQuote(formData);

      expect(result.error).toBeDefined();
      expect(result.error?.depositPercent).toBeDefined();
    });

    it('should create quote and redirect on valid data', async () => {
      const mockInsertReturning = vi.fn(() => Promise.resolve([{ id: 'new-quote-uuid' }]));
      const mockInsertValues = vi.fn(() => ({ returning: mockInsertReturning }));
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: { insert: mockInsert },
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('@/lib/quote-number', () => ({
        generateQuoteNumber: vi.fn(() => Promise.resolve('QC-2024-0001')),
      }));
      vi.doMock('nanoid', () => ({
        nanoid: vi.fn(() => 'mock-share-token'),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));
      vi.doMock('next/navigation', () => ({
        redirect: vi.fn(() => {
          throw new Error('NEXT_REDIRECT');
        }),
      }));

      const { createQuote } = await import('@/app/actions/quotes');
      const formData = createFormData(validQuoteFormData);

      await expect(createQuote(formData)).rejects.toThrow('NEXT_REDIRECT');
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('updateQuote', () => {
    it('should return error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { updateQuote } = await import('@/app/actions/quotes');
      const formData = createFormData(validQuoteFormData);

      const result = await updateQuote('quote-id', formData);

      expect(result).toEqual({
        error: { _form: ['You must be signed in to update a quote'] },
      });
    });

    it('should return error when quote not found', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(null)),
            },
          },
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));

      const { updateQuote } = await import('@/app/actions/quotes');
      const formData = createFormData(validQuoteFormData);

      const result = await updateQuote('nonexistent-id', formData);

      expect(result).toEqual({
        error: { _form: ['Quote not found'] },
      });
    });

    it('should return error when quote is not draft', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(sentQuote)),
            },
          },
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));

      const { updateQuote } = await import('@/app/actions/quotes');
      const formData = createFormData(validQuoteFormData);

      const result = await updateQuote(sentQuote.id, formData);

      expect(result).toEqual({
        error: { _form: ['Only draft quotes can be edited'] },
      });
    });

    it('should update draft quote successfully', async () => {
      const mockUpdateWhere = vi.fn(() => Promise.resolve());
      const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
      const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(draftQuote)),
            },
          },
          update: mockUpdate,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { updateQuote } = await import('@/app/actions/quotes');
      const formData = createFormData({
        ...validQuoteFormData,
        title: 'Updated Title',
      });

      const result = await updateQuote(draftQuote.id, formData);

      expect(result).toEqual({ success: true, quoteId: draftQuote.id });
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should increment version on update', async () => {
      let capturedSetArgs: Record<string, unknown> | undefined;
      const mockUpdateWhere = vi.fn(() => Promise.resolve());
      const mockUpdateSet = vi.fn((args) => {
        capturedSetArgs = args;
        return { where: mockUpdateWhere };
      });
      const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve({ ...draftQuote, version: 5 })),
            },
          },
          update: mockUpdate,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { updateQuote } = await import('@/app/actions/quotes');
      const formData = createFormData(validQuoteFormData);

      await updateQuote(draftQuote.id, formData);

      expect(capturedSetArgs?.version).toBe(6);
    });
  });

  describe('deleteQuote', () => {
    it('should throw error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { deleteQuote } = await import('@/app/actions/quotes');

      await expect(deleteQuote('quote-id')).rejects.toThrow('Unauthorized');
    });

    it('should delete quote successfully', async () => {
      const mockDeleteWhere = vi.fn(() => Promise.resolve());
      const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: { delete: mockDelete },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { deleteQuote } = await import('@/app/actions/quotes');

      await deleteQuote(draftQuote.id);

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('duplicateQuote', () => {
    it('should throw error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { duplicateQuote } = await import('@/app/actions/quotes');

      await expect(duplicateQuote('quote-id')).rejects.toThrow('Unauthorized');
    });

    it('should throw error when quote not found', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(null)),
            },
          },
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));

      const { duplicateQuote } = await import('@/app/actions/quotes');

      await expect(duplicateQuote('nonexistent-id')).rejects.toThrow('Quote not found');
    });

    it('should duplicate quote with line items', async () => {
      const mockInsertReturning = vi.fn(() => Promise.resolve([{ id: 'new-quote-uuid' }]));
      const mockInsertValues = vi.fn(() => ({ returning: mockInsertReturning }));
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(draftQuote)),
            },
            lineItems: {
              findMany: vi.fn(() => Promise.resolve([fixedLineItem, hourlyLineItem])),
            },
          },
          insert: mockInsert,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('@/lib/quote-number', () => ({
        generateQuoteNumber: vi.fn(() => Promise.resolve('QC-2024-0002')),
      }));
      vi.doMock('nanoid', () => ({
        nanoid: vi.fn(() => 'new-share-token'),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));
      vi.doMock('next/navigation', () => ({
        redirect: vi.fn(() => {
          throw new Error('NEXT_REDIRECT');
        }),
      }));

      const { duplicateQuote } = await import('@/app/actions/quotes');

      await expect(duplicateQuote(draftQuote.id)).rejects.toThrow('NEXT_REDIRECT');
      // Called twice: once for quote, once for line items
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('should duplicate quote without line items', async () => {
      const mockInsertReturning = vi.fn(() => Promise.resolve([{ id: 'new-quote-uuid' }]));
      const mockInsertValues = vi.fn(() => ({ returning: mockInsertReturning }));
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(draftQuote)),
            },
            lineItems: {
              findMany: vi.fn(() => Promise.resolve([])),
            },
          },
          insert: mockInsert,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('@/lib/quote-number', () => ({
        generateQuoteNumber: vi.fn(() => Promise.resolve('QC-2024-0002')),
      }));
      vi.doMock('nanoid', () => ({
        nanoid: vi.fn(() => 'new-share-token'),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));
      vi.doMock('next/navigation', () => ({
        redirect: vi.fn(() => {
          throw new Error('NEXT_REDIRECT');
        }),
      }));

      const { duplicateQuote } = await import('@/app/actions/quotes');

      await expect(duplicateQuote(draftQuote.id)).rejects.toThrow('NEXT_REDIRECT');
      // Called only once for quote (no line items)
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    it('should add (Copy) suffix to duplicated quote title', async () => {
      let capturedInsertValues: Record<string, unknown>[] = [];
      const mockInsertReturning = vi.fn(() => Promise.resolve([{ id: 'new-quote-uuid' }]));
      const mockInsertValues = vi.fn((values) => {
        capturedInsertValues = Array.isArray(values) ? values : [values];
        return { returning: mockInsertReturning };
      });
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve({ ...draftQuote, title: 'My Quote' })),
            },
            lineItems: {
              findMany: vi.fn(() => Promise.resolve([])),
            },
          },
          insert: mockInsert,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('@/lib/quote-number', () => ({
        generateQuoteNumber: vi.fn(() => Promise.resolve('QC-2024-0002')),
      }));
      vi.doMock('nanoid', () => ({
        nanoid: vi.fn(() => 'new-share-token'),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));
      vi.doMock('next/navigation', () => ({
        redirect: vi.fn(() => {
          throw new Error('NEXT_REDIRECT');
        }),
      }));

      const { duplicateQuote } = await import('@/app/actions/quotes');

      try {
        await duplicateQuote(draftQuote.id);
      } catch {
        // Expected NEXT_REDIRECT error
      }

      expect(capturedInsertValues[0]?.title).toBe('My Quote (Copy)');
    });
  });

  describe('updateQuoteStatus', () => {
    it('should throw error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { updateQuoteStatus } = await import('@/app/actions/quotes');

      await expect(updateQuoteStatus('quote-id', 'sent')).rejects.toThrow('Unauthorized');
    });

    it('should throw error for invalid status', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));

      const { updateQuoteStatus } = await import('@/app/actions/quotes');

      await expect(updateQuoteStatus('quote-id', 'invalid-status')).rejects.toThrow(
        'Invalid quote status',
      );
    });

    it('should throw error when quote not found', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(null)),
            },
          },
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));

      const { updateQuoteStatus } = await import('@/app/actions/quotes');

      await expect(updateQuoteStatus('nonexistent-id', 'sent')).rejects.toThrow('Quote not found');
    });

    it('should update status from draft to sent', async () => {
      let capturedSetArgs: Record<string, unknown> | undefined;
      const mockUpdateWhere = vi.fn(() => Promise.resolve());
      const mockUpdateSet = vi.fn((args) => {
        capturedSetArgs = args;
        return { where: mockUpdateWhere };
      });
      const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          query: {
            quotes: {
              findFirst: vi.fn(() => Promise.resolve(draftQuote)),
            },
          },
          update: mockUpdate,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { updateQuoteStatus } = await import('@/app/actions/quotes');

      await updateQuoteStatus(draftQuote.id, 'sent');

      expect(capturedSetArgs?.status).toBe('sent');
    });

    it.each(['draft', 'sent', 'accepted', 'declined', 'paid'])(
      'should accept status value: %s',
      async (status) => {
        vi.doMock('@clerk/nextjs/server', () => ({
          auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
        }));
        vi.doMock('@/lib/db', () => ({
          db: {
            query: {
              quotes: {
                findFirst: vi.fn(() => Promise.resolve(draftQuote)),
              },
            },
            update: vi.fn(() => ({
              set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
            })),
          },
        }));
        vi.doMock('@/lib/demo-session', () => ({
          getDemoSessionId: vi.fn(() => Promise.resolve(null)),
        }));
        vi.doMock('next/cache', () => ({
          revalidatePath: vi.fn(),
        }));

        const { updateQuoteStatus } = await import('@/app/actions/quotes');
        await expect(updateQuoteStatus(draftQuote.id, status)).resolves.not.toThrow();
      },
    );
  });
});
