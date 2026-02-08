'use client';

import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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

type Option = { id: number; name?: string; value?: number };

export function FabricNewForm() {
  const router = useRouter();
  const [fabricTypes, setFabricTypes] = React.useState<Option[]>([]);
  const [fabricStrengths, setFabricStrengths] = React.useState<Option[]>([]);
  const [fabricWidths, setFabricWidths] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [typesRes, strengthsRes, widthsRes] = await Promise.all([
          fetch('/api/fabric-types'),
          fetch('/api/fabric-strengths'),
          fetch('/api/fabric-widths'),
        ]);
        if (cancelled) return;

        const typesJson = await typesRes.json().catch(() => ({}));
        const strengthsJson = await strengthsRes.json().catch(() => ({}));
        const widthsJson = await widthsRes.json().catch(() => ({}));

        if (typesRes.ok && Array.isArray(typesJson?.data)) {
          setFabricTypes(typesJson.data);
        } else if (!typesRes.ok) {
          toast.error(typesJson?.message ?? 'Failed to load fabric types');
        }
        if (strengthsRes.ok && Array.isArray(strengthsJson?.data)) {
          setFabricStrengths(strengthsJson.data);
        } else if (!strengthsRes.ok) {
          toast.error(strengthsJson?.message ?? 'Failed to load fabric strengths');
        }
        if (widthsRes.ok && Array.isArray(widthsJson?.data)) {
          setFabricWidths(
            widthsJson.data.map((w: { id: number; value: number }) => ({
              id: w.id,
              name: `${w.value} cm`,
              value: w.value,
            }))
          );
        } else if (!widthsRes.ok) {
          toast.error(widthsJson?.message ?? 'Failed to load fabric widths');
        }
      } catch {
        if (!cancelled) toast.error('Failed to load options. Please refresh.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const form = useForm({
    defaultValues: {
      fabricType: '',
      fabricStrength: '',
      fabricWidth: '',
      date: undefined as Date | undefined,
      gsmObserved: '',
      gsmCalculated: '',
      fabricLength: '',
      vendorName: '',
      netWeight: '',
      quantity: 1,
    },
    onSubmit: async ({ value }) => {
      if (!value.date) {
        toast.error('Please select a date');
        return;
      }
      const fabricTypeId = parseInt(value.fabricType, 10);
      const fabricStrengthId = parseInt(value.fabricStrength, 10);
      const fabricWidthId = parseInt(value.fabricWidth, 10);
      if (Number.isNaN(fabricTypeId) || Number.isNaN(fabricStrengthId) || Number.isNaN(fabricWidthId)) {
        toast.error('Please select fabric type, strength, and width');
        return;
      }
      const gsmObserved = parseFloat(value.gsmObserved) || 0;
      const gsmCalculated = parseFloat(value.gsmCalculated) || 0;
      const fabricLength = parseFloat(value.fabricLength) || 0;
      const netWeight = parseFloat(value.netWeight) || 0;
      setSubmitting(true);
      try {
        const res = await fetch('/api/fabrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: format(value.date, 'yyyy-MM-dd'),
            fabricTypeId,
            fabricStrengthId,
            fabricWidthId,
            fabricLength,
            nameOfVendor: value.vendorName || '—',
            gsmObserved,
            gsmCalculated,
            netWeight,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message ?? 'Failed to create fabric');
          return;
        }
        toast.success('Fabric created. QR code URL saved.');
        router.push(`/products/${data.data.id}`);
      } catch {
        toast.error('Failed to create fabric');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
   <Card className="w-full sm:max-w-lg rounded-2xl shadow-lg border-muted/40">
  <CardHeader className="space-y-1">
    <CardTitle className="text-xl font-semibold tracking-tight">
      Add Fabric
    </CardTitle>
    <CardDescription>
      Add a new fabric entry to your inventory system.
    </CardDescription>
  </CardHeader>

  <CardContent className="bg-muted/30 rounded-xl p-6">
    <form
      id="add-fabric-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* Grid layout */}
      <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Fabric Type */}
        <form.Field name="fabricType">
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && !field.state.value}>
              <FieldLabel>Fabric type</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loading ? 'Loading…' : 'Select fabric type'} />
                </SelectTrigger>
                <SelectContent>
                  {fabricTypes.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? String(opt.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.isTouched && !field.state.value && (
                <FieldError errors={[{ message: 'Required' }]} />
              )}
            </Field>
          )}
        </form.Field>

        {/* Fabric Strength */}
        <form.Field name="fabricStrength">
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && !field.state.value}>
              <FieldLabel>Strength</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loading ? 'Loading…' : 'Select strength'} />
                </SelectTrigger>
                <SelectContent>
                  {fabricStrengths.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? String(opt.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.isTouched && !field.state.value && (
                <FieldError errors={[{ message: 'Required' }]} />
              )}
            </Field>
          )}
        </form.Field>

        {/* Width */}
        <form.Field name="fabricWidth">
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && !field.state.value}>
              <FieldLabel>Width</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loading ? 'Loading…' : 'Select width'} />
                </SelectTrigger>
                <SelectContent>
                  {fabricWidths.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? `${opt.value} m`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.isTouched && !field.state.value && (
                <FieldError errors={[{ message: 'Required' }]} />
              )}
            </Field>
          )}
        </form.Field>

        {/* Date */}
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
                    {field.state.value
                      ? format(field.state.value, 'PPP')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.state.value}
                    onSelect={(date) => field.handleChange(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>
          )}
        </form.Field>

        {/* GSM (observed) */}
        <form.Field name="gsmObserved">
          {(field) => (
            <Field>
              <FieldLabel>GSM (observed)</FieldLabel>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="e.g. 120"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>

        {/* GSM (calculated) */}
        <form.Field name="gsmCalculated">
          {(field) => (
            <Field>
              <FieldLabel>GSM (calculated)</FieldLabel>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="e.g. 118.5"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>

        {/* Fabric length */}
        <form.Field name="fabricLength">
          {(field) => (
            <Field>
              <FieldLabel>Fabric length</FieldLabel>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="e.g. 100 (metres)"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>

        {/* Vendor name */}
        <form.Field name="vendorName">
          {(field) => (
            <Field>
              <FieldLabel>Name of vendor</FieldLabel>
              <Input
                placeholder="e.g. ABC Textiles"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>

        {/* Net weight */}
        <form.Field name="netWeight">
          {(field) => (
            <Field>
              <FieldLabel>Net weight (kg)</FieldLabel>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="e.g. 25.5"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>

        {/* Quantity */}
        <form.Field name="quantity">
          {(field) => (
            <Field>
              <FieldLabel>Quantity</FieldLabel>
              <Input
                type="number"
                min={1}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(
                    Math.max(1, parseInt(e.target.value, 10) || 1)
                  )
                }
              />
            </Field>
          )}
        </form.Field>
      </FieldGroup>
    </form>
  </CardContent>

  {/* Footer */}
  <CardFooter className="flex justify-between border-t bg-background px-6 py-4">
    <Button
      type="button"
      variant="ghost"
      onClick={() => form.reset()}
    >
      Reset
    </Button>

    <Button
      type="submit"
      form="add-fabric-form"
      className="px-8"
      disabled={submitting || loading}
    >
      {submitting ? 'Creating…' : 'Submit'}
    </Button>
  </CardFooter>
</Card>
  );
}
