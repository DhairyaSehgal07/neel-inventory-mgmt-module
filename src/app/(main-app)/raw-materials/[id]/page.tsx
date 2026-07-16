import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ArrowRight, GitBranch, Scale } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { deriveRawMaterialDisplayStatus } from '@/lib/rawMaterialDisplay';
import { getRawMaterialStatusBadgeVariant } from '../utils';
import { UpdateRawMaterialAvailableDialog } from './update-raw-material-available-dialog';
import { ConsumeRawMaterialWeightDialog } from './consume-raw-material-weight-dialog';
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
    include: {
      history: {
        include: {
          performedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
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
          <div className="flex flex-wrap gap-2">
            <UpdateRawMaterialAvailableDialog
              rawMaterialId={row.id}
              currentAvailableBags={row.availableBags}
              maxPurchasedBags={row.purchasedBags}
            />
            <ConsumeRawMaterialWeightDialog
              rawMaterialId={row.id}
              currentAvailableWeightKg={row.availableWeightKg}
              weightPerUnit={row.weightPerUnit}
            />
          </div>
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

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Stock updates and status changes</CardDescription>
        </CardHeader>
        <CardContent>
          {row.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <GitBranch className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No history yet</p>
              <p className="text-xs text-muted-foreground/80 mt-0.5">
                Stock adjustments will appear here
              </p>
            </div>
          ) : (
            <div className="relative">
              <div
                className="absolute left-[19px] top-2 bottom-2 w-px bg-linear-to-b from-primary/30 via-border to-transparent"
                aria-hidden
              />
              <ul className="space-y-0">
                {row.history.map((entry) => {
                  const isBalance = entry.actionType === 'BALANCE_UPDATE';
                  const isStatus = entry.actionType === 'STATUS_CHANGE';
                  return (
                    <li key={entry.id} className="relative flex gap-4 pb-8 last:pb-0">
                      <div
                        className={cn(
                          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-card',
                          isBalance
                            ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                            : 'border-violet-500/50 text-violet-600 dark:text-violet-400'
                        )}
                      >
                        {isBalance ? (
                          <Scale className="h-4 w-4" />
                        ) : (
                          <GitBranch className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-sm font-medium">
                            {isBalance ? 'Stock update' : 'Status change'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                          </span>
                          <span
                            className="text-xs text-muted-foreground"
                            title={format(new Date(entry.createdAt), 'PPp')}
                          >
                            · {format(new Date(entry.createdAt), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        {entry.performedBy && (
                          <div className="mt-2 flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px] bg-muted">
                                {entry.performedBy.name
                                  .split(/\s+/)
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {entry.performedBy.name}
                            </span>
                          </div>
                        )}
                        {isBalance && (
                          <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-sm space-y-1">
                            <p>
                              <span className="text-muted-foreground">Bags: </span>
                              {entry.availableBagsBefore ?? '—'} → {entry.availableBagsAfter ?? '—'}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Weight: </span>
                              {entry.availableWeightKgBefore ?? '—'} →{' '}
                              {entry.availableWeightKgAfter ?? '—'} kg
                            </p>
                          </div>
                        )}
                        {(isBalance || isStatus) &&
                          (entry.statusBefore != null || entry.statusAfter != null) &&
                          entry.statusBefore !== entry.statusAfter && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                              <Badge variant="outline" className="text-xs font-normal">
                                {entry.statusBefore ?? '—'}
                              </Badge>
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <Badge variant="secondary" className="text-xs font-normal">
                                {entry.statusAfter ?? '—'}
                              </Badge>
                            </div>
                          )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
