/**
 * Database mock utilities for testing Server Actions
 *
 * Provides mock factories for Drizzle ORM operations used in Server Actions.
 * These mocks simulate database responses without connecting to a real database.
 */

import { vi, type Mock } from 'vitest';
import type { Quote, LineItem, Template, TemplateItem } from '@/lib/db/schema';

// =============================================================================
// MOCK TYPES
// =============================================================================

export interface MockDb {
  query: {
    quotes: {
      findFirst: Mock;
      findMany: Mock;
    };
    lineItems: {
      findFirst: Mock;
      findMany: Mock;
    };
    templates: {
      findFirst: Mock;
      findMany: Mock;
    };
    templateItems: {
      findFirst: Mock;
      findMany: Mock;
    };
  };
  insert: Mock;
  update: Mock;
  delete: Mock;
  select: Mock;
  transaction: Mock;
}

export interface MockInsertChain {
  values: Mock;
  returning: Mock;
}

export interface MockUpdateChain {
  set: Mock;
  where: Mock;
  returning: Mock;
}

export interface MockDeleteChain {
  where: Mock;
  returning: Mock;
}

export interface MockSelectChain {
  from: Mock;
  where: Mock;
  orderBy: Mock;
  limit: Mock;
}

// =============================================================================
// MOCK FACTORIES
// =============================================================================

/**
 * Creates a mock Drizzle database instance with all common operations.
 */
export function createMockDb(): MockDb {
  // Create chainable mocks for insert operations
  const insertReturning = vi.fn(() => Promise.resolve([]));
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const insertMock = vi.fn(() => ({ values: insertValues }));

  // Create chainable mocks for update operations
  const updateReturning = vi.fn(() => Promise.resolve([]));
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const updateMock = vi.fn(() => ({ set: updateSet }));

  // Create chainable mocks for delete operations
  const deleteReturning = vi.fn(() => Promise.resolve([]));
  const deleteWhere = vi.fn(() => ({ returning: deleteReturning }));
  const deleteMock = vi.fn(() => ({ where: deleteWhere }));

  // Create chainable mocks for select operations
  const selectLimit = vi.fn(() => Promise.resolve([]));
  const selectOrderBy = vi.fn(() => ({ limit: selectLimit }));
  const selectWhere = vi.fn(() => ({ orderBy: selectOrderBy, limit: selectLimit }));
  const selectFrom = vi.fn(() => ({ where: selectWhere, orderBy: selectOrderBy }));
  const selectMock = vi.fn(() => ({ from: selectFrom }));

  // Transaction mock
  const transactionMock = vi.fn((callback) => callback(createMockDb()));

  return {
    query: {
      quotes: {
        findFirst: vi.fn(() => Promise.resolve(null)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      lineItems: {
        findFirst: vi.fn(() => Promise.resolve(null)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      templates: {
        findFirst: vi.fn(() => Promise.resolve(null)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      templateItems: {
        findFirst: vi.fn(() => Promise.resolve(null)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
    },
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
    select: selectMock,
    transaction: transactionMock,
  };
}

/**
 * Configures the mock db to return a specific quote on findFirst
 */
export function mockQuoteFindFirst(mockDb: MockDb, quote: Quote | null): void {
  mockDb.query.quotes.findFirst.mockResolvedValue(quote);
}

/**
 * Configures the mock db to return quotes on findMany
 */
export function mockQuoteFindMany(mockDb: MockDb, quotes: Quote[]): void {
  mockDb.query.quotes.findMany.mockResolvedValue(quotes);
}

/**
 * Configures the mock db to return line items on findMany
 */
export function mockLineItemsFindMany(mockDb: MockDb, items: LineItem[]): void {
  mockDb.query.lineItems.findMany.mockResolvedValue(items);
}

/**
 * Configures insert to return a specific result
 */
export function mockInsertReturning(mockDb: MockDb, result: Array<{ id: string }>): void {
  const returning = vi.fn(() => Promise.resolve(result));
  const values = vi.fn(() => ({ returning }));
  mockDb.insert.mockReturnValue({ values });
}

/**
 * Configures update to return a specific result
 */
export function mockUpdateReturning(mockDb: MockDb, result: Array<{ id: string }>): void {
  const returning = vi.fn(() => Promise.resolve(result));
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  mockDb.update.mockReturnValue({ set });
}

// =============================================================================
// MOCK SETUP HELPERS FOR vi.doMock
// =============================================================================

/**
 * Creates a db mock module for vi.doMock('@/lib/db', ...)
 * Returns both the mock module and the mockDb for configuration.
 */
export function createDbMockModule(): { mockModule: { db: MockDb }; mockDb: MockDb } {
  const mockDb = createMockDb();
  return {
    mockModule: { db: mockDb },
    mockDb,
  };
}

/**
 * Standard mock for Clerk auth - authenticated user
 */
export function createAuthMock(userId: string | null) {
  return {
    auth: vi.fn(() => Promise.resolve({ userId })),
  };
}

/**
 * Standard mock for next/cache
 */
export function createCacheMock() {
  return {
    revalidatePath: vi.fn(),
  };
}

/**
 * Standard mock for next/navigation
 */
export function createNavigationMock() {
  const redirectMock = vi.fn(() => {
    // Next.js redirect throws a special error
    const error = new Error('NEXT_REDIRECT');
    throw error;
  });
  return {
    redirect: redirectMock,
    _redirectMock: redirectMock,
  };
}

/**
 * Standard mock for demo-session
 */
export function createDemoSessionMock(demoSessionId: string | null = null) {
  return {
    getDemoSessionId: vi.fn(() => Promise.resolve(demoSessionId)),
  };
}

/**
 * Standard mock for nanoid
 */
export function createNanoidMock(token = 'mock-share-token-123') {
  return {
    nanoid: vi.fn(() => token),
  };
}

/**
 * Standard mock for quote-number generation
 */
export function createQuoteNumberMock(quoteNumber = 'QC-2024-0001') {
  return {
    generateQuoteNumber: vi.fn(() => Promise.resolve(quoteNumber)),
  };
}

/**
 * Standard mock for ensureUserExists
 */
export function createQueriesMock() {
  return {
    ensureUserExists: vi.fn(() => Promise.resolve()),
    getQuoteById: vi.fn(() => Promise.resolve(null)),
    getLineItemsByQuoteId: vi.fn(() => Promise.resolve([])),
  };
}

// =============================================================================
// TEMPLATE MOCKS
// =============================================================================

/**
 * Creates a mock for template queries
 */
export function createTemplateMock(templates: Template[] = [], templateItems: TemplateItem[] = []) {
  return {
    getTemplateById: vi.fn((templateId: string, userId: string) => {
      return Promise.resolve(
        templates.find((t) => t.id === templateId && t.userId === userId) || null,
      );
    }),
    getTemplateItemsByTemplateId: vi.fn(() => Promise.resolve(templateItems)),
    createTemplate: vi.fn((data) =>
      Promise.resolve({
        id: 'new-template-id',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ),
    createTemplateItems: vi.fn(() => Promise.resolve([])),
    updateTemplate: vi.fn(() => Promise.resolve({ id: 'template-id' })),
    deleteTemplate: vi.fn(() => Promise.resolve(true)),
  };
}
