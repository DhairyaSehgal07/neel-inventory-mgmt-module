import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import { updateFabricWidthSchema } from '@/schemas/fabricSettingsSchema';

/**
 * GET /api/fabric-widths/[id]
 * Get one fabric width. Requires FABRIC_WIDTH_VIEW.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.FABRIC_WIDTH_VIEW, async (_, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric width id' },
          { status: 400 }
        );
      }

      await dbConnect();
      const item = await prisma.fabricWidth.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json(
          { success: false, message: 'Fabric width not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: item });
    } catch (error) {
      console.error('GET /api/fabric-widths/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch fabric width' },
        { status: 500 }
      );
    }
  });
}

/**
 * PATCH /api/fabric-widths/[id]
 * Update fabric width. Requires FABRIC_WIDTH_UPDATE.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.FABRIC_WIDTH_UPDATE, async (req, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric width id' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const parsed = updateFabricWidthSchema.safeParse(body);
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

      const item = await prisma.fabricWidth.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json(
          { success: false, message: 'Fabric width not found' },
          { status: 404 }
        );
      }

      if (parsed.data.value !== undefined) {
        const existing = await prisma.fabricWidth.findFirst({
          where: { value: parsed.data.value },
        });
        if (existing && existing.id !== id) {
          return NextResponse.json(
            { success: false, message: 'A fabric width with this value already exists' },
            { status: 409 }
          );
        }
      }

      const updated = await prisma.fabricWidth.update({
        where: { id },
        data: parsed.data,
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Fabric width updated',
      });
    } catch (error) {
      console.error('PATCH /api/fabric-widths/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update fabric width' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/fabric-widths/[id]
 * Delete fabric width. Requires FABRIC_WIDTH_DELETE.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.FABRIC_WIDTH_DELETE, async (_, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric width id' },
          { status: 400 }
        );
      }

      await dbConnect();
      const item = await prisma.fabricWidth.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json(
          { success: false, message: 'Fabric width not found' },
          { status: 404 }
        );
      }

      await prisma.fabricWidth.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'Fabric width deleted',
      });
    } catch (error) {
      console.error('DELETE /api/fabric-widths/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete fabric width' },
        { status: 500 }
      );
    }
  });
}
