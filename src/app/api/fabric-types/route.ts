import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { createFabricTypeSchema } from '@/schemas/fabricSettingsSchema';

/**
 * GET /api/fabric-types
 * List fabric types. Requires FABRIC_TYPE_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_TYPE_VIEW, async () => {
    try {
      await dbConnect();
      const items = await prisma.fabricType.findMany({
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ success: true, data: items });
    } catch (error) {
      console.error('GET /api/fabric-types error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to list fabric types' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/fabric-types
 * Create fabric type. Requires FABRIC_TYPE_CREATE.
 */
export async function POST(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_TYPE_CREATE, async () => {
    try {
      const body = await request.json();
      const parsed = createFabricTypeSchema.safeParse(body);
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

      const existing = await prisma.fabricType.findUnique({
        where: { name: parsed.data.name },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'A fabric type with this name already exists' },
          { status: 409 }
        );
      }

      const item = await prisma.fabricType.create({
        data: { name: parsed.data.name },
      });

      return NextResponse.json({
        success: true,
        data: item,
        message: 'Fabric type created',
      });
    } catch (error) {
      console.error('POST /api/fabric-types error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create fabric type' },
        { status: 500 }
      );
    }
  });
}
