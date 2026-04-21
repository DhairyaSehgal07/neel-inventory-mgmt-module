import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { z } from 'zod';
import type { CompoundMachinery, CompoundStatus } from '@/generated/prisma/enums';

const assignCompoundSchema = z.object({
  assignTo: z.string().min(1, 'Assign to is required'),
});

const CALENDARING_TO_MACHINERY: Record<string, CompoundMachinery> = {
  'Calendaring 1': 'CAL_1',
  'Calendaring 2': 'CAL_2',
  'Calendaring 3': 'CAL_3',
  'Calendaring 4': 'CAL_4',
};

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/compounds/[id]/assign
 * Update compound assignTo and status; records CompoundHistory ASSIGN.
 * Requires COMPOUND_BATCH_UPDATE.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withRBAC(request, Permission.COMPOUND_BATCH_UPDATE, async () => {
    try {
      const { id } = await params;
      const compoundId = parseInt(id, 10);
      if (Number.isNaN(compoundId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid compound id' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const parsed = assignCompoundSchema.safeParse(body);
      if (!parsed.success) {
        const message =
          parsed.error.flatten().fieldErrors.assignTo?.join(', ') ?? 'Validation failed';
        return NextResponse.json({ success: false, message }, { status: 400 });
      }

      const session = await auth();
      const userIdStr = session?.user?.id;
      if (!userIdStr) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: user not found in session' },
          { status: 401 }
        );
      }
      const performedById = parseInt(String(userIdStr), 10);
      if (Number.isNaN(performedById)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user id in session' },
          { status: 401 }
        );
      }

      await dbConnect();

      const existing = await prisma.compound.findUnique({
        where: { id: compoundId },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Compound not found' },
          { status: 404 }
        );
      }

      const value = parsed.data.assignTo;
      const isRejection = value === 'Rejection';
      const isTrading = value === 'Trading';
      const machinery = CALENDARING_TO_MACHINERY[value];

      const updateData: {
        assignTo?: string | null;
        status?: CompoundStatus;
      } = isRejection
        ? { status: 'REJECTED', assignTo: null }
        : isTrading
          ? { status: 'TRADED', assignTo: null }
          : { assignTo: value, status: 'IN_USE' };

      const statusAfter = updateData.status ?? existing.status;

      const historyDelegate = prisma.compoundHistory;
      if (!historyDelegate?.create) {
        console.error(
          'Prisma client missing compoundHistory delegate. Run: npx prisma generate && restart the dev server.'
        );
        return NextResponse.json(
          {
            success: false,
            message:
              'Server configuration error: database client out of date. Run "npx prisma generate" and restart the server.',
          },
          { status: 500 }
        );
      }

      const assignedQtyKg =
        !isRejection && !isTrading ? existing.weightRemainingKg : null;
      const assignedMachinery = machinery ?? null;

      const [updated] = await prisma.$transaction([
        prisma.compound.update({
          where: { id: compoundId },
          data: updateData,
        }),
        historyDelegate.create({
          data: {
            compoundId,
            actionType: 'ASSIGN',
            performedById,
            assignToBefore: existing.assignTo ?? undefined,
            assignToAfter: updateData.assignTo ?? undefined,
            statusBefore: existing.status ?? undefined,
            statusAfter: statusAfter ?? undefined,
            assignedQtyKg: assignedQtyKg ?? undefined,
            assignedMachinery: assignedMachinery ?? undefined,
          },
        }),
      ]);

      const message = isRejection
        ? 'Compound marked as rejected'
        : isTrading
          ? 'Compound marked as traded'
          : 'Compound assigned';

      return NextResponse.json({
        success: true,
        data: updated,
        message,
      });
    } catch (error) {
      console.error('POST /api/compounds/[id]/assign error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to assign compound';
      return NextResponse.json(
        { success: false, message: `Failed to assign compound: ${message}` },
        { status: 500 }
      );
    }
  });
}
