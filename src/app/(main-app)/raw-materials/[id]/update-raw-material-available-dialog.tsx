'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type UpdateRawMaterialAvailableDialogProps = {
  rawMaterialId: number;
  currentAvailableBags: number;
  maxPurchasedBags: number;
};

export function UpdateRawMaterialAvailableDialog({
  rawMaterialId,
  currentAvailableBags,
  maxPurchasedBags,
}: UpdateRawMaterialAvailableDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableBags, setAvailableBags] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = availableBags.trim() === '' ? NaN : parseFloat(availableBags);
    if (Number.isNaN(value) || value < 0) {
      toast.error('Please enter a valid non-negative number of bags');
      return;
    }
    if (value - maxPurchasedBags > 1e-6) {
      toast.error(`Available bags cannot exceed purchased (${maxPurchasedBags})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/raw-materials/${rawMaterialId}/update-available`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableBags: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? 'Failed to update stock');
        return;
      }
      toast.success('Available stock updated.');
      setOpen(false);
      setAvailableBags('');
      router.refresh();
    } catch {
      toast.error('Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!submitting) {
      setOpen(next);
      if (!next) setAvailableBags('');
    }
  };

  const numValue = parseFloat(availableBags);
  const isValid =
    availableBags.trim() !== '' &&
    !Number.isNaN(numValue) &&
    numValue >= 0 &&
    numValue <= maxPurchasedBags + 1e-6;

  return (
    <>
      <Button onClick={() => setOpen(true)}>Adjust available bags</Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust available bags</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Closing available bag count</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  max={maxPurchasedBags}
                  step="any"
                  placeholder={`Current: ${currentAvailableBags} (max ${maxPurchasedBags})`}
                  value={availableBags}
                  onChange={(e) => setAvailableBags(e.target.value)}
                  disabled={submitting}
                />
              </Field>
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
              <Button type="submit" disabled={submitting || !isValid}>
                {submitting ? 'Updating…' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
