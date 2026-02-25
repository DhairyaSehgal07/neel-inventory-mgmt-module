import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, UserPlus, Ruler, ArrowRight } from 'lucide-react';
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
import { getStatusBadgeVariant } from '../utils';
import { AssignFabricDialog } from './assign-fabric-dialog';
import { UpdateBalanceDialog } from './update-balance-dialog';

type Props = { params: Promise<{ id: string }> };

export default async function FabricDetailPage({ params }: Props) {
  const { id } = await params;
  const fabricId = parseInt(id, 10);
  if (Number.isNaN(fabricId)) {
    notFound();
  }

  await dbConnect();
  const fabric = await prisma.fabric.findUnique({
    where: { id: fabricId },
    include: {
      fabricType: true,
      fabricStrength: true,
      fabricWidth: true,
      history: {
        include: {
          performedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!fabric) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fabrics" aria-label="Back to fabrics">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fabric #{fabric.id}</h1>
            <p className="text-muted-foreground text-sm">
              Scanned from QR code · Product details
            </p>
          </div>
        </div>
        {fabric.status !== 'REJECTED' && fabric.status !== 'TRADED' &&
          (fabric.assignTo != null && fabric.assignTo !== '' ? (
            <UpdateBalanceDialog
              fabricId={fabric.id}
              currentBalance={fabric.fabricLengthCurrent}
            />
          ) : (
            <AssignFabricDialog
              fabricId={fabric.id}
              assignTo={(fabric as { assignTo?: string | null }).assignTo}
            />
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product information</CardTitle>
          <CardDescription>Fabric inventory entry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Date</dt>
              <dd className="mt-1 text-sm">{format(new Date(fabric.date), 'PPP')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-muted-foreground">Fabric code</dt>
              <dd className="mt-1 text-sm font-mono break-all">{fabric.fabricCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Fabric type</dt>
              <dd className="mt-1 text-sm">{fabric.fabricType.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Strength</dt>
              <dd className="mt-1 text-sm">{fabric.fabricStrength.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Width (nominal)</dt>
              <dd className="mt-1 text-sm">{fabric.fabricWidth.value} m</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Width </dt>
              <dd className="mt-1 text-sm"> {fabric.fabricWidthCurrent} cm</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Fabric length (current/initial)</dt>
              <dd className="mt-1 text-sm">{fabric.fabricLengthCurrent} m / {fabric.fabricLengthInitial} m</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Vendor</dt>
              <dd className="mt-1 text-sm">{fabric.nameOfVendor}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">GSM (observed)</dt>
              <dd className="mt-1 text-sm">{fabric.gsmObserved}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">GSM (calculated)</dt>
              <dd className="mt-1 text-sm">{fabric.gsmCalculated}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Net weight</dt>
              <dd className="mt-1 text-sm">{fabric.netWeight} kg</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <Badge variant={getStatusBadgeVariant((fabric as { status?: string | null }).status)}>
                  {(fabric as { status?: string | null }).status ?? "—"}
                </Badge>
              </dd>
            </div>
            {fabric.assignTo != null && fabric.assignTo !== '' && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Assigned to</dt>
                <dd className="mt-1 text-sm">{fabric.assignTo}</dd>
              </div>
            )}
          </dl>
          <div className="mt-6 pt-6 border-t">
            <dt className="text-sm font-medium text-muted-foreground mb-2">QR code</dt>
            <p className="text-xs text-muted-foreground mb-2">
              Scan to open this product page
            </p>
            <Image
              src={`/api/fabrics/${fabric.id}/qrcode`}
              alt="Product QR code"
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
          <CardDescription>Assignments and balance updates for this fabric</CardDescription>
        </CardHeader>
        <CardContent>
          {fabric.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Ruler className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No history yet</p>
              <p className="text-xs text-muted-foreground/80 mt-0.5">
                Assignments and balance updates will appear here
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div
                className="absolute left-[19px] top-2 bottom-2 w-px bg-linear-to-b from-primary/30 via-border to-transparent"
                aria-hidden
              />
              <ul className="space-y-0">
                {fabric.history.map((entry) => {
                  const isAssign = entry.actionType === 'ASSIGN';
                  const hasAssignChange =
                    (entry.assignToBefore != null && entry.assignToBefore !== '') ||
                    (entry.assignToAfter != null && entry.assignToAfter !== '');
                  const hasStatusChange =
                    entry.statusBefore != null || entry.statusAfter != null;
                  return (
                    <li key={entry.id} className="relative flex gap-4 pb-8 last:pb-0">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-card',
                          isAssign
                            ? 'border-primary/50 text-primary'
                            : 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {isAssign ? (
                          <UserPlus className="h-4 w-4" />
                        ) : (
                          <Ruler className="h-4 w-4" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-sm font-medium">
                            {isAssign ? 'Assignment' : 'Balance update'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.createdAt), {
                              addSuffix: true,
                            })}
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
                        {isAssign && (hasAssignChange || hasStatusChange) && (
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                            {hasAssignChange && (
                              <span className="flex items-center gap-1.5">
                                <span className="text-muted-foreground">
                                  {entry.assignToBefore ?? '—'}
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>{entry.assignToAfter ?? '—'}</span>
                              </span>
                            )}
                            {hasStatusChange && (
                              <span className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-xs font-normal">
                                  {entry.statusBefore ?? '—'}
                                </Badge>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {entry.statusAfter ?? '—'}
                                </Badge>
                              </span>
                            )}
                          </div>
                        )}
                        {!isAssign && (
                          <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                            <span className="text-muted-foreground">
                              {entry.lengthBefore ?? '—'} m
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium">
                              {entry.lengthAfter ?? '—'} m
                            </span>
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
