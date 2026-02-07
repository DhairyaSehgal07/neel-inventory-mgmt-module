import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { createFabricStrengthSchema } from '@/schemas/fabricSettingsSchema';

/**
 * GET /api/fabric-strengths
 * List fabric strengths. Requires FABRIC_STRENGTH_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_STRENGTH_VIEW, async () => {
    try {
      await dbConnect();
      const items = await prisma.fabricStrength.findMany({
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ success: true, data: items });
    } catch (error) {
      console.error('GET /api/fabric-strengths error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to list fabric strengths' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/fabric-strengths
 * Create fabric strength. Requires FABRIC_STRENGTH_CREATE.
 */
export async function POST(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_STRENGTH_CREATE, async () => {
    try {
      const body = await request.json();
      const parsed = createFabricStrengthSchema.safeParse(body);
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

      const existing = await prisma.fabricStrength.findUnique({
        where: { name: parsed.data.name },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'A fabric strength with this name already exists' },
          { status: 409 }
        );
      }

      const item = await prisma.fabricStrength.create({
        data: { name: parsed.data.name },
      });

      return NextResponse.json({
        success: true,
        data: item,
        message: 'Fabric strength created',
      });
    } catch (error) {
      console.error('POST /api/fabric-strengths error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create fabric strength' },
        { status: 500 }
      );
    }
  });
}
