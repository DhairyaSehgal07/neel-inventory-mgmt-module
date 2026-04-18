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
import { CompoundStatus } from '@/generated/prisma/enums';

const STATUS_OPTIONS = Object.values(CompoundStatus);

export type CompoundEditInitial = {
  id: number;
  compoundCode: string;
  dateOfProduction: string;
  createdBy: string;
  compoundName: string;
  batch: string;
  batchCount: number;
  weightPerBatchKg: number;
  totalWeightProducedKg: number;
  weightConsumedKg: number;
  weightRemainingKg: number;
  location: string;
  status: string | null;
};

export function CompoundEditForm({
  compound,
  compoundId,
}: {
  compound: CompoundEditInitial;
  compoundId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const initialDate = React.useMemo(() => {
    try {
      return parseISO(compound.dateOfProduction);
    } catch {
      return new Date(compound.dateOfProduction);
    }
  }, [compound.dateOfProduction]);

  const form = useForm({
    defaultValues: {
      compoundCode: compound.compoundCode,
      date: initialDate,
      createdBy: compound.createdBy,
      compoundName: compound.compoundName,
      batch: compound.batch,
      batchCount: String(compound.batchCount),
      weightPerBatchKg: String(compound.weightPerBatchKg),
      totalWeightProducedKg: String(compound.totalWeightProducedKg),
      weightConsumedKg: String(compound.weightConsumedKg),
      location: compound.location,
      status: compound.status ?? '',
    },
    onSubmit: async ({ value }) => {
      if (!value.date) {
        toast.error('Please select date of production');
        return;
      }
      const batchCount = parseFloat(value.batchCount);
      const weightPerBatchKg = parseFloat(value.weightPerBatchKg);
      const weightConsumedKg = parseFloat(value.weightConsumedKg || '0');
      const totalWeightProducedKg = parseFloat(value.totalWeightProducedKg);
      if (Number.isNaN(batchCount) || batchCount <= 0) {
        toast.error('Batch count must be a positive number');
        return;
      }
      if (Number.isNaN(weightPerBatchKg) || weightPerBatchKg < 0) {
        toast.error('Weight per batch (kg) must be zero or positive');
        return;
      }
      if (Number.isNaN(weightConsumedKg) || weightConsumedKg < 0) {
        toast.error('Weight consumed (kg) must be zero or positive');
        return;
      }
      if (Number.isNaN(totalWeightProducedKg) || totalWeightProducedKg < 0) {
        toast.error('Total produced (kg) must be valid');
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
          compoundCode: value.compoundCode.trim(),
          dateOfProduction: value.date.toISOString(),
          createdBy,
          compoundName: value.compoundName.trim(),
          batch: value.batch.trim(),
          batchCount,
          weightPerBatchKg,
          totalWeightProducedKg,
          weightConsumedKg,
          location: value.location.trim(),
        };
        const st = value.status?.trim();
        if (st) body.status = st;
        else body.status = null;

        const res = await fetch(`/api/compounds/${compoundId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(
            typeof data?.message === 'string' ? data.message : 'Failed to update compound'
          );
          return;
        }
        toast.success('Compound updated');
        router.push(`/compounds/${compoundId}`);
      } catch {
        toast.error('Failed to update compound');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Card className="w-full max-w-3xl rounded-2xl shadow-lg border-muted/40">
      <CardHeader>
        <CardTitle>Edit compound</CardTitle>
        <CardDescription>Update batch weights, location, and status.</CardDescription>
      </CardHeader>
      <CardContent className="bg-muted/30 rounded-xl p-6">
        <form
          id="edit-compound-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <form.Field name="compoundCode">
              {(field) => (
                <Field>
                  <FieldLabel>Compound code</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="compoundName">
              {(field) => (
                <Field>
                  <FieldLabel>Compound name</FieldLabel>
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
                  <FieldLabel>Date of production</FieldLabel>
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
            <form.Field name="batch">
              {(field) => (
                <Field>
                  <FieldLabel>Batch / lot</FieldLabel>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="batchCount">
              {(field) => (
                <Field>
                  <FieldLabel>Batch count</FieldLabel>
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
            <form.Field name="weightPerBatchKg">
              {(field) => (
                <Field>
                  <FieldLabel>Weight per batch (kg)</FieldLabel>
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
            <form.Field name="totalWeightProducedKg">
              {(field) => (
                <Field>
                  <FieldLabel>Total produced (kg)</FieldLabel>
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
            <form.Field name="weightConsumedKg">
              {(field) => (
                <Field>
                  <FieldLabel>Weight consumed (kg)</FieldLabel>
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
                    value={field.state.value || '__none__'}
                    onValueChange={(v) => field.handleChange(v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
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
          <Link href={`/compounds/${compoundId}`}>Cancel</Link>
        </Button>
        <Button type="submit" form="edit-compound-form" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </CardFooter>
    </Card>
  );
}
