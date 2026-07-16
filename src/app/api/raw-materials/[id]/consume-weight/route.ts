import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { consumeAvailableWeightKg, roundKg } from '@/lib/rawMaterialBalance';
import { logRawMaterialBalanceUpdate } from '@/lib/rawMaterialHistoryWrite';
import { RawMaterialStatus } from '@/generated/prisma/enums';

const consumeWeightSchema = z.object({
  consumeKg: z.coerce
    .number({ message: 'Consume quantity must be a number' })
    .positive('Consume quantity must be greater than zero')
    .refine((n) => Math.abs(n - roundKg(n)) < 1e-9, {
      message: 'Consume quantity may have at most 2 decimal places',
    }),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/raw-materials/[id]/consume-weight
 * Consumes kg from available stock and recomputes availableBags; updates status.
 * Requires RAW_MATERIAL_UPDATE.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withRBAC(request, Permission.RAW_MATERIAL_UPDATE, async () => {
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
      const parsed = consumeWeightSchema.safeParse(body);
      if (!parsed.success) {
        const message =
          parsed.error.flatten().fieldErrors.consumeKg?.join(', ') ?? 'Validation failed';
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

      if (
        existing.status === RawMaterialStatus.REJECTED ||
        existing.status === RawMaterialStatus.TRADED
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot adjust stock when status is ${existing.status}`,
          },
          { status: 400 }
        );
      }

      const result = consumeAvailableWeightKg(existing, parsed.data.consumeKg);
      if (!result.ok) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }
      const { balance } = result;

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
        message: `Consumed ${roundKg(parsed.data.consumeKg)} kg; status ${balance.status}`,
      });
    } catch (error) {
      console.error('POST /api/raw-materials/[id]/consume-weight error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to consume weight';
      return NextResponse.json(
        { success: false, message: `Failed to update: ${message}` },
        { status: 500 }
      );
    }
  });
}
