'use client';

import * as React from 'react';
import { useForm } from '@tanstack/react-form';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// Placeholder options for UI – replace with API data later
const MATERIAL_NAMES = [
  { value: 'cotton-yarn', label: 'Cotton Yarn' },
  { value: 'polyester-fiber', label: 'Polyester Fiber' },
  { value: 'dyes', label: 'Dyes' },
  { value: 'chemicals', label: 'Chemicals' },
];

const MATERIAL_GRADES = [
  { value: 'a', label: 'Grade A' },
  { value: 'b', label: 'Grade B' },
  { value: 'c', label: 'Grade C' },
  { value: 'premium', label: 'Premium' },
];

const VENDOR_NAMES = [
  { value: 'abc-textiles', label: 'ABC Textiles' },
  { value: 'xyz-suppliers', label: 'XYZ Suppliers' },
  { value: 'global-fibers', label: 'Global Fibers' },
  { value: 'prime-materials', label: 'Prime Materials' },
];

const PACKAGING_STYLES = [
  { value: 'roll', label: 'Roll' },
  { value: 'box', label: 'Box' },
  { value: 'bag', label: 'Bag' },
  { value: 'bale', label: 'Bale' },
  { value: 'drum', label: 'Drum' },
];

const UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'metres', label: 'Metres' },
  { value: 'yards', label: 'Yards' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'litres', label: 'Litres' },
];

function AddRawMaterialFormFallback() {
  return (
    <Card className="w-full sm:max-w-lg rounded-2xl shadow-lg border-muted/40">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Add Raw Material
        </CardTitle>
        <CardDescription>
          Add a new raw material entry to your inventory system.
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-muted/30 rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-background px-6 py-4">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-20" />
      </CardFooter>
    </Card>
  );
}

export function AddRawMaterialForm() {
  const form = useForm({
    defaultValues: {
      materialName: '',
      materialGrade: '',
      vendorName: '',
      packagingStyle: '',
      quantity: 1,
      units: '',
      weight: '',
    },
    onSubmit: async ({ value }) => {
      console.log('Add Raw Material Form submitted:', {
        materialName: value.materialName,
        materialGrade: value.materialGrade,
        vendorName: value.vendorName,
        packagingStyle: value.packagingStyle,
        quantity: value.quantity,
        units: value.units,
        weight: value.weight,
      });
    },
  });

  return (
      <Card className="w-full sm:max-w-lg rounded-2xl shadow-lg border-muted/40">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Add Raw Material
          </CardTitle>
          <CardDescription>
            Add a new raw material entry to your inventory system.
          </CardDescription>
        </CardHeader>

        <CardContent className="bg-muted/30 rounded-xl p-6">
          <form
            id="add-raw-material-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Material name */}
              <form.Field name="materialName">
                {(field) => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.value}>
                    <FieldLabel>Material name</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_NAMES.map((opt) => (
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

              {/* Material grade */}
              <form.Field name="materialGrade">
                {(field) => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.value}>
                    <FieldLabel>Material grade</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_GRADES.map((opt) => (
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

              {/* Vendor name */}
              <form.Field name="vendorName">
                {(field) => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.value}>
                    <FieldLabel>Vendor name</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {VENDOR_NAMES.map((opt) => (
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

              {/* Packaging style */}
              <form.Field name="packagingStyle">
                {(field) => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.value}>
                    <FieldLabel>Packaging style</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select packaging" />
                      </SelectTrigger>
                      <SelectContent>
                        {PACKAGING_STYLES.map((opt) => (
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

              {/* Units */}
              <form.Field name="units">
                {(field) => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.value}>
                    <FieldLabel>Units</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select units" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((opt) => (
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

              {/* Weight */}
              <form.Field name="weight">
                {(field) => (
                  <Field>
                    <FieldLabel>Weight</FieldLabel>
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
            </FieldGroup>
          </form>
        </CardContent>

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
            form="add-raw-material-form"
            className="px-8"
          >
            Submit
          </Button>
        </CardFooter>
      </Card>
  );
}
