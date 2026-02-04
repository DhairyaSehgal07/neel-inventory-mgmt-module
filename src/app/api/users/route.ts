import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { toUserResponse } from '@/lib/api/user-response';
import { createUserSchema } from '@/schemas/userSchema';
import bcrypt from 'bcryptjs';

/**
 * GET /api/users
 * List users. Requires USER_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.USER_VIEW, async () => {
    try {
      await dbConnect();
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
      const data = users.map((u) => toUserResponse(u));
      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/users error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to list users' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/users
 * Create user. Requires USER_CREATE.
 */
export async function POST(request: NextRequest) {
  return withRBAC(request, Permission.USER_CREATE, async () => {
    try {
      const body = await request.json();
      const parsed = createUserSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.flatten().fieldErrors
          ? Object.values(parsed.error.flatten().fieldErrors).flat().join(', ')
          : 'Validation failed';
        return NextResponse.json(
          { success: false, message },
          { status: 400 }
        );
      }

      const { name, mobileNumber, password, role, permissions, isActive } =
        parsed.data;

      await dbConnect();

      const existing = await prisma.user.findUnique({
        where: { mobileNumber },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'User with this mobile number already exists' },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const permissionStrings = permissions.map((p) => String(p));

      const user = await prisma.user.create({
        data: {
          name,
          mobileNumber,
          password: hashedPassword,
          role,
          permissions: permissionStrings,
          isActive,
        },
      });

      return NextResponse.json({
        success: true,
        data: toUserResponse(user),
        message: 'User created',
      });
    } catch (error) {
      console.error('POST /api/users error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create user' },
        { status: 500 }
      );
    }
  });
}
