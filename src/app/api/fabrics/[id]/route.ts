import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { createFabricSchema } from '@/schemas/fabricSchema';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/fabrics/[id]
 * Get a fabric by id. Public (no auth) so QR scan can open product page.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
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
      include: {
        fabricType: true,
        fabricStrength: true,
        fabricWidth: true,
      },
    });

    if (!fabric) {
      return NextResponse.json(
        { success: false, message: 'Fabric not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: fabric });
  } catch (error) {
    console.error('GET /api/fabrics/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch fabric' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/fabrics/[id]
 * Update a fabric. Requires FABRIC_UPDATE.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
      const parsed = createFabricSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.flatten().fieldErrors
          ? Object.values(parsed.error.flatten().fieldErrors).flat().join(', ')
          : 'Validation failed';
        return NextResponse.json(
          { success: false, message },
          { status: 400 }
        );
      }

      await dbConnect();

      const existing = await prisma.fabric.findUnique({
        where: { id: fabricId },
        include: { fabricType: true, fabricStrength: true, fabricWidth: true },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Fabric not found' },
          { status: 404 }
        );
      }

      const [fabricType, fabricStrength, fabricWidth] = await Promise.all([
        prisma.fabricType.findUnique({ where: { id: parsed.data.fabricTypeId } }),
        prisma.fabricStrength.findUnique({ where: { id: parsed.data.fabricStrengthId } }),
        prisma.fabricWidth.findUnique({ where: { id: parsed.data.fabricWidthId } }),
      ]);
      if (!fabricType || !fabricStrength || !fabricWidth) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric type, strength, or width' },
          { status: 400 }
        );
      }

      const dateStr = new Date(parsed.data.date).toISOString().slice(0, 10);
      const fabricCode = [
        fabricType.name,
        fabricStrength.name,
        String(fabricWidth.value),
        parsed.data.nameOfVendor,
        String(parsed.data.netWeight),
        dateStr,
      ].join('-');

      const updated = await prisma.fabric.update({
        where: { id: fabricId },
        data: {
          date: new Date(parsed.data.date),
          fabricDate: dateStr,
          fabricCode,
          fabricTypeId: parsed.data.fabricTypeId,
          fabricStrengthId: parsed.data.fabricStrengthId,
          fabricWidthId: parsed.data.fabricWidthId,
          fabricLength: parsed.data.fabricLength,
          nameOfVendor: parsed.data.nameOfVendor,
          gsmObserved: parsed.data.gsmObserved,
          netWeight: parsed.data.netWeight,
          gsmCalculated: parsed.data.gsmCalculated,
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
        message: 'Fabric updated',
      });
    } catch (error) {
      console.error('PATCH /api/fabrics/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update fabric' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/fabrics/[id]
 * Delete a fabric. Requires FABRIC_DELETE.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  return withRBAC(_request, Permission.FABRIC_DELETE, async () => {
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

      await prisma.fabric.delete({
        where: { id: fabricId },
      });

      return NextResponse.json({
        success: true,
        message: 'Fabric deleted',
      });
    } catch (error) {
      console.error('DELETE /api/fabrics/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete fabric' },
        { status: 500 }
      );
    }
  });
}
