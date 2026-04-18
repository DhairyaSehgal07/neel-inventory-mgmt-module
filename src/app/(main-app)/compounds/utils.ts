type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'info'
  | 'warning'
  | 'purple'
  | 'muted'
  | 'ghost'
  | 'link';

/** Maps CompoundStatus to badge variant for consistent status colors. */
export function getCompoundStatusBadgeVariant(
  status: string | null | undefined
): BadgeVariant {
  if (status == null || status === '' || status === '—') return 'outline';
  const s = status.toUpperCase().trim();
  switch (s) {
    case 'PACKED':
      return 'success';
    case 'IN_USE':
      return 'info';
    case 'ASSIGNED':
      return 'warning';
    case 'CONSUMED':
      return 'muted';
    case 'TRADED':
      return 'purple';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'secondary';
  }
}
