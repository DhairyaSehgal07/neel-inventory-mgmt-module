import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ArrowRight, FlaskConical, GitBranch, Scale, UserPlus } from 'lucide-react';
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
import { getCompoundStatusBadgeVariant } from '../utils';
import { AssignCompoundDialog } from './assign-compound-dialog';

type Props = { params: Promise<{ id: string }> };

export default async function CompoundDetailPage({ params }: Props) {
  const { id } = await params;
  const compoundId = parseInt(id, 10);
  if (Number.isNaN(compoundId)) {
    notFound();
  }

  await dbConnect();
  const compound = await prisma.compound.findUnique({
    where: { id: compoundId },
    include: {
      history: {
        include: {
          performedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!compound) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/compounds" aria-label="Back to compounds">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Compound #{compound.id}</h1>
            <p className="text-muted-foreground text-sm">
              Scanned from QR code · {compound.compoundName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {compound.status !== 'REJECTED' &&
            compound.status !== 'TRADED' &&
            (compound.assignTo != null && compound.assignTo !== '' ? null : (
              <AssignCompoundDialog
                compoundId={compound.id}
                assignTo={compound.assignTo}
              />
            ))}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/compounds/${compound.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Batch details
          </CardTitle>
          <CardDescription>Compound inventory entry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Compound code</dt>
              <dd className="mt-1 text-sm font-mono break-all">{compound.compoundCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Date of production</dt>
              <dd className="mt-1 text-sm">{format(new Date(compound.dateOfProduction), 'PPP')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created by</dt>
              <dd className="mt-1 text-sm">{compound.createdBy}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Batch count</dt>
              <dd className="mt-1 text-sm">{compound.batchCount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Weight per batch</dt>
              <dd className="mt-1 text-sm">{compound.weightPerBatchKg} kg</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Total produced</dt>
              <dd className="mt-1 text-sm">{compound.totalWeightProducedKg} kg</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Consumed</dt>
              <dd className="mt-1 text-sm">{compound.weightConsumedKg} kg</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Remaining</dt>
              <dd className="mt-1 text-sm font-medium">{compound.weightRemainingKg} kg</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Location</dt>
              <dd className="mt-1 text-sm">{compound.location}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <Badge variant={getCompoundStatusBadgeVariant(compound.status)}>
                  {compound.status ?? '—'}
                </Badge>
              </dd>
            </div>
            {compound.assignTo != null && compound.assignTo !== '' && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Assigned to</dt>
                <dd className="mt-1 text-sm">{compound.assignTo}</dd>
              </div>
            )}
          </dl>
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">QR code</p>
            <p className="text-xs text-muted-foreground mb-2">Scan to open this compound page</p>
            <Image
              src={`/api/compounds/${compound.id}/qrcode`}
              alt="Compound QR code"
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
          <CardDescription>Assignments, consumption updates, and status changes</CardDescription>
        </CardHeader>
        <CardContent>
          {compound.history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <GitBranch className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No history yet</p>
              <p className="text-xs text-muted-foreground/80 mt-0.5">
                Actions from production flows will appear here
              </p>
            </div>
          ) : (
            <div className="relative">
              <div
                className="absolute left-[19px] top-2 bottom-2 w-px bg-linear-to-b from-primary/30 via-border to-transparent"
                aria-hidden
              />
              <ul className="space-y-0">
                {compound.history.map((entry) => {
                  const isAssign = entry.actionType === 'ASSIGN';
                  const isBalance = entry.actionType === 'BALANCE_UPDATE';
                  const isStatus = entry.actionType === 'STATUS_CHANGE';
                  return (
                    <li key={entry.id} className="relative flex gap-4 pb-8 last:pb-0">
                      <div
                        className={cn(
                          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-card',
                          isAssign
                            ? 'border-primary/50 text-primary'
                            : isBalance
                              ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                              : 'border-violet-500/50 text-violet-600 dark:text-violet-400'
                        )}
                      >
                        {isAssign ? (
                          <UserPlus className="h-4 w-4" />
                        ) : isBalance ? (
                          <Scale className="h-4 w-4" />
                        ) : (
                          <GitBranch className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-sm font-medium">
                            {isAssign
                              ? 'Assignment'
                              : isBalance
                                ? 'Weight update'
                                : 'Status change'}
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
                            <span className="text-xs text-muted-foreground">{entry.performedBy.name}</span>
                          </div>
                        )}
                        {isAssign && (
                          <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-sm space-y-1">
                            {(entry.assignToAfter != null && entry.assignToAfter !== '') ||
                            (entry.assignToBefore != null && entry.assignToBefore !== '') ? (
                              <p>
                                <span className="text-muted-foreground">Assign to: </span>
                                {entry.assignToBefore ?? '—'} → {entry.assignToAfter ?? '—'}
                              </p>
                            ) : null}
                            {entry.assignedQtyKg != null && (
                              <p>
                                <span className="text-muted-foreground">Assigned qty: </span>
                                {entry.assignedQtyKg} kg
                              </p>
                            )}
                            {entry.assignedMachinery != null && (
                              <p>
                                <span className="text-muted-foreground">Machinery: </span>
                                {entry.assignedMachinery.replace(/_/g, ' ')}
                              </p>
                            )}
                            {entry.beltNumber != null && entry.beltNumber !== '' && (
                              <p>
                                <span className="text-muted-foreground">Belt: </span>
                                {entry.beltNumber}
                              </p>
                            )}
                          </div>
                        )}
                        {isBalance && (
                          <div className="mt-3 flex flex-wrap gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                            <span className="text-muted-foreground">
                              Remaining: {entry.weightRemainingBeforeKg ?? '—'} →{' '}
                              {entry.weightRemainingAfterKg ?? '—'} kg
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span>
                              Consumed: {entry.weightConsumedBeforeKg ?? '—'} →{' '}
                              {entry.weightConsumedAfterKg ?? '—'} kg
                            </span>
                          </div>
                        )}
                        {(isAssign || isStatus) &&
                          (entry.statusBefore != null || entry.statusAfter != null) && (
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
