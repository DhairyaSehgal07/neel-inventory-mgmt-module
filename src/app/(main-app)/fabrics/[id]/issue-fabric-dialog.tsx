'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type IssueFabricDialogProps = {
  fabricId: number;
  fabricLengthCurrent: number;
  fabricWidthCurrent: number;
};

const defaultValues = {
  lengthIssued: '',
  widthIssued: '',
  purpose: '',
};

export function IssueFabricDialog({
  fabricId,
  fabricLengthCurrent,
  fabricWidthCurrent,
}: IssueFabricDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const length = value.lengthIssued ? parseFloat(value.lengthIssued) : NaN;
      const width = value.widthIssued ? parseFloat(value.widthIssued) : NaN;
      if (Number.isNaN(length) || length <= 0) {
        toast.error('Enter a valid length issued (greater than 0)');
        return;
      }
      if (Number.isNaN(width) || width <= 0) {
        toast.error('Enter a valid width issued (greater than 0)');
        return;
      }
      if (length > fabricLengthCurrent) {
        toast.error(`Length issued cannot exceed current length (${fabricLengthCurrent} m)`);
        return;
      }
      if (width > fabricWidthCurrent) {
        toast.error(`Width issued cannot exceed current width (${fabricWidthCurrent} m)`);
        return;
      }
      if (!value.purpose?.trim()) {
        toast.error('Purpose is required');
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch(`/api/fabrics/${fabricId}/issue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lengthIssued: length,
            widthIssued: width,
            purpose: value.purpose.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message ?? 'Failed to issue fabric');
          return;
        }
        toast.success('Fabric issued successfully. Status set to IN USE.');
        form.reset();
        setOpen(false);
        router.refresh();
      } catch {
        toast.error('Failed to issue fabric');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!submitting) {
      setOpen(next);
      if (!next) form.reset();
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Issue Fabric</Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Fabric</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Record an issue from this fabric. Current length: {fabricLengthCurrent} m, current width:{' '}
            {fabricWidthCurrent} m. The fabric status will be set to IN USE.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <FieldGroup>
              <form.Field name="lengthIssued">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.isTouched &&
                      (field.state.value === '' || parseFloat(field.state.value) > fabricLengthCurrent)
                    }
                  >
                    <FieldLabel>Length issued (m)</FieldLabel>
                    <Input
                      type="number"
                      step="0.001"
                      min={0}
                      max={fabricLengthCurrent}
                      placeholder={`Max ${fabricLengthCurrent}`}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const v = e.target.value;
                        const n = parseFloat(v);
                        if (v !== '' && !Number.isNaN(n) && n > fabricLengthCurrent) {
                          field.handleChange(String(fabricLengthCurrent));
                          return;
                        }
                        field.handleChange(v);
                      }}
                      disabled={submitting}
                    />
                    {field.state.meta.isTouched && field.state.value !== '' && parseFloat(field.state.value) > fabricLengthCurrent && (
                      <FieldError errors={[{ message: `Cannot exceed ${fabricLengthCurrent} m` }]} />
                    )}
                  </Field>
                )}
              </form.Field>
              <form.Field name="widthIssued">
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.isTouched &&
                      (field.state.value === '' || parseFloat(field.state.value) > fabricWidthCurrent)
                    }
                  >
                    <FieldLabel>Width issued (m)</FieldLabel>
                    <Input
                      type="number"
                      step="0.001"
                      min={0}
                      max={fabricWidthCurrent}
                      placeholder={`Max ${fabricWidthCurrent}`}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const v = e.target.value;
                        const n = parseFloat(v);
                        if (v !== '' && !Number.isNaN(n) && n > fabricWidthCurrent) {
                          field.handleChange(String(fabricWidthCurrent));
                          return;
                        }
                        field.handleChange(v);
                      }}
                      disabled={submitting}
                    />
                    {field.state.meta.isTouched && field.state.value !== '' && parseFloat(field.state.value) > fabricWidthCurrent && (
                      <FieldError errors={[{ message: `Cannot exceed ${fabricWidthCurrent} m` }]} />
                    )}
                  </Field>
                )}
              </form.Field>
              <form.Field name="purpose">
                {(field) => (
                  <Field data-invalid={field.state.meta.isTouched && !field.state.value?.trim()}>
                    <FieldLabel>Purpose</FieldLabel>
                    <Textarea
                      placeholder="e.g. Production order #123, Sample batch"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={submitting}
                      rows={3}
                    />
                    {field.state.meta.isTouched && !field.state.value?.trim() && (
                      <FieldError errors={[{ message: 'Purpose is required' }]} />
                    )}
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Issuing…' : 'Issue Fabric'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
