import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBACParams } from '@/lib/rbac/rbac-params';
import { Permission, hasPermission } from '@/lib/rbac';
import { auth } from '@/auth';
import { toUserResponse } from '@/lib/api/user-response';
import { updateUserSchema } from '@/schemas/userSchema';
import bcrypt from 'bcryptjs';
import type { Role } from '@/model/User';
import type { UserUpdateInput } from '@/generated/prisma/models/User';

/**
 * GET /api/users/[id]
 * Get one user. Requires USER_VIEW.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.USER_VIEW, async (_, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user id' },
          { status: 400 }
        );
      }

      await dbConnect();
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: toUserResponse(user),
      });
    } catch (error) {
      console.error('GET /api/users/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user' },
        { status: 500 }
      );
    }
  });
}

/**
 * PATCH /api/users/[id]
 * Update user. Requires USER_UPDATE. Updating `permissions` also requires USER_MANAGE_PERMISSIONS.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.USER_UPDATE, async (req, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user id' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const parsed = updateUserSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.flatten().fieldErrors
          ? Object.values(parsed.error.flatten().fieldErrors).flat().join(', ')
          : 'Validation failed';
        return NextResponse.json(
          { success: false, message },
          { status: 400 }
        );
      }

      const session = await auth();
      const userRole = (session?.user?.role as Role) ?? undefined;
      const userPermissions = (session?.user?.permissions as Permission[]) ?? [];

      // If updating permissions, require USER_MANAGE_PERMISSIONS
      if (parsed.data.permissions !== undefined) {
        const canManagePerms = hasPermission(
          userRole,
          userPermissions,
          Permission.USER_MANAGE_PERMISSIONS
        );
        if (!canManagePerms) {
          return NextResponse.json(
            { success: false, message: 'Insufficient permissions to update user permissions' },
            { status: 403 }
          );
        }
      }

      await dbConnect();

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      const updateData: UserUpdateInput = {};

      if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
      if (parsed.data.mobileNumber !== undefined) {
        const existing = await prisma.user.findUnique({
          where: { mobileNumber: parsed.data.mobileNumber },
        });
        if (existing && existing.id !== id) {
          return NextResponse.json(
            { success: false, message: 'Another user has this mobile number' },
            { status: 409 }
          );
        }
        updateData.mobileNumber = parsed.data.mobileNumber;
      }
      if (parsed.data.password !== undefined) {
        updateData.password = await bcrypt.hash(parsed.data.password, 10);
      }
      if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
      if (parsed.data.permissions !== undefined) {
        updateData.permissions = parsed.data.permissions.map((p) => String(p));
      }
      if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        data: toUserResponse(updated),
        message: 'User updated',
      });
    } catch (error) {
      console.error('PATCH /api/users/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update user' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/users/[id]
 * Delete user. Requires USER_DELETE.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withRBACParams(request, context.params, Permission.USER_DELETE, async (_, { params }) => {
    try {
      const resolved = await params;
      const id = Number(resolved.id);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user id' },
          { status: 400 }
        );
      }

      const session = await auth();
      const currentUserId = session?.user?.id;
      if (String(id) === currentUserId) {
        return NextResponse.json(
          { success: false, message: 'You cannot delete your own account' },
          { status: 400 }
        );
      }

      await dbConnect();
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      await prisma.user.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'User deleted',
      });
    } catch (error) {
      console.error('DELETE /api/users/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete user' },
        { status: 500 }
      );
    }
  });
}
