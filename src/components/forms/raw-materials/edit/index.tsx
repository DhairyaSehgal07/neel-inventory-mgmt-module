'use client';

import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { RawMaterialStatus } from '@/generated/prisma/enums';

const STATUS_OPTIONS = Object.values(RawMaterialStatus);

export type RawMaterialEditInitial = {
  id: number;
  materialCode: string;
  date: string;
  createdBy: string;
  rawMaterial: string;
  grade: string | null;
  vendor: string | null;
  units: string;
  weightPerUnit: number;
  purchasedBags: number;
  availableBags: number;
  purchasedWeightKg: number;
  availableWeightKg: number;
  location: string | null;
  status: string | null;
};

export function RawMaterialEditForm({
  row,
  rawMaterialId,
}: {
  row: RawMaterialEditInitial;
  rawMaterialId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const initialDate = React.useMemo(() => {
    try {
      return parseISO(row.date);
    } catch {
      return new Date(row.date);
    }
  }, [row.date]);

  const form = useForm({
    defaultValues: {
      materialCode: row.materialCode,
      date: initialDate,
      createdBy: row.createdBy,
      rawMaterial: row.rawMaterial,
      grade: row.grade ?? '',
      vendor: row.vendor ?? '',
      units: row.units,
      weightPerUnit: String(row.weightPerUnit),
      purchasedBags: String(row.purchasedBags),
      availableBags: String(row.availableBags),
      location: row.location ?? '',
      status: row.status ?? '',
    },
    onSubmit: async ({ value }) => {
      if (!value.date) {
        toast.error('Please select a date');
        return;
      }
      const weightPerUnit = parseFloat(value.weightPerUnit);
      const purchasedBags = parseFloat(value.purchasedBags);
      const availableBags = parseFloat(value.availableBags);
      if (Number.isNaN(weightPerUnit) || weightPerUnit <= 0) {
        toast.error('Weight per unit must be positive');
        return;
      }
      if (Number.isNaN(purchasedBags) || purchasedBags < 0) {
        toast.error('Purchased bags must be non-negative');
        return;
      }
      if (Number.isNaN(availableBags) || availableBags < 0) {
        toast.error('Available bags must be non-negative');
        return;
      }
      if (availableBags - purchasedBags > 1e-6) {
        toast.error('Available bags cannot exceed purchased bags');
        return;
      }
      const createdBy = (value.createdBy ?? '').trim();
      if (!createdBy) {
        toast.error('Created by is required');
        return;
      }

      setSubmitting(true);
      try {
        const body: Record<string, unknown> = {
          materialCode: value.materialCode.trim(),
          date: value.date.toISOString(),
          createdBy,
          rawMaterial: value.rawMaterial.trim(),
          grade: value.grade?.trim() || null,
          vendor: value.vendor?.trim() || null,
          units: value.units.trim(),
          weightPerUnit,
          purchasedBags,
          availableBags,
          location: value.location?.trim() || null,
        };
        const st = value.status?.trim();
        if (st) body.status = st;

        const res = await fetch(`/api/raw-materials/${rawMaterialId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(
            typeof data?.message === 'string' ? data.message : 'Failed to update raw material'
          );
          return;
        }
        toast.success('Raw material updated');
        router.push(`/raw-materials/${rawMaterialId}`);
      } catch {
        toast.error('Failed to update raw material');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Card className="w-full max-w-3xl rounded-2xl shadow-lg border-muted/40">
      <CardHeader>
        <CardTitle>Edit raw material</CardTitle>
        <CardDescription>Update bags, weights, and metadata. Totals must stay consistent.</CardDescription>
      </CardHeader>
      <CardContent className="bg-muted/30 rounded-xl p-6">
        <form
          id="edit-raw-material-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <form.Field name="materialCode">
              {(field) => (
                <Field>
                  <FieldLabel>Material code</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="rawMaterial">
              {(field) => (
                <Field>
                  <FieldLabel>Material name</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="date">
              {(field) => (
                <Field>
                  <FieldLabel>Date</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.state.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {field.state.value ? format(field.state.value, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.state.value}
                        onSelect={(date) => {
                          if (date != null) field.handleChange(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
              )}
            </form.Field>
            <form.Field name="createdBy">
              {(field) => (
                <Field>
                  <FieldLabel>Created by</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="grade">
              {(field) => (
                <Field>
                  <FieldLabel>Grade</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="vendor">
              {(field) => (
                <Field>
                  <FieldLabel>Vendor</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="units">
              {(field) => (
                <Field>
                  <FieldLabel>Units</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="weightPerUnit">
              {(field) => (
                <Field>
                  <FieldLabel>Weight per unit (kg)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="purchasedBags">
              {(field) => (
                <Field>
                  <FieldLabel>Purchased bags</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="availableBags">
              {(field) => (
                <Field>
                  <FieldLabel>Available bags</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <div className="sm:col-span-2 text-xs text-muted-foreground rounded-md border bg-background/80 px-3 py-2">
              Weights (kg) are recalculated on save: purchased = purchased bags × weight per
              unit; available = available bags × weight per unit.
            </div>
            <form.Field name="location">
              {(field) => (
                <Field>
                  <FieldLabel>Location</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="status">
              {(field) => (
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={field.state.value || RawMaterialStatus.OPEN}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-background px-6 py-4">
        <Button type="button" variant="ghost" asChild>
          <Link href={`/raw-materials/${rawMaterialId}`}>Cancel</Link>
        </Button>
        <Button type="submit" form="edit-raw-material-form" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </CardFooter>
    </Card>
  );
}
