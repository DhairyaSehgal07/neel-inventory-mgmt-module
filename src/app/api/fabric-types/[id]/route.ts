import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import { updateFabricTypeSchema } from '@/schemas/fabricSettingsSchema';

/**
 * GET /api/fabric-types/[id]
 * Get one fabric type. Requires FABRIC_TYPE_VIEW.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.FABRIC_TYPE_VIEW, async (_, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric type id' },
          { status: 400 }
        );
      }

      await dbConnect();
      const item = await prisma.fabricType.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json(
          { success: false, message: 'Fabric type not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: item });
    } catch (error) {
      console.error('GET /api/fabric-types/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch fabric type' },
        { status: 500 }
      );
    }
  });
}

/**
 * PATCH /api/fabric-types/[id]
 * Update fabric type. Requires FABRIC_TYPE_UPDATE.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.FABRIC_TYPE_UPDATE, async (req, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric type id' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const parsed = updateFabricTypeSchema.safeParse(body);
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

      const item = await prisma.fabricType.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json(
          { success: false, message: 'Fabric type not found' },
          { status: 404 }
        );
      }

      if (parsed.data.name !== undefined) {
        const existing = await prisma.fabricType.findUnique({
          where: { name: parsed.data.name },
        });
        if (existing && existing.id !== id) {
          return NextResponse.json(
            { success: false, message: 'A fabric type with this name already exists' },
            { status: 409 }
          );
        }
      }

      const updated = await prisma.fabricType.update({
        where: { id },
        data: parsed.data,
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Fabric type updated',
      });
    } catch (error) {
      console.error('PATCH /api/fabric-types/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update fabric type' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/fabric-types/[id]
 * Delete fabric type. Requires FABRIC_TYPE_DELETE.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.FABRIC_TYPE_DELETE, async (_, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric type id' },
          { status: 400 }
        );
      }

      await dbConnect();
      const item = await prisma.fabricType.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json(
          { success: false, message: 'Fabric type not found' },
          { status: 404 }
        );
      }

      await prisma.fabricType.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'Fabric type deleted',
      });
    } catch (error) {
      console.error('DELETE /api/fabric-types/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete fabric type' },
        { status: 500 }
      );
    }
  });
}
