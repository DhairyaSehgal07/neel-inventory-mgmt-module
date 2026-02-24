import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { issueFabricSchema } from '@/schemas/issueFabricSchema';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/fabrics/[id]/issue
 * Issue fabric: create IssueFabric record, decrement fabric current length/width, set status to IN USE.
 * Requires FABRIC_UPDATE.
 * Stores createdById for traceability and fabricLengthBeforeIssuance/fabricWidthBeforeIssuance
 * (stock at issue time) so the client can compute remaining = beforeIssuance - issued.
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

      const session = await auth();
      const userIdStr = session?.user?.id;
      if (!userIdStr) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: user not found in session' },
          { status: 401 }
        );
      }
      const createdById = parseInt(userIdStr, 10);
      if (Number.isNaN(createdById)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user id in session' },
          { status: 401 }
        );
      }

      const body = await request.json();
      const parsed = issueFabricSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.flatten().fieldErrors
          ? Object.values(parsed.error.flatten().fieldErrors).flat().join(', ')
          : 'Validation failed';
        return NextResponse.json(
          { success: false, message },
          { status: 400 }
        );
      }

      const { lengthIssued, widthIssued, purpose } = parsed.data;

      await dbConnect();

      const fabric = await prisma.fabric.findUnique({
        where: { id: fabricId },
      });
      if (!fabric) {
        return NextResponse.json(
          { success: false, message: 'Fabric not found' },
          { status: 404 }
        );
      }

      if (lengthIssued > fabric.fabricLengthCurrent) {
        return NextResponse.json(
          {
            success: false,
            message: `Length issued (${lengthIssued}) exceeds current length (${fabric.fabricLengthCurrent})`,
          },
          { status: 400 }
        );
      }
      if (widthIssued > fabric.fabricWidthCurrent) {
        return NextResponse.json(
          {
            success: false,
            message: `Width issued (${widthIssued}) exceeds current width (${fabric.fabricWidthCurrent})`,
          },
          { status: 400 }
        );
      }

      const newLengthCurrent = fabric.fabricLengthCurrent - lengthIssued;
      const newWidthCurrent = fabric.fabricWidthCurrent - widthIssued;

      const [issueFabric] = await prisma.$transaction([
        prisma.issueFabric.create({
          data: {
            fabricId,
            lengthIssued,
            widthIssued,
            purpose,
            createdById,
            fabricLengthBeforeIssuance: fabric.fabricLengthCurrent,
            fabricWidthBeforeIssuance: fabric.fabricWidthCurrent,
            fabricLengthRemaining: newLengthCurrent,
            fabricWidthRemaining: newWidthCurrent,
          },
        }),
        prisma.fabric.update({
          where: { id: fabricId },
          data: {
            fabricLengthCurrent: newLengthCurrent,
            fabricWidthCurrent: newWidthCurrent,
            status: 'IN USE',
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: issueFabric,
        message: 'Fabric issued successfully',
      });
    } catch (error) {
      console.error('POST /api/fabrics/[id]/issue error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to issue fabric' },
        { status: 500 }
      );
    }
  });
}
