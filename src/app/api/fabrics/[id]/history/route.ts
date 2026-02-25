import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/fabrics/[id]/history
 * Returns fabric history entries for the given fabric. Requires FABRIC_VIEW.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      const { id } = await params;
      const fabricId = parseInt(id, 10);
      if (Number.isNaN(fabricId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric id' },
          { status: 400 }
        );
      }

      await dbConnect();

      const fabric = await prisma.fabric.findUnique({
        where: { id: fabricId },
        select: { id: true },
      });
      if (!fabric) {
        return NextResponse.json(
          { success: false, message: 'Fabric not found' },
          { status: 404 }
        );
      }

      const history = await prisma.fabricHistory.findMany({
        where: { fabricId },
        include: {
          performedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('GET /api/fabrics/[id]/history error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to fetch fabric history';
      return NextResponse.json(
        { success: false, message },
        { status: 500 }
      );
    }
  });
}
