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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const ASSIGN_OPTIONS = [
  'Calendaring 1',
  'Calendaring 2',
  'Calendaring 3',
  'Calendaring 4',
  'Rejection',
  'Trading',
] as const;

type AssignCompoundDialogProps = {
  compoundId: number;
  assignTo?: string | null;
};

export function AssignCompoundDialog({
  compoundId,
  assignTo,
}: AssignCompoundDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<string>(
    assignTo && ASSIGN_OPTIONS.includes(assignTo as (typeof ASSIGN_OPTIONS)[number])
      ? assignTo
      : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      toast.error('Please select an option');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/compounds/${compoundId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignTo: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? 'Failed to assign compound');
        return;
      }
      toast.success('Compound assigned successfully.');
      setOpen(false);
      setSelected('');
      router.refresh();
    } catch {
      toast.error('Failed to assign compound');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!submitting) {
      setOpen(next);
      if (!next) {
        setSelected(
          assignTo && ASSIGN_OPTIONS.includes(assignTo as (typeof ASSIGN_OPTIONS)[number])
            ? assignTo
            : ''
        );
      }
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Assign compound</Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign compound</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Assign to</FieldLabel>
                <Select
                  value={selected || undefined}
                  onValueChange={setSelected}
                  disabled={submitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select calendaring…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGN_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button type="submit" disabled={submitting || !selected}>
                {submitting ? 'Assigning…' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
