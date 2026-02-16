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
        orderBy: { id: 'desc' },
      });
      return NextResponse.json({ success: true, data: fabrics });
    } catch (error) {
      console.error('GET /api/fabrics error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to list fabrics' },
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

      // Resolve type, strength, width for fabric code
      const [fabricType, fabricStrength, fabricWidth] = await Promise.all([
        prisma.fabricType.findUnique({ where: { id: data.fabricTypeId } }),
        prisma.fabricStrength.findUnique({ where: { id: data.fabricStrengthId } }),
        prisma.fabricWidth.findUnique({ where: { id: data.fabricWidthId } }),
      ]);

      if (!fabricType || !fabricStrength || !fabricWidth) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric type, strength, or width' },
          { status: 400 }
        );
      }

      const dateStr = new Date(data.date).toISOString().slice(0, 10);
      const fabricCode = [
        fabricType.name,
        fabricStrength.name,
        String(fabricWidth.value),
        data.nameOfVendor,
        String(data.netWeight),
        dateStr,
      ].join('-');

      const fabric = await prisma.fabric.create({
        data: {
          date: new Date(data.date),
          fabricDate: dateStr,
          fabricCode,
          fabricTypeId: data.fabricTypeId,
          fabricStrengthId: data.fabricStrengthId,
          fabricWidthId: data.fabricWidthId,
          fabricLength: data.fabricLength,
          nameOfVendor: data.nameOfVendor,
          gsmObserved: data.gsmObserved,
          netWeight: data.netWeight,
          gsmCalculated: data.gsmCalculated,
          qrCode: '', // set below after we have id
        },
      });

      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || getBaseUrl(request)).replace(/\/$/, '');
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

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Fabric created',
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
