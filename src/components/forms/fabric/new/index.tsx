'use client';

import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import { getMultiFabricPdfBlob } from '@/components/pdf/Single-Fabric-Roll-Pdf';
import type { SingleFabricPdfParams } from '@/components/pdf/Single-Fabric-Roll-Pdf';
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

type LocationEntry = { area: string; floor: string };

type CreatedFabric = {
  id: number;
  date: string;
  fabricCode: string;
  fabricType: { name: string };
  fabricStrength: { name: string };
  fabricWidth: { value: number };
  fabricWidthInitial: number;
  fabricWidthCurrent: number;
  fabricLengthInitial: number;
  fabricLengthCurrent: number;
  nameOfVendor: string | null;
  gsmObserved: number;
  gsmCalculated: number;
  netWeight: number;
  status: string | null;
};

type SubmitAction = 'submit' | 'submitAndPrint' | null;

export function FabricNewForm() {
  const router = useRouter();
  const [fabricTypes, setFabricTypes] = React.useState<Option[]>([]);
  const [fabricStrengths, setFabricStrengths] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const submitActionRef = React.useRef<SubmitAction>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [typesRes, strengthsRes] = await Promise.all([
          fetch('/api/fabric-types'),
          fetch('/api/fabric-strengths'),
        ]);
        if (cancelled) return;

        const typesJson = await typesRes.json().catch(() => ({}));
        const strengthsJson = await strengthsRes.json().catch(() => ({}));

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
      widthValue: '',
      date: undefined as Date | undefined,
      gsmObserved: '',
      gsmCalculated: '',
      fabricLengthInitial: '',
      vendorName: '',
      netWeight: '',
      quantity: 1,
      fabricLocations: [[{ area: '', floor: '' }]] as LocationEntry[][],
    },
    onSubmit: async ({ value }) => {
      if (!value.date) {
        toast.error('Please select a date');
        return;
      }
      const fabricTypeId = parseInt(value.fabricType, 10);
      const fabricStrengthId = parseInt(value.fabricStrength, 10);
      const widthValueNum = value.widthValue ? parseFloat(value.widthValue) : NaN;

      if (Number.isNaN(fabricTypeId) || Number.isNaN(fabricStrengthId)) {
        toast.error('Please select fabric type and strength');
        return;
      }
      if (Number.isNaN(widthValueNum) || widthValueNum < 0) {
        toast.error('Please enter a valid width (m)');
        return;
      }

      const gsmObserved = parseFloat(value.gsmObserved) || 0;
      const gsmCalculated = parseFloat(value.gsmCalculated) || 0;
      const fabricLengthInitial = parseFloat(value.fabricLengthInitial) || 0;
      const netWeight = parseFloat(value.netWeight) || 0;
      setSubmitting(true);
      try {
        const quantity = Math.max(1, parseInt(String(value.quantity), 10) || 1);
        const rawPerFabric = (value.fabricLocations ?? [[{ area: '', floor: '' }]]).slice(0, quantity);
        const locationsPerFabric = rawPerFabric.map((locs) =>
          (locs ?? [])
            .filter((l) => (l.area ?? '').trim() && (l.floor ?? '').trim())
            .map((l) => ({ area: (l.area ?? '').trim(), floor: (l.floor ?? '').trim() }))
        );
        const hasAnyLocations = locationsPerFabric.some((arr) => arr.length > 0);

        const res = await fetch('/api/fabrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: format(value.date, 'yyyy-MM-dd'),
            fabricTypeId,
            fabricStrengthId,
            fabricWidthValue: widthValueNum,
            fabricLengthInitial,
            nameOfVendor: value.vendorName || '—',
            gsmObserved,
            gsmCalculated,
            netWeight,
            quantity,
            ...(hasAnyLocations ? { locationsPerFabric } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message ?? 'Failed to create fabric');
          return;
        }
        const created: CreatedFabric[] = Array.isArray(data.data) ? data.data : [data.data];
        toast.success(
          created.length === 1
            ? 'Fabric created. QR code URL saved.'
            : `${created.length} fabrics created. QR code URLs saved.`
        );

        const action = submitActionRef.current;
        submitActionRef.current = null;
        if (action && created.length > 0) {
          try {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? window.location.origin).replace(/\/$/, '');
            const pdfParams: SingleFabricPdfParams[] = await Promise.all(
              created.map(async (fabric) => {
                const productUrl = `${baseUrl}/fabrics/${fabric.id}`;
                const qrDataUrl = await QRCode.toDataURL(productUrl, {
                  type: 'image/png',
                  margin: 2,
                  width: 256,
                });
                return {
                  productUrl,
                  qrDataUrl,
                  id: fabric.id,
                  dateDisplay: format(new Date(fabric.date), 'PPP'),
                  fabricCode: fabric.fabricCode,
                  fabricTypeName: fabric.fabricType?.name ?? '',
                  fabricStrengthName: fabric.fabricStrength?.name ?? '',
                  fabricWidthValue: fabric.fabricWidth?.value ?? 0,
                  fabricWidthInitial: fabric.fabricWidthInitial,
                  fabricWidthCurrent: fabric.fabricWidthCurrent,
                  fabricLengthInitial: fabric.fabricLengthInitial,
                  fabricLengthCurrent: fabric.fabricLengthCurrent,
                  nameOfVendor: fabric.nameOfVendor ?? '',
                  gsmObserved: fabric.gsmObserved,
                  gsmCalculated: fabric.gsmCalculated,
                  netWeight: fabric.netWeight,
                  status: fabric.status ?? undefined,
                };
              })
            );
            const blob = await getMultiFabricPdfBlob(pdfParams);
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (action === 'submitAndPrint' && win) {
              setTimeout(() => {
                try {
                  win.print();
                } catch {
                  // PDF viewer may not support print(); user can print manually from the opened tab
                }
              }, 1200);
            }
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
          } catch (err) {
            console.error('Failed to generate PDF:', err);
            toast.error('Could not open PDF. You can print from the fabrics list.');
          }
        }

        router.push('/fabrics');
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

        {/* Width (m) — manual entry */}
        <form.Field name="widthValue">
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && !field.state.value}>
              <FieldLabel>Width (cm)</FieldLabel>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="e.g. 1.6"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
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
              <FieldLabel>GSM (observed Kg)</FieldLabel>
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
              <FieldLabel>GSM (calculated Kg)</FieldLabel>
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

        {/* Fabric length (initial) — current will match until consumed */}
        <form.Field name="fabricLengthInitial">
          {(field) => (
            <Field>
              <FieldLabel>Fabric length initial (m)</FieldLabel>
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
          {(field) => {
            const quantity = field.state.value ?? 1;
            return (
              <Field>
                <FieldLabel>Quantity</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const newQ = Math.max(1, parseInt(e.target.value, 10) || 1);
                    field.handleChange(newQ);
                    const current =
                      form.state.values.fabricLocations ?? [[{ area: '', floor: '' }]];
                    let next = [...current];
                    if (next.length < newQ) {
                      while (next.length < newQ) {
                        next = [...next, [{ area: '', floor: '' }]];
                      }
                    } else if (next.length > newQ) {
                      next = next.slice(0, newQ);
                    }
                    form.setFieldValue('fabricLocations', next);
                  }}
                />
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      {/* Per-fabric locations (one row per fabric, driven by quantity) */}
      <form.Field name="fabricLocations">
        {(field) => {
          const quantity = Math.max(1, form.state.values.quantity ?? 1);
          const fabricLocations = field.state.value ?? [[{ area: '', floor: '' }]];
          return (
            <div className="space-y-4">
              <FieldLabel>Locations (optional)</FieldLabel>
              <p className="text-sm text-muted-foreground">
                Area and floor for each fabric. Leave empty to skip.
              </p>
              {Array.from({ length: quantity }, (_, fabricIndex) => {
                const locs = fabricLocations[fabricIndex] ?? [{ area: '', floor: '' }];
                const loc = locs[0] ?? { area: '', floor: '' };
                return (
                  <div
                    key={fabricIndex}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-muted/50 bg-muted/20 p-4 sm:grid-cols-2"
                  >
                    <span className="text-sm font-medium sm:col-span-2">
                      Fabric {fabricIndex + 1} location
                    </span>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        Area
                      </label>
                      <Input
                        placeholder="e.g. Warehouse A"
                        value={loc.area ?? ''}
                        onChange={(e) => {
                          const next = [...fabricLocations];
                          while (next.length <= fabricIndex) {
                            next.push([{ area: '', floor: '' }]);
                          }
                          next[fabricIndex] = [{ ...(next[fabricIndex]?.[0] ?? { area: '', floor: '' }), area: e.target.value }];
                          field.handleChange(next);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        Floor
                      </label>
                      <Input
                        placeholder="e.g. Floor 1"
                        value={loc.floor ?? ''}
                        onChange={(e) => {
                          const next = [...fabricLocations];
                          while (next.length <= fabricIndex) {
                            next.push([{ area: '', floor: '' }]);
                          }
                          next[fabricIndex] = [{ ...(next[fabricIndex]?.[0] ?? { area: '', floor: '' }), floor: e.target.value }];
                          field.handleChange(next);
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }}
      </form.Field>
    </form>
  </CardContent>

  {/* Footer */}
  <CardFooter className="flex flex-wrap justify-between gap-2 border-t bg-background px-6 py-4">
    <Button
      type="button"
      variant="ghost"
      onClick={() => form.reset()}
    >
      Reset
    </Button>

    <div className="flex gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={submitting || loading}
        onClick={() => {
          submitActionRef.current = 'submit';
          form.handleSubmit();
        }}
        className="px-6"
      >
        {submitting ? 'Creating…' : 'Submit'}
      </Button>
      <Button
        type="button"
        variant="default"
        disabled={submitting || loading}
        onClick={() => {
          submitActionRef.current = 'submitAndPrint';
          form.handleSubmit();
        }}
        className="px-6"
      >
        {submitting ? 'Creating…' : 'Submit and Print'}
      </Button>
    </div>
  </CardFooter>
</Card>
  );
}
