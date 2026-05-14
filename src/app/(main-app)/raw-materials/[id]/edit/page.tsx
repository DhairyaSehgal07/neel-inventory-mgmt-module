'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  RawMaterialEditForm,
  type RawMaterialEditInitial,
} from '@/components/forms/raw-materials/edit';

export default function RawMaterialEditPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [row, setRow] = React.useState<RawMaterialEditInitial | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/raw-materials/${id}`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && json?.data) {
          const d = json.data;
          setRow({
            id: d.id,
            materialCode: d.materialCode,
            date:
              typeof d.date === 'string' ? d.date : new Date(d.date).toISOString(),
            createdBy: d.createdBy,
            rawMaterial: d.rawMaterial,
            grade: d.grade ?? null,
            vendor: d.vendor ?? null,
            units: d.units,
            weightPerUnit: d.weightPerUnit,
            purchasedBags: d.purchasedBags,
            availableBags: d.availableBags,
            purchasedWeightKg: d.purchasedWeightKg,
            availableWeightKg: d.availableWeightKg,
            location: d.location ?? null,
            status: d.status ?? null,
          });
        } else {
          toast.error(typeof json?.message === 'string' ? json.message : 'Not found');
        }
      } catch {
        if (!cancelled) toast.error('Failed to load raw material');
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

  if (loading || !row) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/raw-materials" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="py-12 text-center text-muted-foreground">
          {loading ? 'Loading…' : 'Raw material not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/raw-materials/${id}`} aria-label="Back to detail">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit raw material #{row.id}</h1>
          <p className="text-muted-foreground text-sm">Update inventory and metadata.</p>
        </div>
      </div>
      <RawMaterialEditForm row={row} rawMaterialId={id} />
    </div>
  );
}
