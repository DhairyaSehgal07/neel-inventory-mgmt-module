'use client';

import { useMemo, useState } from 'react';
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
import { roundKg } from '@/lib/rawMaterialBalance';

type ConsumeRawMaterialWeightDialogProps = {
  rawMaterialId: number;
  currentAvailableWeightKg: number;
  weightPerUnit: number;
};

export function ConsumeRawMaterialWeightDialog({
  rawMaterialId,
  currentAvailableWeightKg,
  weightPerUnit,
}: ConsumeRawMaterialWeightDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consumeKg, setConsumeKg] = useState<string>('');

  const preview = useMemo(() => {
    const value = consumeKg.trim() === '' ? NaN : parseFloat(consumeKg);
    if (Number.isNaN(value) || value <= 0) return null;
    if (Math.abs(value - roundKg(value)) > 1e-9) return null;
    if (value - currentAvailableWeightKg > 1e-6) return null;
    if (weightPerUnit <= 0) return null;

    const remainingKg = roundKg(Math.max(0, currentAvailableWeightKg - roundKg(value)));
    const remainingBags =
      remainingKg <= 1e-6 ? 0 : remainingKg / weightPerUnit;
    return { remainingKg, remainingBags };
  }, [consumeKg, currentAvailableWeightKg, weightPerUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = consumeKg.trim() === '' ? NaN : parseFloat(consumeKg);
    if (Number.isNaN(value) || value <= 0) {
      toast.error('Please enter a valid consume quantity greater than zero');
      return;
    }
    if (Math.abs(value - roundKg(value)) > 1e-9) {
      toast.error('Consume quantity may have at most 2 decimal places');
      return;
    }
    if (value - currentAvailableWeightKg > 1e-6) {
      toast.error(
        `Cannot consume more than available (${roundKg(currentAvailableWeightKg)} kg)`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/raw-materials/${rawMaterialId}/consume-weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumeKg: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? 'Failed to update stock');
        return;
      }
      toast.success(data.message ?? 'Available quantity updated.');
      setOpen(false);
      setConsumeKg('');
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
      if (!next) setConsumeKg('');
    }
  };

  const isValid = preview != null;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Adjust in Kgs
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust in Kgs</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Kilograms consumed</FieldLabel>
                <Input
                  type="number"
                  min={0.01}
                  max={currentAvailableWeightKg}
                  step="0.01"
                  placeholder={`Max ${roundKg(currentAvailableWeightKg)} kg`}
                  value={consumeKg}
                  onChange={(e) => setConsumeKg(e.target.value)}
                  disabled={submitting}
                />
              </Field>
            </FieldGroup>
            {preview && (
              <p className="text-sm text-muted-foreground">
                After: {preview.remainingKg} kg · {Number(preview.remainingBags.toFixed(4))} bags
              </p>
            )}
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
