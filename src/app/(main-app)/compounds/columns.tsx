'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getCompoundStatusBadgeVariant } from './utils';

export type CompoundRow = {
  id: number;
  compoundCode: string;
  dateOfProduction: string;
  createdBy: string;
  compoundName: string;
  batch: string;
  batchCount: number;
  weightPerBatchKg: number;
  totalWeightProducedKg: number;
  weightConsumedKg: number;
  weightRemainingKg: number;
  location: string;
  status: string | null;
  _count?: { history: number };
};

type CompoundRowActionsMeta = {
  onEdit?: (row: CompoundRow) => void;
  onDelete?: (row: CompoundRow) => void;
  isDeletingId?: number | null;
};

function CompoundRowActions({
  row,
  meta,
}: {
  row: CompoundRow;
  meta: CompoundRowActionsMeta;
}) {
  const isDeleting = meta.isDeletingId === row.id;

  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            asChild
          >
            <Link href={`/compounds/${row.id}`} aria-label="View compound">
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View compound</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            onClick={() => meta.onEdit?.(row)}
            disabled={isDeleting}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit compound</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => meta.onDelete?.(row)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="sr-only">Delete</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isDeleting ? 'Deleting…' : 'Delete compound'}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export const columns: ColumnDef<CompoundRow>[] = [
  {
    id: 'serial',
    header: '#',
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      const n = pageIndex * pageSize + row.index + 1;
      return <span className="text-muted-foreground tabular-nums">{n}</span>;
    },
  },
  {
    accessorKey: 'compoundCode',
    header: 'Code',
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.compoundCode}</span>
    ),
  },
  {
    accessorKey: 'compoundName',
    header: 'Name',
    cell: ({ row }) => (
      <span className="truncate max-w-[180px] block">{row.original.compoundName}</span>
    ),
  },
  {
    accessorKey: 'batch',
    header: 'Batch',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.batch}</span>
    ),
  },
  {
    id: 'dateOfProduction',
    header: 'Produced',
    cell: ({ row }) => {
      const d = row.original.dateOfProduction;
      try {
        return (
          <span className="text-foreground whitespace-nowrap">
            {format(new Date(d), 'MMM d, yyyy')}
          </span>
        );
      } catch {
        return <span>—</span>;
      }
    },
  },
  {
    id: 'weights',
    header: 'Weight (kg)',
    cell: ({ row }) => {
      const o = row.original;
      return (
        <span className="text-sm whitespace-nowrap">
          {o.weightRemainingKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
          <span className="text-muted-foreground">/ </span>
          {o.totalWeightProducedKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
      );
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => (
      <span className="text-muted-foreground truncate max-w-[140px] block">
        {row.original.location || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status ?? '—';
      const variant = getCompoundStatusBadgeVariant(row.original.status);
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right w-full">Actions</div>,
    cell: ({ row, table }) => {
      const compound = row.original;
      const meta = table.options.meta as CompoundRowActionsMeta;
      return <CompoundRowActions row={compound} meta={meta} />;
    },
  },
];
