import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { createFabricWidthSchema } from '@/schemas/fabricSettingsSchema';

/**
 * GET /api/fabric-widths
 * List fabric widths. Requires FABRIC_WIDTH_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_WIDTH_VIEW, async () => {
    try {
      await dbConnect();
      const items = await prisma.fabricWidth.findMany({
        orderBy: { value: 'asc' },
      });
      return NextResponse.json({ success: true, data: items });
    } catch (error) {
      console.error('GET /api/fabric-widths error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to list fabric widths' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/fabric-widths
 * Create fabric width. Requires FABRIC_WIDTH_CREATE.
 */
export async function POST(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_WIDTH_CREATE, async () => {
    try {
      const body = await request.json();
      const parsed = createFabricWidthSchema.safeParse(body);
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

      const existing = await prisma.fabricWidth.findFirst({
        where: { value: parsed.data.value },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'A fabric width with this value already exists' },
          { status: 409 }
        );
      }

      const item = await prisma.fabricWidth.create({
        data: { value: parsed.data.value },
      });

      return NextResponse.json({
        success: true,
        data: item,
        message: 'Fabric width created',
      });
    } catch (error) {
      console.error('POST /api/fabric-widths error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create fabric width' },
        { status: 500 }
      );
    }
  });
}
