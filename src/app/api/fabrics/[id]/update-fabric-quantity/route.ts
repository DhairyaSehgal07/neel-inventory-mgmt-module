import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { z } from 'zod';

const updateFabricQuantitySchema = z.object({
  quantity: z.coerce
    .number({ message: 'Quantity must be a number' })
    .min(0, 'Quantity must be a non-negative number'),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/fabrics/[id]/update-fabric-quantity
 * Update fabric current quantity (fabricLengthCurrent) and status.
 * If quantity > 0: status = OPEN. If quantity === 0: status = CLOSED.
 * Requires FABRIC_UPDATE.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withRBAC(request, Permission.FABRIC_UPDATE, async () => {
    try {
      const { id } = await params;
      const fabricId = parseInt(id, 10);
      if (Number.isNaN(fabricId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric id' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const parsed = updateFabricQuantitySchema.safeParse(body);
      if (!parsed.success) {
        const message =
          parsed.error.flatten().fieldErrors.quantity?.join(', ') ?? 'Validation failed';
        return NextResponse.json(
          { success: false, message },
          { status: 400 }
        );
      }

      await dbConnect();

      const existing = await prisma.fabric.findUnique({
        where: { id: fabricId },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Fabric not found' },
          { status: 404 }
        );
      }

      const quantity = parsed.data.quantity;
      const status = quantity > 0 ? 'OPEN' : 'CLOSED';

      const updated = await prisma.fabric.update({
        where: { id: fabricId },
        data: {
          fabricLengthCurrent: quantity,
          status,
          ...(status === 'OPEN' && { assignTo: null }),
        },
        include: {
          fabricType: true,
          fabricStrength: true,
          fabricWidth: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Fabric quantity updated to ${quantity} m, status set to ${status}`,
      });
    } catch (error) {
      console.error('POST /api/fabrics/[id]/update-fabric-quantity error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to update fabric quantity';
      return NextResponse.json(
        { success: false, message: `Failed to update fabric quantity: ${message}` },
        { status: 500 }
      );
    }
  });
}
