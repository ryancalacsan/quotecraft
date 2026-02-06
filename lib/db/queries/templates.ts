import { eq, and, desc } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  templates,
  templateItems,
  type Template,
  type NewTemplate,
  type TemplateItem,
  type NewTemplateItem,
} from '@/lib/db/schema';

// Get all templates for a user
export async function getTemplatesByUserId(userId: string): Promise<Template[]> {
  return db
    .select()
    .from(templates)
    .where(eq(templates.userId, userId))
    .orderBy(desc(templates.createdAt));
}

// Get a single template by ID (with ownership check)
export async function getTemplateById(
  templateId: string,
  userId: string,
): Promise<Template | undefined> {
  const result = await db
    .select()
    .from(templates)
    .where(and(eq(templates.id, templateId), eq(templates.userId, userId)))
    .limit(1);

  return result[0];
}

// Get template items by template ID
export async function getTemplateItemsByTemplateId(templateId: string): Promise<TemplateItem[]> {
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
  data: Partial<Omit<NewTemplate, 'id' | 'userId' | 'createdAt'>>,
): Promise<Template | undefined> {
  const result = await db
    .update(templates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(templates.id, templateId), eq(templates.userId, userId)))
    .returning();

  return result[0];
}

// Delete a template (cascade deletes template items)
export async function deleteTemplate(templateId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(templates)
    .where(and(eq(templates.id, templateId), eq(templates.userId, userId)))
    .returning({ id: templates.id });

  return result.length > 0;
}

// Delete all template items for a template
export async function deleteTemplateItems(templateId: string): Promise<void> {
  await db.delete(templateItems).where(eq(templateItems.templateId, templateId));
}
