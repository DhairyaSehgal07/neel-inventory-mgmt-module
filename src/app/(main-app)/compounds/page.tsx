'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CompoundsDataTable } from './data-table';
import { columns, type CompoundRow } from './columns';
import { filterCompoundsBySearch } from './search-utils';

const COMPOUND_STATUSES = [
  'IN_USE',
  'PACKED',
  'ASSIGNED',
  'CONSUMED',
  'TRADED',
  'REJECTED',
] as const;

type StatusTabId = 'all' | (typeof COMPOUND_STATUSES)[number];

function statusTabLabel(id: StatusTabId): string {
  if (id === 'all') return 'All';
  return id
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function getErrorMessage(
  res: Response,
  json: { message?: string; success?: boolean },
  fallback: string
): string {
  if (json?.message && typeof json.message === 'string') return json.message;
  if (res.status === 400) return 'Invalid request. Please check your input.';
  if (res.status === 401) return 'You are not authorized to perform this action.';
  if (res.status === 403) return 'You do not have permission to perform this action.';
  if (res.status === 404) return 'The requested item was not found.';
  if (res.status >= 500) return 'Something went wrong on the server. Please try again later.';
  return fallback;
}

function normalizeRow(raw: Record<string, unknown>): CompoundRow {
  const dateOfProduction =
    typeof raw.dateOfProduction === 'string'
      ? raw.dateOfProduction
      : new Date(raw.dateOfProduction as string).toISOString();
  return {
    ...raw,
    dateOfProduction,
  } as CompoundRow;
}

export default function CompoundsPage() {
  const router = useRouter();
  const [statusTab, setStatusTab] = React.useState<StatusTabId>('all');
  const [data, setData] = React.useState<CompoundRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CompoundRow | null>(null);
  const [isDeletingId, setIsDeletingId] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredData = React.useMemo(() => {
    let rows = data;
    if (statusTab !== 'all') {
      rows = rows.filter((r) => (r.status ?? '') === statusTab);
    }
    return [...rows].sort((a, b) => {
      const ta = Date.parse(a.dateOfProduction);
      const tb = Date.parse(b.dateOfProduction);
      if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta;
      return b.id - a.id;
    });
  }, [data, statusTab]);

  const searchFilteredData = React.useMemo(
    () => filterCompoundsBySearch(filteredData, searchQuery),
    [filteredData, searchQuery]
  );

  const totalRemainingKg = React.useMemo(
    () =>
      searchFilteredData.reduce((sum, c) => {
        const w = c.weightRemainingKg;
        return sum + (Number.isFinite(w) ? w : 0);
      }, 0),
    [searchFilteredData]
  );

  const fetchCompounds = React.useCallback(async () => {
    setFetchError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/compounds');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = getErrorMessage(res, json, 'Failed to load compounds');
        setFetchError(message);
        toast.error(message);
        return;
      }
      const list = json.data ?? [];
      setData(list.map((raw: Record<string, unknown>) => normalizeRow(raw)));
    } catch {
      const message = 'Unable to connect. Please check your network and try again.';
      setFetchError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCompounds();
  }, [fetchCompounds]);

  const handleEdit = (row: CompoundRow) => {
    router.push(`/compounds/${row.id}/edit`);
  };

  const handleConfirmDelete = async () => {
    const toDelete = deleteTarget;
    if (!toDelete) return;
    setDeleteTarget(null);
    setIsDeletingId(toDelete.id);
    try {
      const res = await fetch(`/api/compounds/${toDelete.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(getErrorMessage(res, json, 'Failed to delete compound'));
        return;
      }
      toast.success('Compound deleted');
      await fetchCompounds();
    } catch {
      toast.error('Failed to delete compound');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compounds</h1>
        <p className="text-muted-foreground text-sm">View and manage compound batches.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>All compounds</CardTitle>
            <CardDescription>
              Browse batches in a table. View details, edit, or delete rows.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchCompounds} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button asChild className="gap-2">
              <Link href="/compounds/new">
                <Plus className="h-4 w-4" />
                Add compound
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : fetchError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive">{fetchError}</p>
              <Button variant="outline" onClick={fetchCompounds} className="mt-3">
                Try again
              </Button>
            </div>
          ) : (
            <>
              <div className="border-b border-border mb-4">
                <nav className="flex flex-wrap gap-1" aria-label="Status filter">
                  {(['all', ...COMPOUND_STATUSES] as const).map((tabId) => (
                    <Button
                      key={tabId}
                      variant="ghost"
                      size="sm"
                      className={`rounded-b-none border-b-2 transition-colors ${
                        statusTab === tabId
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setStatusTab(tabId)}
                    >
                      {statusTabLabel(tabId)}
                    </Button>
                  ))}
                </nav>
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
                <div className="rounded-full border border-border bg-muted/40 px-6 py-1.5 text-sm">
                  <span className="text-muted-foreground">Total remaining: </span>
                  <span className="font-semibold text-foreground">
                    {totalRemainingKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                  </span>
                </div>
              </div>
              <CompoundsDataTable
                columns={columns}
                data={searchFilteredData}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onEdit={handleEdit}
                onDelete={(row) => setDeleteTarget(row)}
                isDeletingId={isDeletingId}
              />
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete compound</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this compound batch? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
