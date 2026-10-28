import { eq, and, desc, isNull } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  templates,
  templateItems,
  type Template,
  type NewTemplate,
  type TemplateItem,
  type NewTemplateItem,
} from '@/lib/db/schema';

// Real users only see templates with null demoSessionId; demo users only see their session's
function ownershipFilter(templateId: string, userId: string, demoSessionId: string | null) {
  return and(
    eq(templates.id, templateId),
    eq(templates.userId, userId),
    sessionFilter(demoSessionId),
  );
}

function sessionFilter(demoSessionId: string | null) {
  return demoSessionId
    ? eq(templates.demoSessionId, demoSessionId)
    : isNull(templates.demoSessionId);
}

// Get all templates for a user
export async function getTemplatesByUserId(
  userId: string,
  demoSessionId: string | null = null,
): Promise<Template[]> {
  return db
    .select()
    .from(templates)
    .where(and(eq(templates.userId, userId), sessionFilter(demoSessionId)))
    .orderBy(desc(templates.createdAt));
}

// Get a single template by ID (with ownership check)
export async function getTemplateById(
  templateId: string,
  userId: string,
  demoSessionId: string | null = null,
): Promise<Template | undefined> {
  const result = await db
    .select()
    .from(templates)
    .where(ownershipFilter(templateId, userId, demoSessionId))
    .limit(1);

  return result[0];
}

// Get template items by template ID (with ownership verification)
export async function getTemplateItemsByTemplateId(
  templateId: string,
  userId: string,
  demoSessionId: string | null = null,
): Promise<TemplateItem[]> {
  // First verify template ownership (defense-in-depth)
  const template = await db
    .select({ id: templates.id })
    .from(templates)
    .where(ownershipFilter(templateId, userId, demoSessionId))
    .limit(1);

  if (!template[0]) return [];

  return db
    .select()
    .from(templateItems)
    .where(eq(templateItems.templateId, templateId))
    .orderBy(templateItems.sortOrder);
}

// Create a new template
export async function createTemplate(data: NewTemplate): Promise<Template> {
  const result = await db.insert(templates).values(data).returning();
  return result[0];
}

// Create template items
export async function createTemplateItems(items: NewTemplateItem[]): Promise<TemplateItem[]> {
  if (items.length === 0) return [];
  return db.insert(templateItems).values(items).returning();
}

// Update a template
export async function updateTemplate(
  templateId: string,
  userId: string,
  data: Partial<Omit<NewTemplate, 'id' | 'userId' | 'demoSessionId' | 'createdAt'>>,
  demoSessionId: string | null = null,
): Promise<Template | undefined> {
  const result = await db
    .update(templates)
    .set({ ...data, updatedAt: new Date() })
    .where(ownershipFilter(templateId, userId, demoSessionId))
    .returning();

  return result[0];
}

// Delete a template (cascade deletes template items)
export async function deleteTemplate(
  templateId: string,
  userId: string,
  demoSessionId: string | null = null,
): Promise<boolean> {
  const result = await db
    .delete(templates)
    .where(ownershipFilter(templateId, userId, demoSessionId))
    .returning({ id: templates.id });

  return result.length > 0;
}

// Delete all template items for a template
export async function deleteTemplateItems(templateId: string): Promise<void> {
  await db.delete(templateItems).where(eq(templateItems.templateId, templateId));
}
