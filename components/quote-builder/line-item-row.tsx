'use client';

import { GripVertical, HelpCircle, Trash2, Clock, Tag, Package } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PRICING_TYPE_LABELS, PRICING_TYPES, type PricingType } from '@/lib/constants';
import { calculateLineItemTotal } from '@/lib/pricing';
import { formatCurrency } from '@/lib/utils';

const PRICING_TYPE_DESCRIPTIONS: Record<string, string> = {
  hourly: 'Charge by the hour (e.g., consulting, development)',
  fixed: 'One-time flat fee for the entire item',
  per_unit: 'Charge per unit (e.g., per page, per word)',
};

// Icons for pricing types
const PRICING_TYPE_ICONS: Record<string, React.ElementType> = {
  hourly: Clock,
  fixed: Tag,
  per_unit: Package,
};

export interface LineItemData {
  id: string;
  description: string;
  pricingType: string;
  unit: string;
  rate: string;
  quantity: string;
  discount: string;
}

interface LineItemRowProps {
  item: LineItemData;
  onChange: (id: string, field: keyof LineItemData, value: string) => void;
  onRemove: (id: string) => void;
}

export function LineItemRow({ item, onChange, onRemove }: LineItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const total = calculateLineItemTotal({
    rate: item.rate || '0',
    quantity: item.quantity || '0',
    discount: item.discount || '0',
  });

  const dragHandle = (
    <button
      type="button"
      className="flex h-8 w-6 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
      aria-label="Drag to reorder line item"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );

  // Get icon for current pricing type
  const PricingIcon = PRICING_TYPE_ICONS[item.pricingType] || Tag;

  return (
    <div ref={setNodeRef} style={style}>
      {/* Desktop: grid layout */}
      <div className="hidden items-start gap-2 xl:grid xl:grid-cols-12">
        <div className="col-span-3 flex items-center gap-1">
          {dragHandle}
          <Input
            placeholder="Description"
            value={item.description}
            onChange={(e) => onChange(item.id, 'description', e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="col-span-2">
          <Select
            value={item.pricingType}
            onValueChange={(val) => onChange(item.id, 'pricingType', val)}
          >
            <SelectTrigger>
              <div className="flex items-center gap-1.5">
                <PricingIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{PRICING_TYPE_LABELS[item.pricingType as PricingType]}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {PRICING_TYPES.map((type) => {
                const Icon = PRICING_TYPE_ICONS[type];
                return (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {PRICING_TYPE_LABELS[type]}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        {item.pricingType === 'per_unit' && (
          <div className="col-span-1">
            <Input
              placeholder="Unit"
              value={item.unit}
              onChange={(e) => onChange(item.id, 'unit', e.target.value)}
            />
          </div>
        )}
        <div className={item.pricingType === 'per_unit' ? 'col-span-1' : 'col-span-2'}>
          <Input
            type="number"
            placeholder="Rate"
            min="0"
            step="0.01"
            value={item.rate}
            onChange={(e) => onChange(item.id, 'rate', e.target.value)}
          />
        </div>
        <div className="col-span-1">
          <Input
            type="number"
            placeholder="Qty"
            min="0.01"
            step="0.01"
            value={item.quantity}
            onChange={(e) => onChange(item.id, 'quantity', e.target.value)}
            className="px-1.5 text-center text-xs"
          />
        </div>
        <div className="col-span-1">
          <Input
            type="number"
            placeholder="%"
            min="0"
            max="100"
            step="1"
            value={item.discount}
            onChange={(e) => onChange(item.id, 'discount', e.target.value)}
            className="px-1.5 text-center text-xs"
          />
        </div>
        <div className="col-span-2 flex h-9 items-center justify-end font-mono text-sm tabular-nums">
          {formatCurrency(total)}
        </div>
        <div className="col-span-1 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            aria-label="Remove line item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile/Tablet: stacked layout */}
      <div className="space-y-3 rounded-lg border p-3 xl:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1 pt-1">{dragHandle}</div>
          <div className="flex-1 space-y-1">
            <Label className="text-muted-foreground text-xs">Description</Label>
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) => onChange(item.id, 'description', e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => onRemove(item.id)}
            aria-label="Remove line item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Label className="text-muted-foreground text-xs">Type</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-3 w-3" />
                    <span className="sr-only">Pricing type help</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <ul className="space-y-1">
                    {PRICING_TYPES.map((type) => (
                      <li key={type}>
                        <strong>{PRICING_TYPE_LABELS[type]}:</strong>{' '}
                        {PRICING_TYPE_DESCRIPTIONS[type]}
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={item.pricingType}
              onValueChange={(val) => onChange(item.id, 'pricingType', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICING_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {PRICING_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Rate</Label>
            <Input
              type="number"
              placeholder="Rate"
              min="0"
              step="0.01"
              value={item.rate}
              onChange={(e) => onChange(item.id, 'rate', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Qty</Label>
            <Input
              type="number"
              placeholder="Qty"
              min="0.01"
              step="0.01"
              value={item.quantity}
              onChange={(e) => onChange(item.id, 'quantity', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Discount</Label>
            <Input
              type="number"
              placeholder="%"
              min="0"
              max="100"
              step="0.01"
              value={item.discount}
              onChange={(e) => onChange(item.id, 'discount', e.target.value)}
            />
          </div>
          {item.pricingType === 'per_unit' && (
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Unit</Label>
              <Input
                placeholder="Unit"
                value={item.unit}
                onChange={(e) => onChange(item.id, 'unit', e.target.value)}
              />
            </div>
          )}
          {item.pricingType !== 'per_unit' && (
            <div className="flex items-end justify-end pb-1 font-mono text-sm tabular-nums">
              {formatCurrency(total)}
            </div>
          )}
        </div>
        {item.pricingType === 'per_unit' && (
          <div className="text-right font-mono text-sm tabular-nums">{formatCurrency(total)}</div>
        )}
      </div>
    </div>
  );
}
