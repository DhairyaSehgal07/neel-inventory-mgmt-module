'use client';

import { useEffect, useState } from 'react';

/**
 * Renders children only after mount to avoid SSR/client hydration mismatches.
 * Use for components that rely on Radix UI or other libs that generate
 * different IDs on server vs client (e.g. aria-controls, id).
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
