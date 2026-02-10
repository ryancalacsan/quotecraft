import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  createFormData,
  validTemplateFormData,
  draftQuote,
  fixedLineItem,
  hourlyLineItem,
  testTemplate,
  testTemplateItem,
  hourlyTemplateItem,
} from '../../helpers/fixtures';

// Set DATABASE_URL before any imports that might need it
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

describe('templates actions', () => {
  beforeEach(() => {
    vi.resetModules();
    // Mock db module before importing actions
    vi.doMock('@/lib/db', () => ({
      db: {
        query: {
          quotes: { findFirst: vi.fn(), findMany: vi.fn() },
          lineItems: { findMany: vi.fn() },
          templates: { findFirst: vi.fn(), findMany: vi.fn() },
          templateItems: { findMany: vi.fn() },
        },
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        transaction: vi.fn(),
      },
    }));
  });

  afterEach(() => {
    vi.doUnmock('@clerk/nextjs/server');
    vi.doUnmock('@/lib/db');
    vi.doUnmock('@/lib/db/queries');
    vi.doUnmock('@/lib/db/queries/templates');
    vi.doUnmock('@/lib/demo-session');
    vi.doUnmock('@/lib/quote-number');
    vi.doUnmock('next/cache');
    vi.doUnmock('next/navigation');
    vi.doUnmock('nanoid');
  });

  describe('saveAsTemplate', () => {
    it('should return error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { saveAsTemplate } = await import('@/app/actions/templates');
      const formData = createFormData({ name: 'Test Template' });

      const result = await saveAsTemplate('quote-id', formData);

      expect(result).toEqual({ error: 'You must be signed in to create a template' });
    });

    it('should return error when quote not found', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
        getQuoteById: vi.fn(() => Promise.resolve(null)),
        getLineItemsByQuoteId: vi.fn(() => Promise.resolve([])),
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));

      const { saveAsTemplate } = await import('@/app/actions/templates');
      const formData = createFormData({ name: 'Test Template' });

      const result = await saveAsTemplate('nonexistent-id', formData);

      expect(result).toEqual({ error: 'Quote not found' });
    });

    it('should return validation errors for missing name', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
        getQuoteById: vi.fn(() => Promise.resolve(draftQuote)),
        getLineItemsByQuoteId: vi.fn(() => Promise.resolve([])),
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));

      const { saveAsTemplate } = await import('@/app/actions/templates');
      const formData = createFormData({}); // Missing name

      const result = await saveAsTemplate(draftQuote.id, formData);

      expect(result.error).toBeDefined();
    });

    it('should save template with line items successfully', async () => {
      const mockCreateTemplate = vi.fn(() =>
        Promise.resolve({
          ...testTemplate,
          id: 'new-template-id',
        }),
      );
      const mockCreateTemplateItems = vi.fn(() => Promise.resolve([]));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
        getQuoteById: vi.fn(() => Promise.resolve(draftQuote)),
        getLineItemsByQuoteId: vi.fn(() => Promise.resolve([fixedLineItem, hourlyLineItem])),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(null)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: mockCreateTemplate,
        createTemplateItems: mockCreateTemplateItems,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { saveAsTemplate } = await import('@/app/actions/templates');
      const formData = createFormData({
        name: 'My Template',
        description: '', // Optional field but must be string
        defaultValidDays: '30',
      });

      const result = await saveAsTemplate(draftQuote.id, formData);

      expect(result).toEqual({ success: true, templateId: 'new-template-id' });
      expect(mockCreateTemplate).toHaveBeenCalled();
      expect(mockCreateTemplateItems).toHaveBeenCalled();
    });

    it('should save template without line items', async () => {
      const mockCreateTemplate = vi.fn(() =>
        Promise.resolve({
          ...testTemplate,
          id: 'new-template-id',
        }),
      );
      const mockCreateTemplateItems = vi.fn(() => Promise.resolve([]));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
        getQuoteById: vi.fn(() => Promise.resolve(draftQuote)),
        getLineItemsByQuoteId: vi.fn(() => Promise.resolve([])),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(null)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: mockCreateTemplate,
        createTemplateItems: mockCreateTemplateItems,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { saveAsTemplate } = await import('@/app/actions/templates');
      const formData = createFormData({
        name: 'Empty Template',
        description: '', // Optional field but must be string
      });

      const result = await saveAsTemplate(draftQuote.id, formData);

      expect(result).toEqual({ success: true, templateId: 'new-template-id' });
      expect(mockCreateTemplateItems).not.toHaveBeenCalled();
    });
  });

  describe('createQuoteFromTemplate', () => {
    it('should return error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { createQuoteFromTemplate } = await import('@/app/actions/templates');

      const result = await createQuoteFromTemplate('template-id');

      expect(result).toEqual({ error: 'You must be signed in to create a quote' });
    });

    it('should return error when template not found', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
        getQuoteById: vi.fn(() => Promise.resolve(null)),
        getLineItemsByQuoteId: vi.fn(() => Promise.resolve([])),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(null)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));

      const { createQuoteFromTemplate } = await import('@/app/actions/templates');

      const result = await createQuoteFromTemplate('nonexistent-id');

      expect(result).toEqual({ error: 'Template not found' });
    });

    it('should create quote from template with items', async () => {
      const mockInsertReturning = vi.fn(() => Promise.resolve([{ id: 'new-quote-id' }]));
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
        getQuoteById: vi.fn(() => Promise.resolve(null)),
        getLineItemsByQuoteId: vi.fn(() => Promise.resolve([])),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(testTemplate)),
        getTemplateItemsByTemplateId: vi.fn(() =>
          Promise.resolve([testTemplateItem, hourlyTemplateItem]),
        ),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('@/lib/quote-number', () => ({
        generateQuoteNumber: vi.fn(() => Promise.resolve('QC-2024-0001')),
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

      const { createQuoteFromTemplate } = await import('@/app/actions/templates');

      await expect(createQuoteFromTemplate(testTemplate.id)).rejects.toThrow('NEXT_REDIRECT');
      // Called twice: once for quote, once for line items
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('should calculate validUntil from defaultValidDays', async () => {
      let capturedInsertValues: Record<string, unknown>[] = [];
      const mockInsertReturning = vi.fn(() => Promise.resolve([{ id: 'new-quote-id' }]));
      const mockInsertValues = vi.fn((values) => {
        capturedInsertValues = Array.isArray(values) ? values : [values];
        return { returning: mockInsertReturning };
      });
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

      const templateWith30Days = {
        ...testTemplate,
        defaultValidDays: 30,
      };

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: { insert: mockInsert },
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
        getQuoteById: vi.fn(() => Promise.resolve(null)),
        getLineItemsByQuoteId: vi.fn(() => Promise.resolve([])),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(templateWith30Days)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('@/lib/quote-number', () => ({
        generateQuoteNumber: vi.fn(() => Promise.resolve('QC-2024-0001')),
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

      const { createQuoteFromTemplate } = await import('@/app/actions/templates');

      try {
        await createQuoteFromTemplate(testTemplate.id);
      } catch {
        // Expected NEXT_REDIRECT error
      }

      // validUntil should be approximately 30 days from now
      const validUntil = capturedInsertValues[0]?.validUntil as Date;
      expect(validUntil).toBeInstanceOf(Date);

      const daysDiff = Math.round((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(31);
    });

    it('should set validUntil to null when defaultValidDays is not set', async () => {
      let capturedInsertValues: Record<string, unknown>[] = [];
      const mockInsertReturning = vi.fn(() => Promise.resolve([{ id: 'new-quote-id' }]));
      const mockInsertValues = vi.fn((values) => {
        capturedInsertValues = Array.isArray(values) ? values : [values];
        return { returning: mockInsertReturning };
      });
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

      const templateWithoutValidDays = {
        ...testTemplate,
        defaultValidDays: null,
      };

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: { insert: mockInsert },
      }));
      vi.doMock('@/lib/db/queries', () => ({
        ensureUserExists: vi.fn(() => Promise.resolve()),
        getQuoteById: vi.fn(() => Promise.resolve(null)),
        getLineItemsByQuoteId: vi.fn(() => Promise.resolve([])),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(templateWithoutValidDays)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));
      vi.doMock('@/lib/demo-session', () => ({
        getDemoSessionId: vi.fn(() => Promise.resolve(null)),
      }));
      vi.doMock('@/lib/quote-number', () => ({
        generateQuoteNumber: vi.fn(() => Promise.resolve('QC-2024-0001')),
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

      const { createQuoteFromTemplate } = await import('@/app/actions/templates');

      try {
        await createQuoteFromTemplate(testTemplate.id);
      } catch {
        // Expected NEXT_REDIRECT error
      }

      expect(capturedInsertValues[0]?.validUntil).toBeNull();
    });
  });

  describe('updateTemplate', () => {
    it('should return error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { updateTemplate } = await import('@/app/actions/templates');
      const formData = createFormData(validTemplateFormData);

      const result = await updateTemplate('template-id', formData);

      expect(result).toEqual({ error: 'You must be signed in to update a template' });
    });

    it('should return error when template not found', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(null)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));

      const { updateTemplate } = await import('@/app/actions/templates');
      const formData = createFormData(validTemplateFormData);

      const result = await updateTemplate('nonexistent-id', formData);

      expect(result).toEqual({ error: 'Template not found' });
    });

    it('should update template metadata successfully', async () => {
      const mockUpdateTemplateQuery = vi.fn(() => Promise.resolve({ id: testTemplate.id }));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(testTemplate)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: mockUpdateTemplateQuery,
        deleteTemplate: vi.fn(),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { updateTemplate } = await import('@/app/actions/templates');
      const formData = createFormData({
        ...validTemplateFormData,
        name: 'Updated Template Name',
      });

      const result = await updateTemplate(testTemplate.id, formData);

      expect(result).toEqual({ success: true });
      expect(mockUpdateTemplateQuery).toHaveBeenCalled();
    });

    it('should return validation errors for invalid data', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(testTemplate)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));

      const { updateTemplate } = await import('@/app/actions/templates');
      const formData = createFormData({
        ...validTemplateFormData,
        defaultDepositPercent: '150', // Over 100%
      });

      const result = await updateTemplate(testTemplate.id, formData);

      expect(result.error).toBeDefined();
    });
  });

  describe('deleteTemplate', () => {
    it('should return error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { deleteTemplate } = await import('@/app/actions/templates');

      const result = await deleteTemplate('template-id');

      expect(result).toEqual({ error: 'You must be signed in to delete a template' });
    });

    it('should delete template successfully', async () => {
      const mockDeleteTemplateQuery = vi.fn(() => Promise.resolve(true));

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(testTemplate)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: mockDeleteTemplateQuery,
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { deleteTemplate } = await import('@/app/actions/templates');

      const result = await deleteTemplate(testTemplate.id);

      expect(result).toEqual({ success: true });
      expect(mockDeleteTemplateQuery).toHaveBeenCalledWith(testTemplate.id, 'test-user-123');
    });
  });

  describe('updateTemplateItems', () => {
    it('should return error when unauthenticated', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: null })),
      }));

      const { updateTemplateItems } = await import('@/app/actions/templates');

      const result = await updateTemplateItems('template-id', []);

      expect(result).toEqual({ error: 'You must be signed in to update template items' });
    });

    it('should return error when template not found', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(null)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));

      const { updateTemplateItems } = await import('@/app/actions/templates');

      const result = await updateTemplateItems('nonexistent-id', []);

      expect(result).toEqual({ error: 'Template not found' });
    });

    it('should replace template items with new ones', async () => {
      const mockDeleteWhere = vi.fn(() => Promise.resolve());
      const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

      const mockInsertValues = vi.fn(() => Promise.resolve());
      const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

      const mockTransaction = vi.fn(async (callback) => {
        const tx = {
          delete: mockDelete,
          insert: mockInsert,
        };
        await callback(tx);
      });

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          transaction: mockTransaction,
        },
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(testTemplate)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { updateTemplateItems } = await import('@/app/actions/templates');

      const newItems = [
        {
          description: 'New Item 1',
          pricingType: 'fixed' as const,
          rate: '100',
          quantity: '1',
          discount: '0',
        },
        {
          description: 'New Item 2',
          pricingType: 'hourly' as const,
          rate: '50',
          quantity: '10',
          discount: '5',
        },
      ];

      const result = await updateTemplateItems(testTemplate.id, newItems);

      expect(result).toEqual({ success: true });
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should clear all items when passed empty array', async () => {
      const mockDeleteWhere = vi.fn(() => Promise.resolve());
      const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

      const mockInsert = vi.fn();

      const mockTransaction = vi.fn(async (callback) => {
        const tx = {
          delete: mockDelete,
          insert: mockInsert,
        };
        await callback(tx);
      });

      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db', () => ({
        db: {
          transaction: mockTransaction,
        },
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(testTemplate)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([testTemplateItem])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));
      vi.doMock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const { updateTemplateItems } = await import('@/app/actions/templates');

      const result = await updateTemplateItems(testTemplate.id, []);

      expect(result).toEqual({ success: true });
      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should return validation errors for invalid items', async () => {
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
      }));
      vi.doMock('@/lib/db/queries/templates', () => ({
        getTemplateById: vi.fn(() => Promise.resolve(testTemplate)),
        getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve([])),
        createTemplate: vi.fn(),
        createTemplateItems: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      }));

      const { updateTemplateItems } = await import('@/app/actions/templates');

      const invalidItems = [
        {
          description: '', // Empty description - invalid
          pricingType: 'fixed' as const,
          rate: '100',
          quantity: '1',
          discount: '0',
        },
      ];

      const result = await updateTemplateItems(testTemplate.id, invalidItems);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid template items');
    });
  });
});
