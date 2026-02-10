import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  createFormData,
  validLineItemFormData,
  validHourlyLineItemFormData,
  validPerUnitLineItemFormData,
  draftQuote,
  sentQuote,
} from '../../helpers/fixtures';

// Set DATABASE_URL before any imports that might need it
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

describe('line-items actions', () => {
  beforeEach(() => {
    vi.resetModules();
    // Mock db module before importing actions
    vi.doMock('@/lib/db', () => ({
      db: {
        query: {
          quotes: { findFirst: vi.fn(), findMany: vi.fn() },
          lineItems: { findFirst: vi.fn(), findMany: vi.fn() },
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
    vi.doUnmock('@/lib/demo-session');
    vi.doUnmock('next/cache');
  });

  describe('addLineItem', () => {
    it('should throw error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { addLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData(validLineItemFormData);

      await expect(addLineItem('quote-id', formData)).rejects.toThrow('Unauthorized');
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

      const { addLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData(validLineItemFormData);

      await expect(addLineItem('nonexistent-id', formData)).rejects.toThrow('Quote not found');
    });

    it('should throw error when quote is not draft', async () => {
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

      const { addLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData(validLineItemFormData);

      await expect(addLineItem(sentQuote.id, formData)).rejects.toThrow(
        'Only draft quotes can be edited',
      );
    });

    it('should return validation errors for missing description', async () => {
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
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));

      const { addLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData({
        pricingType: 'fixed',
        rate: '100',
        quantity: '1',
        discount: '0',
        sortOrder: '0',
      });

      const result = await addLineItem(draftQuote.id, formData);

      expect(result?.error).toBeDefined();
      expect(result?.error?.description).toBeDefined();
    });

    it('should return validation errors for invalid rate', async () => {
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
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));

      const { addLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData({
        ...validLineItemFormData,
        rate: '-10', // Negative rate
      });

      const result = await addLineItem(draftQuote.id, formData);

      expect(result?.error).toBeDefined();
      expect(result?.error?.rate).toBeDefined();
    });

    it('should add fixed-price item successfully', async () => {
      const mockInsertValues = vi.fn(() => Promise.resolve());
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
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
          insert: mockInsert,
          update: mockUpdate,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { addLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData(validLineItemFormData);

      const result = await addLineItem(draftQuote.id, formData);

      expect(result).toBeUndefined(); // No error means success
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should add hourly item successfully', async () => {
      let capturedInsertValues: Record<string, unknown> | undefined;
      const mockInsertValues = vi.fn((values) => {
        capturedInsertValues = values;
        return Promise.resolve();
      });
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
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
          insert: mockInsert,
          update: mockUpdate,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { addLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData(validHourlyLineItemFormData);

      await addLineItem(draftQuote.id, formData);

      expect(capturedInsertValues?.pricingType).toBe('hourly');
      expect(capturedInsertValues?.quantity).toBe('10');
    });

    it('should add per_unit item with unit field', async () => {
      let capturedInsertValues: Record<string, unknown> | undefined;
      const mockInsertValues = vi.fn((values) => {
        capturedInsertValues = values;
        return Promise.resolve();
      });
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
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
          insert: mockInsert,
          update: mockUpdate,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { addLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData(validPerUnitLineItemFormData);

      await addLineItem(draftQuote.id, formData);

      expect(capturedInsertValues?.pricingType).toBe('per_unit');
      expect(capturedInsertValues?.unit).toBe('pages');
    });

    it('should bump quote version after adding item', async () => {
      let capturedUpdateSetArgs: Record<string, unknown> | undefined;
      const mockInsertValues = vi.fn(() => Promise.resolve());
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
      const mockUpdateWhere = vi.fn(() => Promise.resolve());
      const mockUpdateSet = vi.fn((args) => {
        capturedUpdateSetArgs = args;
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
              findFirst: vi.fn(() => Promise.resolve({ ...draftQuote, version: 3 })),
            },
          },
          insert: mockInsert,
          update: mockUpdate,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { addLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData(validLineItemFormData);

      await addLineItem(draftQuote.id, formData);

      expect(capturedUpdateSetArgs?.version).toBe(4);
    });
  });

  describe('updateLineItem', () => {
    it('should throw error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { updateLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData(validLineItemFormData);

      await expect(updateLineItem('line-item-id', 'quote-id', formData)).rejects.toThrow(
        'Unauthorized',
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

      const { updateLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData(validLineItemFormData);

      await expect(updateLineItem('line-item-id', 'nonexistent-id', formData)).rejects.toThrow(
        'Quote not found',
      );
    });

    it('should update line item successfully', async () => {
      let capturedSetArgs: Record<string, unknown> | undefined;
      const mockUpdateLineItemWhere = vi.fn(() => Promise.resolve());
      const mockUpdateLineItemSet = vi.fn((args) => {
        capturedSetArgs = args;
        return { where: mockUpdateLineItemWhere };
      });

      const mockUpdateQuoteWhere = vi.fn(() => Promise.resolve());
      const mockUpdateQuoteSet = vi.fn(() => ({ where: mockUpdateQuoteWhere }));

      let updateCallCount = 0;
      const mockUpdate = vi.fn(() => {
        updateCallCount++;
        if (updateCallCount === 1) {
          // First call is for line items
          return { set: mockUpdateLineItemSet };
        }
        // Second call is for quote version bump
        return { set: mockUpdateQuoteSet };
      });

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

      const { updateLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData({
        ...validLineItemFormData,
        description: 'Updated Description',
        rate: '200',
      });

      const result = await updateLineItem('line-item-id', draftQuote.id, formData);

      expect(result).toBeUndefined(); // No error means success
      expect(capturedSetArgs?.description).toBe('Updated Description');
      expect(capturedSetArgs?.rate).toBe('200');
    });

    it('should return validation errors for invalid data', async () => {
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
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));

      const { updateLineItem } = await import('@/app/actions/line-items');
      const formData = createFormData({
        ...validLineItemFormData,
        discount: '150', // Over 100%
      });

      const result = await updateLineItem('line-item-id', draftQuote.id, formData);

      expect(result?.error).toBeDefined();
      expect(result?.error?.discount).toBeDefined();
    });
  });

  describe('removeLineItem', () => {
    it('should throw error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { removeLineItem } = await import('@/app/actions/line-items');

      await expect(removeLineItem('line-item-id', 'quote-id')).rejects.toThrow('Unauthorized');
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

      const { removeLineItem } = await import('@/app/actions/line-items');

      await expect(removeLineItem('line-item-id', 'nonexistent-id')).rejects.toThrow(
        'Quote not found',
      );
    });

    it('should throw error when quote is not draft', async () => {
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

      const { removeLineItem } = await import('@/app/actions/line-items');

      await expect(removeLineItem('line-item-id', sentQuote.id)).rejects.toThrow(
        'Only draft quotes can be edited',
      );
    });

    it('should remove line item and bump version', async () => {
      const mockDeleteWhere = vi.fn(() => Promise.resolve());
      const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

      let capturedUpdateSetArgs: Record<string, unknown> | undefined;
      const mockUpdateWhere = vi.fn(() => Promise.resolve());
      const mockUpdateSet = vi.fn((args) => {
        capturedUpdateSetArgs = args;
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
              findFirst: vi.fn(() => Promise.resolve({ ...draftQuote, version: 2 })),
            },
          },
          delete: mockDelete,
          update: mockUpdate,
        },
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { removeLineItem } = await import('@/app/actions/line-items');

      await removeLineItem('line-item-id', draftQuote.id);

      expect(mockDelete).toHaveBeenCalled();
      expect(capturedUpdateSetArgs?.version).toBe(3);
    });
  });
});
