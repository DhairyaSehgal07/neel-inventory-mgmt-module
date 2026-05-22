import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { gradeDisplay } from '@/lib/rawMaterialAnalyticsQuery';

/**
 * GET /api/raw-materials/analytics/filter-options
 * Requires RAW_MATERIAL_BATCH_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.RAW_MATERIAL_BATCH_VIEW, async () => {
    try {
      await dbConnect();

      const [matDistinct, gradeDistinct, locDistinct] = await Promise.all([
        prisma.rawMaterial.findMany({
          select: { rawMaterial: true },
          distinct: ['rawMaterial'],
          orderBy: { rawMaterial: 'asc' },
        }),
        prisma.rawMaterial.findMany({
          select: { grade: true },
          distinct: ['grade'],
        }),
        prisma.rawMaterial.findMany({
          select: { location: true },
          distinct: ['location'],
        }),
      ]);

      const materials = matDistinct.map((r) => r.rawMaterial.trim()).filter(Boolean);
      const grades = [
        ...new Set(
          gradeDistinct.map((r) => gradeDisplay(r.grade))
        ),
      ].sort((a, b) => a.localeCompare(b));
      const locations = [
        ...new Set(
          locDistinct
            .map((r) => r.location?.trim())
            .filter((s): s is string => !!s && s.length > 0)
        ),
      ].sort((a, b) => a.localeCompare(b));

      return NextResponse.json({
        success: true,
        data: { materials, grades, locations },
      });
    } catch (error) {
      console.error('GET /api/raw-materials/analytics/filter-options error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to load filter options' },
        { status: 500 }
      );
    }
  });
}
