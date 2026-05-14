import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

type LocationOption = { value: string; label: string };

/**
 * GET /api/fabrics/analytics/filter-options
 *
 * Distinct fabric locations for analytics filters (area|floor value, display label).
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      await dbConnect();

      const rows = await prisma.location.findMany({
        select: { area: true, floor: true },
        distinct: ['area', 'floor'],
        orderBy: [{ area: 'asc' }, { floor: 'asc' }],
      });

      const seen = new Set<string>();
      const locations: LocationOption[] = [];
      for (const loc of rows) {
        const key = `${loc.area}|${loc.floor ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const label =
          loc.floor != null && loc.floor !== ''
            ? `${loc.area}, ${loc.floor}`
            : loc.area;
        locations.push({ value: key, label });
      }

      return NextResponse.json({
        success: true,
        data: { locations },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('GET /api/fabrics/analytics/filter-options error:', err);
      const isDev = process.env.NODE_ENV === 'development';
      const message =
        isDev && err.message
          ? `Failed to load filter options: ${err.message}`
          : 'Failed to load filter options';
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  });
}
