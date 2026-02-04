'use client';

import * as React from 'react';
import { useForm } from '@tanstack/react-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

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

// Placeholder options for UI – replace with API data later
const FABRIC_TYPES = [
  { value: 'cotton', label: 'Cotton' },
  { value: 'polyester', label: 'Polyester' },
  { value: 'linen', label: 'Linen' },
  { value: 'silk', label: 'Silk' },
];

const FABRIC_STRENGTHS = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

const FABRIC_WIDTHS_CM = [
  { value: '90', label: '90 cm' },
  { value: '110', label: '110 cm' },
  { value: '140', label: '140 cm' },
  { value: '160', label: '160 cm' },
];

export function FabricNewForm() {
  const form = useForm({
    defaultValues: {
      fabricType: '',
      fabricStrength: '',
      fabricWidthCm: '',
      date: undefined as Date | undefined,
      gsmObserved: '',
      gsmCalculated: '',
      fabricLength: '',
      vendorName: '',
      quantity: 1,
    },
    onSubmit: async ({ value }) => {
      console.log('Add Fabric Form submitted:', {
        fabricType: value.fabricType,
        fabricStrength: value.fabricStrength,
        fabricWidthCm: value.fabricWidthCm,
        date: value.date ? format(value.date, 'yyyy-MM-dd') : value.date,
        gsmObserved: value.gsmObserved,
        gsmCalculated: value.gsmCalculated,
        fabricLength: value.fabricLength,
        vendorName: value.vendorName,
        quantity: value.quantity,
      });
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
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select fabric type" />
                </SelectTrigger>
                <SelectContent>
                  {FABRIC_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select strength" />
                </SelectTrigger>
                <SelectContent>
                  {FABRIC_STRENGTHS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
        <form.Field name="fabricWidthCm">
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && !field.state.value}>
              <FieldLabel>Width (cm)</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select width" />
                </SelectTrigger>
                <SelectContent>
                  {FABRIC_WIDTHS_CM.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
    >
      Submit
    </Button>
  </CardFooter>
</Card>
  );
}
