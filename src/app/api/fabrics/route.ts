import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { createFabricSchema } from '@/schemas/fabricSchema';
import { getBaseUrl } from '@/lib/base-url';

/**
 * GET /api/fabrics
 * List all fabrics with type, strength, width. Requires FABRIC_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      await dbConnect();
      const fabrics = await prisma.fabric.findMany({
        include: {
          fabricType: true,
          fabricStrength: true,
          fabricWidth: true,
        },
        orderBy: { id: 'asc' },
      });
      return NextResponse.json({ success: true, data: fabrics });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('GET /api/fabrics error:', err.message, err);
      const isDev = process.env.NODE_ENV === 'development';
      const message =
        isDev && err.message
          ? `Failed to list fabrics: ${err.message}`
          : 'Failed to list fabrics';
      return NextResponse.json(
        { success: false, message },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/fabrics
 * Create a fabric. Generates product URL and stores it in qrCode (for QR generation).
 * Requires FABRIC_CREATE.
 */
export async function POST(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_CREATE, async () => {
    try {
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

      const data = parsed.data;
      await dbConnect();

      // Resolve type and strength
      const [fabricType, fabricStrength] = await Promise.all([
        prisma.fabricType.findUnique({ where: { id: data.fabricTypeId } }),
        prisma.fabricStrength.findUnique({ where: { id: data.fabricStrengthId } }),
      ]);

      if (!fabricType || !fabricStrength) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric type or strength' },
          { status: 400 }
        );
      }

      // Resolve width: find-or-create by fabricWidthValue
      let fabricWidth = await prisma.fabricWidth.findFirst({
        where: { value: data.fabricWidthValue },
      });
      if (!fabricWidth) {
        fabricWidth = await prisma.fabricWidth.create({
          data: { value: data.fabricWidthValue },
        });
      }

      const dateStr = new Date(data.date).toISOString().slice(0, 10);
      const quantity = data.quantity ?? 1;
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || getBaseUrl(request)).replace(/\/$/, '');

      const created: Awaited<ReturnType<typeof prisma.fabric.create>>[] = [];

      for (let frequency = 1; frequency <= quantity; frequency++) {
        const fabricCode = [
          fabricType.name,
          fabricStrength.name,
          String(fabricWidth.value),
          data.nameOfVendor,
          String(frequency),
          dateStr,
        ].join('-');

        const fabricLengthCurrent = data.fabricLengthCurrent ?? data.fabricLengthInitial;
        const fabricWidthInitialVal = data.fabricWidthInitial ?? fabricWidth.value;
        const fabricWidthCurrentVal = data.fabricWidthCurrent ?? fabricWidthInitialVal;

        const fabric = await prisma.fabric.create({
          data: {
            date: new Date(data.date),
            fabricDate: dateStr,
            fabricCode,
            fabricTypeId: data.fabricTypeId,
            fabricStrengthId: data.fabricStrengthId,
            fabricWidthId: fabricWidth.id,
            fabricLengthInitial: data.fabricLengthInitial,
            fabricLengthCurrent,
            fabricWidthInitial: fabricWidthInitialVal,
            fabricWidthCurrent: fabricWidthCurrentVal,
            nameOfVendor: data.nameOfVendor,
            gsmObserved: data.gsmObserved,
            netWeight: data.netWeight,
            gsmCalculated: data.gsmCalculated,
            status: 'PACKED',
            qrCode: '', // set below after we have id
          },
        });

        const productUrl = `${baseUrl}/fabrics/${fabric.id}`;

        const updated = await prisma.fabric.update({
          where: { id: fabric.id },
          data: { qrCode: productUrl },
          include: {
            fabricType: true,
            fabricStrength: true,
            fabricWidth: true,
          },
        });

        created.push(updated);
      }

      return NextResponse.json({
        success: true,
        data: created.length === 1 ? created[0] : created,
        message: created.length === 1 ? 'Fabric created' : `${created.length} fabrics created`,
      });
    } catch (error) {
      console.error('POST /api/fabrics error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create fabric' },
        { status: 500 }
      );
    }
  });
}
