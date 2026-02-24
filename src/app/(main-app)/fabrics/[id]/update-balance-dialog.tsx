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

type UpdateBalanceDialogProps = {
  fabricId: number;
  currentBalance: number;
};

export function UpdateBalanceDialog({
  fabricId,
  currentBalance,
}: UpdateBalanceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closingBalance, setClosingBalance] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = closingBalance.trim() === '' ? NaN : parseFloat(closingBalance);
    if (Number.isNaN(value) || value < 0) {
      toast.error('Please enter a valid non-negative closing balance');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/fabrics/${fabricId}/update-fabric-quantity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? 'Failed to update balance');
        return;
      }
      toast.success('Balance updated successfully.');
      setOpen(false);
      setClosingBalance('');
      router.refresh();
    } catch {
      toast.error('Failed to update balance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!submitting) {
      setOpen(next);
      if (!next) setClosingBalance('');
    }
  };

  const numValue = parseFloat(closingBalance);
  const isValid =
    closingBalance.trim() !== '' && !Number.isNaN(numValue) && numValue >= 0;

  return (
    <>
      <Button onClick={() => setOpen(true)}>Update Balance</Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Balance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Enter closing balance (m)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder={`Current: ${currentBalance} m`}
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
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
