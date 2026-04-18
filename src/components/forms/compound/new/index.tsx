'use client';

import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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

export function CompoundNewForm() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [submitting, setSubmitting] = React.useState(false);

  const defaultCreatedBy =
    session?.user?.name?.trim() ||
    (session?.user as { mobileNumber?: string } | undefined)?.mobileNumber?.trim() ||
    '';

  const form = useForm({
    defaultValues: {
      compoundCode: '',
      date: undefined as Date | undefined,
      createdBy: defaultCreatedBy,
      compoundName: '',
      batch: '',
      batchCount: '1',
      weightPerBatchKg: '',
      weightConsumedKg: '0',
      location: '',
      status: '' as string,
    },
    onSubmit: async ({ value }) => {
      if (!(value.compoundCode ?? '').trim() || !(value.compoundName ?? '').trim()) {
        toast.error('Compound code and name are required');
        return;
      }
      if (!(value.batch ?? '').trim() || !(value.location ?? '').trim()) {
        toast.error('Batch and location are required');
        return;
      }
      if (!value.date) {
        toast.error('Please select date of production');
        return;
      }
      const batchCount = parseFloat(value.batchCount);
      const weightPerBatchKg = parseFloat(value.weightPerBatchKg);
      const weightConsumedKg = parseFloat(value.weightConsumedKg || '0');
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
          weightConsumedKg,
          location: value.location.trim(),
        };
        const st = value.status?.trim();
        if (st) body.status = st;

        const res = await fetch('/api/compounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(
            typeof data?.message === 'string' ? data.message : 'Failed to create compound'
          );
          return;
        }
        toast.success('Compound created');
        router.push('/compounds');
      } catch {
        toast.error('Failed to create compound');
      } finally {
        setSubmitting(false);
      }
    },
  });

  React.useEffect(() => {
    if (sessionStatus === 'authenticated' && defaultCreatedBy) {
      form.setFieldValue('createdBy', defaultCreatedBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form instance is stable for setFieldValue
  }, [sessionStatus, defaultCreatedBy]);

  return (
    <Card className="w-full max-w-3xl rounded-2xl shadow-lg border-muted/40">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold tracking-tight">Add compound</CardTitle>
        <CardDescription>
          Register a new compound batch (weight totals are computed from batch count × kg per batch).
        </CardDescription>
      </CardHeader>

      <CardContent className="bg-muted/30 rounded-xl p-6">
        <form
          id="add-compound-form"
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
                    placeholder="e.g. CMP-2026-001"
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
                    placeholder="Name"
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
                    placeholder="Name or ID"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={sessionStatus === 'loading'}
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
                    placeholder="Number of batches"
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
            <form.Field name="weightConsumedKg">
              {(field) => (
                <Field>
                  <FieldLabel>Weight consumed (kg)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
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
                  <FieldLabel>Status (optional)</FieldLabel>
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
        <Button type="button" variant="ghost" onClick={() => router.push('/compounds')}>
          Cancel
        </Button>
        <Button type="submit" form="add-compound-form" disabled={submitting}>
          {submitting ? 'Saving…' : 'Create compound'}
        </Button>
      </CardFooter>
    </Card>
  );
}
