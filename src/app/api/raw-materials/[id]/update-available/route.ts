import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import type { RawMaterialStatus } from '@/generated/prisma/enums';

const updateAvailableSchema = z.object({
  availableBags: z.coerce
    .number({ message: 'Available bags must be a number' })
    .min(0, 'Available bags must be non-negative'),
});

type RouteParams = { params: Promise<{ id: string }> };

function nextStatusFromBags(
  availableBags: number,
  purchasedBags: number
): RawMaterialStatus {
  const tol = 1e-6;
  if (availableBags <= tol) return 'CONSUMED';
  if (availableBags < purchasedBags - tol) return 'OPEN';
  return 'PACKED';
}

/**
 * POST /api/raw-materials/[id]/update-available
 * Sets available bag count and recomputes availableWeightKg; updates status (OPEN / PACKED / CONSUMED).
 * Requires RAW_MATERIAL_BATCH_UPDATE.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withRBAC(request, Permission.RAW_MATERIAL_BATCH_UPDATE, async () => {
    try {
      const { id } = await params;
      const rawMaterialId = parseInt(id, 10);
      if (Number.isNaN(rawMaterialId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid raw material id' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const parsed = updateAvailableSchema.safeParse(body);
      if (!parsed.success) {
        const message =
          parsed.error.flatten().fieldErrors.availableBags?.join(', ') ?? 'Validation failed';
        return NextResponse.json({ success: false, message }, { status: 400 });
      }

      await dbConnect();

      const existing = await prisma.rawMaterial.findUnique({
        where: { id: rawMaterialId },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Raw material not found' },
          { status: 404 }
        );
      }

      const availableBags = parsed.data.availableBags;
      if (availableBags - existing.purchasedBags > 1e-6) {
        return NextResponse.json(
          {
            success: false,
            message: `Available bags cannot exceed purchased bags (${existing.purchasedBags})`,
          },
          { status: 400 }
        );
      }

      const status = nextStatusFromBags(availableBags, existing.purchasedBags);
      const availableWeightKg = availableBags * existing.weightPerUnit;

      const updated = await prisma.rawMaterial.update({
        where: { id: rawMaterialId },
        data: {
          availableBags,
          availableWeightKg,
          status,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Available stock updated; status ${status}`,
      });
    } catch (error) {
      console.error('POST /api/raw-materials/[id]/update-available error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to update available stock';
      return NextResponse.json(
        { success: false, message: `Failed to update: ${message}` },
        { status: 500 }
      );
    }
  });
}
