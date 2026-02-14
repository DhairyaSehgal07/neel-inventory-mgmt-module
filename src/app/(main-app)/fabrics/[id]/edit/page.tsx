'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from '@tanstack/react-form';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
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

type Option = { id: number; name?: string; value?: number };

type Fabric = {
  id: number;
  date: string;
  fabricTypeId: number;
  fabricStrengthId: number;
  fabricWidthId: number;
  fabricLength: number;
  nameOfVendor: string;
  gsmObserved: number;
  gsmCalculated: number;
  netWeight: number;
  fabricType: { id: number; name: string };
  fabricStrength: { id: number; name: string };
  fabricWidth: { id: number; value: number };
};

export default function FabricEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [fabric, setFabric] = React.useState<Fabric | null>(null);
  const [fabricTypes, setFabricTypes] = React.useState<Option[]>([]);
  const [fabricStrengths, setFabricStrengths] = React.useState<Option[]>([]);
  const [fabricWidths, setFabricWidths] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [fabricRes, typesRes, strengthsRes, widthsRes] = await Promise.all([
          fetch(`/api/fabrics/${id}`),
          fetch('/api/fabric-types'),
          fetch('/api/fabric-strengths'),
          fetch('/api/fabric-widths'),
        ]);
        if (cancelled) return;
        const fabricJson = await fabricRes.json();
        const typesJson = await typesRes.json().catch(() => ({}));
        const strengthsJson = await strengthsRes.json().catch(() => ({}));
        const widthsJson = await widthsRes.json().catch(() => ({}));
        if (fabricRes.ok && fabricJson?.data) setFabric(fabricJson.data);
        else toast.error(fabricJson?.message ?? 'Fabric not found');
        if (typesRes.ok && Array.isArray(typesJson?.data)) setFabricTypes(typesJson.data);
        if (strengthsRes.ok && Array.isArray(strengthsJson?.data)) setFabricStrengths(strengthsJson.data);
        if (widthsRes.ok && Array.isArray(widthsJson?.data)) {
          setFabricWidths(
            widthsJson.data.map((w: { id: number; value: number }) => ({
              id: w.id,
              name: `${w.value} m`,
              value: w.value,
            }))
          );
        }
      } catch {
        if (!cancelled) toast.error('Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || !fabric) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fabrics" aria-label="Back to fabrics">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="py-12 text-center text-muted-foreground">
          {loading ? 'Loading…' : 'Fabric not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/fabrics/${id}`} aria-label="Back to fabric">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Fabric #{fabric.id}</h1>
          <p className="text-muted-foreground text-sm">Update fabric details.</p>
        </div>
      </div>

      <FabricEditForm fabric={fabric} fabricId={id!} />
    </div>
  );
}

function FabricEditForm({ fabric, fabricId }: { fabric: Fabric; fabricId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [fabricTypes, setFabricTypes] = React.useState<Option[]>([]);
  const [fabricStrengths, setFabricStrengths] = React.useState<Option[]>([]);
  const [fabricWidths, setFabricWidths] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/fabric-types'),
      fetch('/api/fabric-strengths'),
      fetch('/api/fabric-widths'),
    ]).then(([typesRes, strengthsRes, widthsRes]) => {
      if (cancelled) return;
      typesRes.json().then((j: { data?: Option[] }) => j?.data && setFabricTypes(j.data));
      strengthsRes.json().then((j: { data?: Option[] }) => j?.data && setFabricStrengths(j.data));
      widthsRes.json().then((j: { data?: { id: number; value: number }[] }) => {
        if (j?.data) setFabricWidths(j.data.map((w) => ({ id: w.id, name: `${w.value} m`, value: w.value })));
      });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const defaultValues = React.useMemo(() => {
    const date = typeof fabric.date === 'string' ? parseISO(fabric.date) : new Date(fabric.date);
    return {
      fabricType: String(fabric.fabricTypeId),
      fabricStrength: String(fabric.fabricStrengthId),
      fabricWidth: String(fabric.fabricWidthId),
      date,
      gsmObserved: String(fabric.gsmObserved),
      gsmCalculated: String(fabric.gsmCalculated),
      fabricLength: String(fabric.fabricLength),
      vendorName: fabric.nameOfVendor ?? '',
      netWeight: String(fabric.netWeight),
    };
  }, [fabric]);

  const form = useForm({
    defaultValues,
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
        const res = await fetch(`/api/fabrics/${fabricId}`, {
          method: 'PATCH',
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
          toast.error(data.message ?? 'Failed to update fabric');
          return;
        }
        toast.success('Fabric updated.');
        router.push(`/fabrics/${fabricId}`);
      } catch {
        toast.error('Failed to update fabric');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Card className="w-full rounded-2xl shadow-lg border-muted/40">
      <CardHeader>
        <CardTitle>Edit Fabric</CardTitle>
        <CardDescription>Update the fabric entry below.</CardDescription>
      </CardHeader>
      <CardContent className="bg-muted/30 rounded-xl p-6">
        <form
          id="edit-fabric-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <form.Field name="fabricType">
                {(field) => (
                  <Field>
                    <FieldLabel>Fabric type</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select fabric type" />
                      </SelectTrigger>
                      <SelectContent>
                        {fabricTypes.map((opt) => (
                          <SelectItem key={opt.id} value={String(opt.id)}>
                            {opt.name ?? String(opt.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>
              <form.Field name="fabricStrength">
                {(field) => (
                  <Field>
                    <FieldLabel>Strength</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select strength" />
                      </SelectTrigger>
                      <SelectContent>
                        {fabricStrengths.map((opt) => (
                          <SelectItem key={opt.id} value={String(opt.id)}>
                            {opt.name ?? String(opt.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>
              <form.Field name="fabricWidth">
                {(field) => (
                  <Field>
                    <FieldLabel>Width</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select width" />
                      </SelectTrigger>
                      <SelectContent>
                        {fabricWidths.map((opt) => (
                          <SelectItem key={opt.id} value={String(opt.id)}>
                            {opt.name ?? `${opt.value} m`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          {field.state.value
                            ? format(field.state.value, 'PPP')
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.state.value}
                          onSelect={(date) => { if (date != null) field.handleChange(date); }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                )}
              </form.Field>
              <form.Field name="gsmObserved">
                {(field) => (
                  <Field>
                    <FieldLabel>GSM (observed)</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              </form.Field>
              <form.Field name="gsmCalculated">
                {(field) => (
                  <Field>
                    <FieldLabel>GSM (calculated)</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              </form.Field>
              <form.Field name="fabricLength">
                {(field) => (
                  <Field>
                    <FieldLabel>Fabric length (m)</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              </form.Field>
              <form.Field name="vendorName">
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
              <form.Field name="netWeight">
                {(field) => (
                  <Field>
                    <FieldLabel>Net weight (kg)</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-background px-6 py-4">
          <Button type="button" variant="ghost" asChild>
            <Link href={`/fabrics/${fabricId}`}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            form="edit-fabric-form"
            className="px-8"
            disabled={submitting || loading}
          >
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </CardFooter>
      </Card>
  );
}
