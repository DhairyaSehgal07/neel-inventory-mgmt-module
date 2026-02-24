import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { z } from 'zod';

const assignFabricSchema = z.object({
  assignTo: z.string().min(1, 'Assign to is required'),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/fabrics/[id]/assign
 * Update fabric assignTo. Requires FABRIC_UPDATE.
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
      const parsed = assignFabricSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.flatten().fieldErrors.assignTo?.join(', ') ?? 'Validation failed';
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

      const value = parsed.data.assignTo;
      const isRejection = value === 'Rejection';
      const isTrading = value === 'Trading';

      const updateData: { assignTo?: string | null; status?: 'REJECTED' | 'TRADED' | 'IN_USE' } =
        isRejection
          ? { status: 'REJECTED', assignTo: null }
          : isTrading
            ? { status: 'TRADED', assignTo: null }
            : { assignTo: value, status: 'IN_USE' };

      const updated = await prisma.fabric.update({
        where: { id: fabricId },
        data: updateData,
        include: {
          fabricType: true,
          fabricStrength: true,
          fabricWidth: true,
        },
      });

      const message = isRejection
        ? 'Fabric marked as rejected'
        : isTrading
          ? 'Fabric marked as traded'
          : 'Fabric assigned';

      return NextResponse.json({
        success: true,
        data: updated,
        message,
      });
    } catch (error) {
      console.error('POST /api/fabrics/[id]/assign error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to assign fabric';
      return NextResponse.json(
        { success: false, message: `Failed to assign fabric: ${message}` },
        { status: 500 }
      );
    }
  });
}
