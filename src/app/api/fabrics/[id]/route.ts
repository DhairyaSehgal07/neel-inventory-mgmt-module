import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { generateFabricCode } from '@/lib/fabricCode';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { updateFabricSchema } from '@/schemas/fabricSchema';

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
        locations: true,
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
      const parsed = updateFabricSchema.safeParse(body);
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

      const [fabricType, fabricStrength, fabricWidthRow] = await Promise.all([
        prisma.fabricType.findUnique({ where: { id: parsed.data.fabricTypeId } }),
        prisma.fabricStrength.findUnique({ where: { id: parsed.data.fabricStrengthId } }),
        prisma.fabricWidth.findFirst({ where: { value: parsed.data.fabricWidthValue } }),
      ]);
      if (!fabricType || !fabricStrength) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric type or strength' },
          { status: 400 }
        );
      }
      const fabricWidth =
        fabricWidthRow ??
        (await prisma.fabricWidth.create({ data: { value: parsed.data.fabricWidthValue } }));

      const dateStr = new Date(parsed.data.date).toISOString().slice(0, 10);
      // Preserve sequence (frequency) from existing code so fabricCode stays unique; same logic as create
      const parts = existing.fabricCode.split('-');
      const sequenceFromCode =
        parts.length >= 2 ? parseInt(parts[parts.length - 2], 10) : 1;
      const sequenceNumber = Number.isNaN(sequenceFromCode) ? 1 : sequenceFromCode;
      const fabricCode = generateFabricCode({
        id: String(fabricId),
        fabricTypeName: fabricType.name,
        fabricStrengthName: fabricStrength.name,
        fabricWidthValue: fabricWidth.value,
        nameOfVendor: parsed.data.nameOfVendor,
        sequenceNumber,
        dateStr,
      });

      const updateData: Parameters<typeof prisma.fabric.update>[0]['data'] = {
        date: new Date(parsed.data.date),
        fabricDate: dateStr,
        fabricCode,
        fabricTypeId: parsed.data.fabricTypeId,
        fabricStrengthId: parsed.data.fabricStrengthId,
        fabricWidthId: fabricWidth.id,
        fabricLengthInitial: parsed.data.fabricLengthInitial,
        fabricLengthCurrent: parsed.data.fabricLengthCurrent ?? existing.fabricLengthCurrent,
        fabricWidthInitial: parsed.data.fabricWidthInitial ?? existing.fabricWidthInitial,
        fabricWidthCurrent: parsed.data.fabricWidthCurrent ?? existing.fabricWidthCurrent,
        nameOfVendor: parsed.data.nameOfVendor,
        gsmObserved: parsed.data.gsmObserved,
        netWeight: parsed.data.netWeight,
        gsmCalculated: parsed.data.gsmCalculated,
        ...(parsed.data.assignTo !== undefined && { assignTo: parsed.data.assignTo }),
      };

      const updated = await prisma.fabric.update({
        where: { id: fabricId },
        data: updateData,
        include: {
          fabricType: true,
          fabricStrength: true,
          fabricWidth: true,
          locations: true,
        },
      });

      // Replace locations: delete existing and create from payload
      const locationsPayload =
        parsed.data.locationsPerFabric?.[0] ?? parsed.data.locations ?? [];
      const validLocations = locationsPayload.filter(
        (loc) => (loc.area ?? '').trim() && (loc.floor ?? '').trim()
      );
      await prisma.location.deleteMany({ where: { fabricId } });
      if (validLocations.length > 0) {
        await prisma.location.createMany({
          data: validLocations.map((loc) => ({
            fabricId,
            area: (loc.area ?? '').trim(),
            floor: (loc.floor ?? '').trim(),
          })),
        });
      }

      const withLocations = await prisma.fabric.findUnique({
        where: { id: fabricId },
        include: {
          fabricType: true,
          fabricStrength: true,
          fabricWidth: true,
          locations: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: withLocations ?? updated,
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
