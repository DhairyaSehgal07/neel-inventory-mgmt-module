import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { updateCompoundSchema } from '@/schemas/compoundSchema';

type RouteParams = { params: Promise<{ id: string }> };

function isPrismaKnownRequestError(
  err: unknown
): err is { code: string; meta?: { target?: string[] }; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: string }).code === 'string' &&
    (err as { code: string }).code.startsWith('P')
  );
}

const TOTAL_TOLERANCE = 1e-6;

const compoundIncludeDetail = {
  history: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      performedBy: {
        select: { id: true, name: true, mobileNumber: true, role: true },
      },
    },
  },
} as const;

/**
 * GET /api/compounds/[id]
 * Get one compound with full history. Requires COMPOUND_BATCH_VIEW.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withRBAC(_request, Permission.COMPOUND_BATCH_VIEW, async () => {
    try {
      const { id } = await params;
      const compoundId = parseInt(id, 10);
      if (Number.isNaN(compoundId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid compound id' },
          { status: 400 }
        );
      }

      await dbConnect();

      const compound = await prisma.compound.findUnique({
        where: { id: compoundId },
        include: compoundIncludeDetail,
      });

      if (!compound) {
        return NextResponse.json(
          { success: false, message: 'Compound not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: compound });
    } catch (error) {
      console.error('GET /api/compounds/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch compound' },
        { status: 500 }
      );
    }
  });
}

/**
 * PATCH /api/compounds/[id]
 * Update a compound; recomputes total/remaining when batch or weight fields change.
 * Requires COMPOUND_BATCH_UPDATE.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
      const parsed = updateCompoundSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.flatten().fieldErrors
          ? Object.values(parsed.error.flatten().fieldErrors).flat().join(', ')
          : 'Validation failed';
        return NextResponse.json(
          { success: false, message },
          { status: 400 }
        );
      }

      if (Object.keys(parsed.data).length === 0) {
        return NextResponse.json(
          { success: false, message: 'No fields to update' },
          { status: 400 }
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

      const p = parsed.data;
      const batchCount = p.batchCount ?? existing.batchCount;
      const weightPerBatchKg = p.weightPerBatchKg ?? existing.weightPerBatchKg;
      const weightConsumedKg = p.weightConsumedKg ?? existing.weightConsumedKg;
      const computedTotal = batchCount * weightPerBatchKg;

      let totalWeightProducedKg = existing.totalWeightProducedKg;
      if (
        p.batchCount !== undefined ||
        p.weightPerBatchKg !== undefined ||
        p.totalWeightProducedKg !== undefined
      ) {
        if (p.totalWeightProducedKg !== undefined) {
          if (Math.abs(p.totalWeightProducedKg - computedTotal) > TOTAL_TOLERANCE) {
            return NextResponse.json(
              {
                success: false,
                message:
                  'totalWeightProducedKg must equal batchCount × weightPerBatchKg',
              },
              { status: 400 }
            );
          }
          totalWeightProducedKg = p.totalWeightProducedKg;
        } else {
          totalWeightProducedKg = computedTotal;
        }
      }

      const weightRemainingKg = totalWeightProducedKg - weightConsumedKg;
      if (weightRemainingKg < -TOTAL_TOLERANCE) {
        return NextResponse.json(
          {
            success: false,
            message:
              'weightConsumedKg cannot exceed total produced weight',
          },
          { status: 400 }
        );
      }

      const updated = await prisma.compound.update({
        where: { id: compoundId },
        data: {
          ...(p.compoundCode !== undefined && { compoundCode: p.compoundCode }),
          ...(p.dateOfProduction !== undefined && {
            dateOfProduction: new Date(p.dateOfProduction),
          }),
          ...(p.createdBy !== undefined && { createdBy: p.createdBy }),
          ...(p.compoundName !== undefined && { compoundName: p.compoundName }),
          ...(p.batch !== undefined && { batch: p.batch }),
          ...(p.batchCount !== undefined && { batchCount: p.batchCount }),
          ...(p.weightPerBatchKg !== undefined && {
            weightPerBatchKg: p.weightPerBatchKg,
          }),
          totalWeightProducedKg,
          ...(p.weightConsumedKg !== undefined && {
            weightConsumedKg: p.weightConsumedKg,
          }),
          weightRemainingKg: Math.max(0, weightRemainingKg),
          ...(p.location !== undefined && { location: p.location }),
          ...(p.status !== undefined && { status: p.status }),
        },
        include: compoundIncludeDetail,
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Compound updated',
      });
    } catch (error: unknown) {
      console.error('PATCH /api/compounds/[id] error:', error);

      let message = 'Failed to update compound';
      let status = 500;

      if (isPrismaKnownRequestError(error)) {
        if (error.code === 'P2002') {
          message = 'A compound with this code already exists';
          status = 409;
        } else if (process.env.NODE_ENV === 'development' && error.message) {
          message = error.message;
        }
      } else if (error instanceof Error && process.env.NODE_ENV === 'development') {
        message = error.message;
      }

      return NextResponse.json(
        { success: false, message },
        { status }
      );
    }
  });
}

/**
 * DELETE /api/compounds/[id]
 * Requires COMPOUND_BATCH_DELETE.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  return withRBAC(_request, Permission.COMPOUND_BATCH_DELETE, async () => {
    try {
      const { id } = await params;
      const compoundId = parseInt(id, 10);
      if (Number.isNaN(compoundId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid compound id' },
          { status: 400 }
        );
      }

      await dbConnect();

      await prisma.compound.delete({
        where: { id: compoundId },
      });

      return NextResponse.json({
        success: true,
        message: 'Compound deleted',
      });
    } catch (error) {
      console.error('DELETE /api/compounds/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete compound' },
        { status: 500 }
      );
    }
  });
}
