import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission } from '@/lib/rbac/permissions';
import { updateFabricStrengthSchema } from '@/schemas/fabricSettingsSchema';

/**
 * GET /api/fabric-strengths/[id]
 * Get one fabric strength. Requires FABRIC_STRENGTH_VIEW.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.FABRIC_STRENGTH_VIEW, async (_, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric strength id' },
          { status: 400 }
        );
      }

      await dbConnect();
      const item = await prisma.fabricStrength.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json(
          { success: false, message: 'Fabric strength not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: item });
    } catch (error) {
      console.error('GET /api/fabric-strengths/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch fabric strength' },
        { status: 500 }
      );
    }
  });
}

/**
 * PATCH /api/fabric-strengths/[id]
 * Update fabric strength. Requires FABRIC_STRENGTH_UPDATE.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.FABRIC_STRENGTH_UPDATE, async (req, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric strength id' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const parsed = updateFabricStrengthSchema.safeParse(body);
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

      const item = await prisma.fabricStrength.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json(
          { success: false, message: 'Fabric strength not found' },
          { status: 404 }
        );
      }

      if (parsed.data.name !== undefined) {
        const existing = await prisma.fabricStrength.findUnique({
          where: { name: parsed.data.name },
        });
        if (existing && existing.id !== id) {
          return NextResponse.json(
            { success: false, message: 'A fabric strength with this name already exists' },
            { status: 409 }
          );
        }
      }

      const updated = await prisma.fabricStrength.update({
        where: { id },
        data: parsed.data,
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Fabric strength updated',
      });
    } catch (error) {
      console.error('PATCH /api/fabric-strengths/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update fabric strength' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/fabric-strengths/[id]
 * Delete fabric strength. Requires FABRIC_STRENGTH_DELETE.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.FABRIC_STRENGTH_DELETE, async (_, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid fabric strength id' },
          { status: 400 }
        );
      }

      await dbConnect();
      const item = await prisma.fabricStrength.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json(
          { success: false, message: 'Fabric strength not found' },
          { status: 404 }
        );
      }

      await prisma.fabricStrength.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'Fabric strength deleted',
      });
    } catch (error) {
      console.error('DELETE /api/fabric-strengths/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete fabric strength' },
        { status: 500 }
      );
    }
  });
}
