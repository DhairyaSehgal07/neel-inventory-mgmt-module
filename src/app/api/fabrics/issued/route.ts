import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

/**
 * GET /api/fabrics/issued
 * List all issue fabric records with fabric and createdBy. Requires FABRIC_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      await dbConnect();
      const records = await prisma.issueFabric.findMany({
        include: {
          fabric: {
            include: {
              fabricType: true,
              fabricStrength: true,
              fabricWidth: true,
            },
          },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: records });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('GET /api/fabrics/issued error:', err.message, err);
      const isDev = process.env.NODE_ENV === 'development';
      const message =
        isDev && err.message
          ? `Failed to list issued fabrics: ${err.message}`
          : 'Failed to list issued fabrics';
      return NextResponse.json(
        { success: false, message },
        { status: 500 }
      );
    }
  });
}
