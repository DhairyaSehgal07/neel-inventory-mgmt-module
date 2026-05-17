'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import { Eye, Pencil, Printer, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getSingleRawMaterialPdfBlob,
  type SingleRawMaterialPdfParams,
} from '@/components/pdf/Single-Raw-Material-Pdf';
import { getRawMaterialStatusBadgeVariant } from './utils';

export type RawMaterialRow = {
  id: number;
  materialCode: string;
  date: string;
  createdBy: string;
  rawMaterial: string;
  grade: string | null;
  vendor: string | null;
  units: string;
  weightPerUnit: number;
  purchasedBags: number;
  availableBags: number;
  purchasedWeightKg: number;
  availableWeightKg: number;
  location: string | null;
  status: string | null;
};

type RawMaterialRowActionsMeta = {
  onEdit?: (row: RawMaterialRow) => void;
  onDelete?: (row: RawMaterialRow) => void;
  isDeletingId?: number | null;
};

function RawMaterialRowActions({
  row,
  meta,
}: {
  row: RawMaterialRow;
  meta: RawMaterialRowActionsMeta;
}) {
  const [isPrinting, setIsPrinting] = React.useState(false);
  const isDeleting = meta.isDeletingId === row.id;

  const handlePrintQr = React.useCallback(async () => {
    setIsPrinting(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? window.location.origin).replace(
        /\/$/,
        ''
      );
      const productUrl = `${baseUrl}/raw-materials/${row.id}`;
      const qrDataUrl = await QRCode.toDataURL(productUrl, {
        type: 'image/png',
        margin: 2,
        width: 256,
      });
      const params: SingleRawMaterialPdfParams = {
        qrDataUrl,
        rawMaterial: row.rawMaterial,
      };
      const blob = await getSingleRawMaterialPdfBlob(params);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setIsPrinting(false);
    }
  }, [row]);

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
            <Link href={`/raw-materials/${row.id}`} aria-label="View raw material">
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View raw material</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            onClick={handlePrintQr}
            disabled={isDeleting || isPrinting}
            aria-label="Print label"
          >
            {isPrinting ? <Spinner className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Print label</p>
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
          <p>Edit raw material</p>
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
          <p>{isDeleting ? 'Deleting…' : 'Delete'}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export const columns: ColumnDef<RawMaterialRow>[] = [
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
    accessorKey: 'materialCode',
    header: 'Code',
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.materialCode}</span>
    ),
  },
  {
    accessorKey: 'rawMaterial',
    header: 'Material',
    cell: ({ row }) => (
      <span className="truncate max-w-[160px] block">{row.original.rawMaterial}</span>
    ),
  },
  {
    id: 'bags',
    header: 'Bags (avail / purch.)',
    cell: ({ row }) => {
      const o = row.original;
      return (
        <span className="text-sm whitespace-nowrap tabular-nums">
          {o.availableBags.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          <span className="text-muted-foreground"> / </span>
          {o.purchasedBags.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
      );
    },
  },
  {
    id: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const d = row.original.date;
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
          {o.availableWeightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          <span className="text-muted-foreground"> / </span>
          {o.purchasedWeightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
      );
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => (
      <span className="text-muted-foreground truncate max-w-[120px] block">
        {row.original.location || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status ?? '—';
      const variant = getRawMaterialStatusBadgeVariant(row.original.status);
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right w-full">Actions</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as RawMaterialRowActionsMeta;
      return <RawMaterialRowActions row={row.original} meta={meta} />;
    },
  },
];
