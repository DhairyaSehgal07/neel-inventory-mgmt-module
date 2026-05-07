import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { createCompoundSchema } from '@/schemas/compoundSchema';
import type { Compound, CompoundStatus } from '@/generated/prisma/client';

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

function deriveCompoundDisplayStatus(compound: Compound): string {
  // Keep terminal states explicit.
  if (compound.status === 'REJECTED') return 'REJECTED';
  if (compound.status === 'TRADED') return 'TRADED';
  if (compound.status === 'CONSUMED') return 'CONSUMED';
  if (compound.status === 'IN_USE') return 'IN_USE';

  // Quantity-based status derivation mirrors fabrics:
  // - partially consumed inventory appears as OPEN
  // - untouched inventory appears as PACKED
  if (compound.weightRemainingKg <= 0) return 'CONSUMED';
  if (compound.weightRemainingKg < compound.totalWeightProducedKg) return 'OPEN';

  // Backward compatibility for historical enum values.
  if (compound.status === 'ASSIGNED') return 'OPEN';
  return (compound.status ?? 'PACKED') as CompoundStatus | 'PACKED';
}

function computeTotals(
  batchCount: number,
  weightPerBatchKg: number,
  weightConsumedKg: number,
  totalFromPayload?: number
) {
  const computedTotal = batchCount * weightPerBatchKg;
  const totalWeightProducedKg =
    totalFromPayload !== undefined ? totalFromPayload : computedTotal;

  if (
    totalFromPayload !== undefined &&
    Math.abs(totalFromPayload - computedTotal) > TOTAL_TOLERANCE
  ) {
    return {
      ok: false as const,
      message:
        'totalWeightProducedKg must equal batchCount × weightPerBatchKg',
    };
  }

  const weightRemainingKg = totalWeightProducedKg - weightConsumedKg;
  if (weightRemainingKg < -TOTAL_TOLERANCE) {
    return {
      ok: false as const,
      message:
        'weightConsumedKg cannot exceed total produced weight (batchCount × weightPerBatchKg)',
    };
  }

  return {
    ok: true as const,
    totalWeightProducedKg,
    weightRemainingKg: Math.max(0, weightRemainingKg),
  };
}

/**
 * GET /api/compounds
 * List compounds (counts only; use GET /api/compounds/[id] for full history).
 * Requires COMPOUND_BATCH_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.COMPOUND_BATCH_VIEW, async () => {
    try {
      await dbConnect();
      const items = await prisma.compound.findMany({
        include: {
          _count: { select: { history: true } },
        },
        orderBy: { dateOfProduction: 'desc' },
      });
      const data = items.map((item) => ({
        ...item,
        status: deriveCompoundDisplayStatus(item),
      }));
      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/compounds error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to list compounds' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/compounds
 * Create a compound. Computes total produced and remaining weights.
 * Requires COMPOUND_BATCH_CREATE.
 */
export async function POST(request: NextRequest) {
  return withRBAC(request, Permission.COMPOUND_BATCH_CREATE, async () => {
    try {
      const body = await request.json();
      const parsed = createCompoundSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.flatten().fieldErrors
          ? Object.values(parsed.error.flatten().fieldErrors).flat().join(', ')
          : 'Validation failed';
        return NextResponse.json(
          { success: false, message },
          { status: 400 }
        );
      }

      const d = parsed.data;
      const weightConsumedKg = d.weightConsumedKg ?? 0;
      const totals = computeTotals(
        d.batchCount,
        d.weightPerBatchKg,
        weightConsumedKg,
        d.totalWeightProducedKg
      );

      if (!totals.ok) {
        return NextResponse.json(
          { success: false, message: totals.message },
          { status: 400 }
        );
      }

      await dbConnect();

      const created = await prisma.compound.create({
        data: {
          compoundCode: d.compoundCode,
          dateOfProduction: new Date(d.dateOfProduction),
          createdBy: d.createdBy,
          compoundName: d.compoundName,
          batch: d.batch,
          batchCount: d.batchCount,
          weightPerBatchKg: d.weightPerBatchKg,
          totalWeightProducedKg: totals.totalWeightProducedKg,
          weightConsumedKg,
          weightRemainingKg: totals.weightRemainingKg,
          location: d.location,
          status: d.status ?? undefined,
        },
        include: {
          _count: { select: { history: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: created,
        message: 'Compound created',
      });
    } catch (error: unknown) {
      console.error('POST /api/compounds error:', error);

      let message = 'Failed to create compound';
      let status = 500;

      if (isPrismaKnownRequestError(error)) {
        switch (error.code) {
          case 'P2002': {
            const target = error.meta?.target;
            const field = Array.isArray(target) ? target.join(', ') : 'compoundCode';
            message =
              field.includes('compoundCode')
                ? 'A compound with this code already exists'
                : `A record with this value already exists (${field})`;
            status = 409;
            break;
          }
          default:
            if (process.env.NODE_ENV === 'development' && error.message) {
              message = `Database error: ${error.message}`;
            }
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
