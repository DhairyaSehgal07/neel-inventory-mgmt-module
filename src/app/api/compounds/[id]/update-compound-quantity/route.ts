import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { z } from 'zod';

const updateCompoundQuantitySchema = z.object({
  quantity: z.coerce
    .number({ message: 'Quantity must be a number' })
    .min(0, 'Quantity must be a non-negative number'),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/compounds/[id]/update-compound-quantity
 * Update compound remaining quantity and status.
 * If quantity > 0: status = PACKED. If quantity === 0: status = CONSUMED.
 * Requires COMPOUND_BATCH_UPDATE.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withRBAC(request, Permission.COMPOUND_BATCH_UPDATE, async () => {
    try {
      const { id } = await params;
      const compoundId = parseInt(id, 10);
      if (Number.isNaN(compoundId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid compound id' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const parsed = updateCompoundQuantitySchema.safeParse(body);
      if (!parsed.success) {
        const message =
          parsed.error.flatten().fieldErrors.quantity?.join(', ') ?? 'Validation failed';
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

      const existing = await prisma.compound.findUnique({
        where: { id: compoundId },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Compound not found' },
          { status: 404 }
        );
      }

      const quantity = parsed.data.quantity;
      if (quantity > existing.totalWeightProducedKg) {
        return NextResponse.json(
          {
            success: false,
            message: `Quantity must be less than or equal to total produced quantity (${existing.totalWeightProducedKg} kg)`,
          },
          { status: 400 }
        );
      }

      const status = quantity > 0 ? 'PACKED' : 'CONSUMED';
      const consumed = existing.totalWeightProducedKg - quantity;

      const [updated] = await prisma.$transaction([
        prisma.compound.update({
          where: { id: compoundId },
          data: {
            weightRemainingKg: quantity,
            weightConsumedKg: consumed,
            status,
            ...(status === 'PACKED' && { assignTo: null }),
          },
        }),
        prisma.compoundHistory.create({
          data: {
            compoundId,
            actionType: 'BALANCE_UPDATE',
            performedById,
            weightRemainingBeforeKg: existing.weightRemainingKg,
            weightRemainingAfterKg: quantity,
            weightConsumedBeforeKg: existing.weightConsumedKg,
            weightConsumedAfterKg: consumed,
            statusBefore: existing.status ?? undefined,
            statusAfter: status,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Compound quantity updated to ${quantity} kg, status set to ${status}`,
      });
    } catch (error) {
      console.error('POST /api/compounds/[id]/update-compound-quantity error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to update compound quantity';
      return NextResponse.json(
        { success: false, message: `Failed to update compound quantity: ${message}` },
        { status: 500 }
      );
    }
  });
}
