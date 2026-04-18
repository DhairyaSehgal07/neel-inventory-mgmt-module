import { redirect } from 'next/navigation';

/** @deprecated Use `/analytics/fabrics` or `/analytics/compounds`. */
export default function AnalyticsIndexPage() {
  redirect('/analytics/fabrics');
}
