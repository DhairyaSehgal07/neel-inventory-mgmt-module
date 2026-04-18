'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  CompoundEditForm,
  type CompoundEditInitial,
} from '@/components/forms/compound/edit';

export default function CompoundEditPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [compound, setCompound] = React.useState<CompoundEditInitial | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/compounds/${id}`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && json?.data) {
          const d = json.data;
          setCompound({
            id: d.id,
            compoundCode: d.compoundCode,
            dateOfProduction:
              typeof d.dateOfProduction === 'string'
                ? d.dateOfProduction
                : new Date(d.dateOfProduction).toISOString(),
            createdBy: d.createdBy,
            compoundName: d.compoundName,
            batch: d.batch,
            batchCount: d.batchCount,
            weightPerBatchKg: d.weightPerBatchKg,
            totalWeightProducedKg: d.totalWeightProducedKg,
            weightConsumedKg: d.weightConsumedKg,
            weightRemainingKg: d.weightRemainingKg,
            location: d.location,
            status: d.status ?? null,
          });
        } else {
          toast.error(typeof json?.message === 'string' ? json.message : 'Compound not found');
        }
      } catch {
        if (!cancelled) toast.error('Failed to load compound');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return null;
  }

  if (loading || !compound) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/compounds" aria-label="Back to compounds">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="py-12 text-center text-muted-foreground">
          {loading ? 'Loading…' : 'Compound not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/compounds/${id}`} aria-label="Back to compound">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit compound #{compound.id}</h1>
          <p className="text-muted-foreground text-sm">Update compound batch details.</p>
        </div>
      </div>
      <CompoundEditForm compound={compound} compoundId={id} />
    </div>
  );
}
