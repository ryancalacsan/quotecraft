'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';

import { QuoteForm } from './quote-form';
import type { LineItemData } from './line-item-row';
import { addLineItem, updateLineItem, removeLineItem } from '@/app/actions/line-items';
import type { Quote } from '@/lib/db/schema';

interface EditQuoteClientProps {
  quote: Quote;
  initialLineItems: LineItemData[];
}

export function EditQuoteClient({ quote, initialLineItems }: EditQuoteClientProps) {
  const router = useRouter();
  const [lineItems, setLineItems] = useState<LineItemData[]>(initialLineItems);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLineItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleLineItemChange = useCallback(
    (id: string, field: keyof LineItemData, value: string) => {
      setLineItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    },
    [],
  );

  const handleLineItemAdd = useCallback(() => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const newItem: LineItemData = {
      id: tempId,
      description: '',
      pricingType: 'fixed',
      unit: '',
      rate: '',
      quantity: '1',
      discount: '0',
    };
    setLineItems((prev) => [...prev, newItem]);
  }, []);

  const handleLineItemRemove = useCallback(
    (id: string) => {
      setLineItems((prev) => prev.filter((item) => item.id !== id));

      // If this is a persisted item (not temp), delete from DB
      if (!id.startsWith('temp-')) {
        startTransition(async () => {
          await removeLineItem(id, quote.id);
          toast.success('Line item removed');
        });
      }
    },
    [quote.id],
  );

  const handleSaveLineItems = useCallback(() => {
    startTransition(async () => {
      for (const item of lineItems) {
        if (!item.description) continue; // skip empty rows

        const formData = new FormData();
        formData.set('description', item.description);
        formData.set('pricingType', item.pricingType);
        formData.set('unit', item.unit);
        formData.set('rate', item.rate);
        formData.set('quantity', item.quantity);
        formData.set('discount', item.discount);
        formData.set('sortOrder', String(lineItems.indexOf(item)));

        if (item.id.startsWith('temp-')) {
          const result = await addLineItem(quote.id, formData);
          if (result?.error) {
            toast.error(`Error saving "${item.description}": check required fields`);
            return;
          }
        } else {
          const result = await updateLineItem(item.id, quote.id, formData);
          if (result?.error) {
            toast.error(`Error updating "${item.description}": check required fields`);
            return;
          }
        }
      }
      toast.success('Line items saved');
      router.refresh();
    });
  }, [lineItems, quote.id, router]);

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <QuoteForm
          quote={quote}
          lineItems={lineItems}
          onLineItemChange={handleLineItemChange}
          onLineItemRemove={handleLineItemRemove}
          onLineItemAdd={handleLineItemAdd}
        />
      </DndContext>
      {lineItems.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium disabled:opacity-50"
            onClick={handleSaveLineItems}
            disabled={isPending}
          >
            {isPending ? 'Saving Items...' : 'Save Line Items'}
          </button>
        </div>
      )}
    </div>
  );
}
