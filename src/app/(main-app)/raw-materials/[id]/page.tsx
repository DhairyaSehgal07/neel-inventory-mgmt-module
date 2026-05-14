import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deriveRawMaterialDisplayStatus } from '@/lib/rawMaterialDisplay';
import { getRawMaterialStatusBadgeVariant } from '../utils';
import { UpdateRawMaterialAvailableDialog } from './update-raw-material-available-dialog';
import { RawMaterialStatus } from '@/generated/prisma/enums';

type Props = { params: Promise<{ id: string }> };

export default async function RawMaterialDetailPage({ params }: Props) {
  const { id } = await params;
  const rawMaterialId = parseInt(id, 10);
  if (Number.isNaN(rawMaterialId)) {
    notFound();
  }

  await dbConnect();
  const row = await prisma.rawMaterial.findUnique({
    where: { id: rawMaterialId },
  });

  if (!row) {
    notFound();
  }

  const displayStatus = deriveRawMaterialDisplayStatus(row);
  const canAdjustStock =
    row.status !== RawMaterialStatus.REJECTED && row.status !== RawMaterialStatus.TRADED;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/raw-materials" aria-label="Back to raw materials">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Raw material #{row.id}</h1>
            <p className="text-muted-foreground text-sm">Scanned from QR · Inventory details</p>
          </div>
        </div>
        {canAdjustStock && (
          <UpdateRawMaterialAvailableDialog
            rawMaterialId={row.id}
            currentAvailableBags={row.availableBags}
            maxPurchasedBags={row.purchasedBags}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material information</CardTitle>
          <CardDescription>Raw material inventory entry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Date</dt>
              <dd className="mt-1 text-sm">{format(new Date(row.date), 'PPP')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Material code</dt>
              <dd className="mt-1 text-sm font-mono break-all">{row.materialCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created by</dt>
              <dd className="mt-1 text-sm">{row.createdBy}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Material</dt>
              <dd className="mt-1 text-sm">{row.rawMaterial}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Grade</dt>
              <dd className="mt-1 text-sm">{row.grade ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Vendor</dt>
              <dd className="mt-1 text-sm">{row.vendor ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Units</dt>
              <dd className="mt-1 text-sm">{row.units}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Weight per unit (kg)</dt>
              <dd className="mt-1 text-sm">{row.weightPerUnit}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Purchased bags</dt>
              <dd className="mt-1 text-sm">{row.purchasedBags}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Available bags</dt>
              <dd className="mt-1 text-sm font-medium">{row.availableBags}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Purchased weight (kg)</dt>
              <dd className="mt-1 text-sm">{row.purchasedWeightKg}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Available weight (kg)</dt>
              <dd className="mt-1 text-sm font-medium">{row.availableWeightKg}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Location</dt>
              <dd className="mt-1 text-sm">{row.location ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status (stored)</dt>
              <dd className="mt-1">
                <Badge variant="outline" className="font-normal">
                  {row.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Display status</dt>
              <dd className="mt-1">
                <Badge variant={getRawMaterialStatusBadgeVariant(displayStatus)}>
                  {displayStatus}
                </Badge>
              </dd>
            </div>
          </dl>
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">QR code</p>
            <p className="text-xs text-muted-foreground mb-2">Scan to open this page</p>
            <Image
              src={`/api/raw-materials/${row.id}/qrcode`}
              alt="Raw material QR code"
              width={256}
              height={256}
              unoptimized
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
