import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { buildBalanceUpdateData } from '@/lib/rawMaterialBalance';
import { logRawMaterialBalanceUpdate } from '@/lib/rawMaterialHistoryWrite';

const updateAvailableSchema = z.object({
  availableBags: z.coerce
    .number({ message: 'Available bags must be a number' })
    .min(0, 'Available bags must be non-negative'),
});

type RouteParams = { params: Promise<{ id: string }> };

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

      const session = await auth();
      const userIdStr = session?.user?.id;
      if (!userIdStr) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: user not found in session' },
          { status: 401 }
        );
      }
      const performedById = parseInt(String(userIdStr), 10);
      if (Number.isNaN(performedById)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user id in session' },
          { status: 401 }
        );
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

      const balance = buildBalanceUpdateData(existing, availableBags);

      const updated = await prisma.$transaction(async (tx) => {
        const row = await tx.rawMaterial.update({
          where: { id: rawMaterialId },
          data: {
            availableBags: balance.availableBags,
            availableWeightKg: balance.availableWeightKg,
            status: balance.status,
            packedAt: balance.packedAt,
          },
        });

        await logRawMaterialBalanceUpdate(tx, {
          rawMaterialId,
          performedById,
          availableBagsBefore: existing.availableBags,
          availableBagsAfter: balance.availableBags,
          availableWeightKgBefore: existing.availableWeightKg,
          availableWeightKgAfter: balance.availableWeightKg,
          statusBefore: existing.status,
          statusAfter: balance.status,
        });

        return row;
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Available stock updated; status ${balance.status}`,
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
