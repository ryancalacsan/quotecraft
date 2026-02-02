'use client';

import { Trash2 } from 'lucide-react';

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
import { PRICING_TYPE_LABELS, PRICING_TYPES } from '@/lib/constants';
import { calculateLineItemTotal } from '@/lib/pricing';
import { formatCurrency } from '@/lib/utils';

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
  const total = calculateLineItemTotal({
    rate: item.rate || '0',
    quantity: item.quantity || '0',
    discount: item.discount || '0',
  });

  return (
    <>
      {/* Desktop: grid layout */}
      <div className="hidden items-start gap-2 lg:grid lg:grid-cols-12">
        <div className="col-span-3">
          <Input
            placeholder="Description"
            value={item.description}
            onChange={(e) => onChange(item.id, 'description', e.target.value)}
          />
        </div>
        <div className="col-span-2">
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
          />
        </div>
        <div className="col-span-1">
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
        <div className="col-span-1 flex h-9 items-center justify-end text-sm font-medium">
          {formatCurrency(total)}
        </div>
        <div className="col-span-1 flex justify-end">
          <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="space-y-3 rounded-lg border p-3 lg:hidden">
        <div className="flex items-start justify-between gap-2">
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
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Type</Label>
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
            <div className="flex items-end justify-end pb-1 text-sm font-medium">
              {formatCurrency(total)}
            </div>
          )}
        </div>
        {item.pricingType === 'per_unit' && (
          <div className="text-right text-sm font-medium">{formatCurrency(total)}</div>
        )}
      </div>
    </>
  );
}
