import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { updateRawMaterialSchema } from '@/schemas/rawMaterialSchema';
import {
  computeBagWeights,
  nextStatusFromBags,
  resolvePackedAt,
} from '@/lib/rawMaterialBalance';
import { logRawMaterialBalanceUpdate } from '@/lib/rawMaterialHistoryWrite';

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

/**
 * GET /api/raw-materials/[id]
 * Requires RAW_MATERIAL_BATCH_VIEW.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withRBAC(_request, Permission.RAW_MATERIAL_BATCH_VIEW, async () => {
    try {
      const { id } = await params;
      const rawMaterialId = parseInt(id, 10);
      if (Number.isNaN(rawMaterialId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid raw material id' },
          { status: 400 }
        );
      }

      await dbConnect();

      const row = await prisma.rawMaterial.findUnique({
        where: { id: rawMaterialId },
      });

      if (!row) {
        return NextResponse.json(
          { success: false, message: 'Raw material not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: row });
    } catch (error) {
      console.error('GET /api/raw-materials/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch raw material' },
        { status: 500 }
      );
    }
  });
}

/**
 * PATCH /api/raw-materials/[id]
 * Requires RAW_MATERIAL_BATCH_UPDATE.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withRBAC(request, Permission.RAW_MATERIAL_BATCH_UPDATE, async () => {
    try {
      const { id } = await params;
      const rawMaterialId = parseInt(id, 10);
      if (Number.isNaN(rawMaterialId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid raw material id' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const parsed = updateRawMaterialSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.flatten().fieldErrors
          ? Object.values(parsed.error.flatten().fieldErrors).flat().join(', ')
          : 'Validation failed';
        return NextResponse.json({ success: false, message }, { status: 400 });
      }

      if (Object.keys(parsed.data).length === 0) {
        return NextResponse.json(
          { success: false, message: 'No fields to update' },
          { status: 400 }
        );
      }

      await dbConnect();

      const existing = await prisma.rawMaterial.findUnique({
        where: { id: rawMaterialId },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Raw material not found' },
          { status: 404 }
        );
      }

      const p = parsed.data;
      const purchasedBags = p.purchasedBags ?? existing.purchasedBags;
      const availableBags = p.availableBags ?? existing.availableBags;
      const weightPerUnit = p.weightPerUnit ?? existing.weightPerUnit;

      const weights = computeBagWeights(purchasedBags, availableBags, weightPerUnit);
      if (!weights.ok) {
        return NextResponse.json({ success: false, message: weights.message }, { status: 400 });
      }

      const status =
        p.status ?? nextStatusFromBags(availableBags, purchasedBags);
      const packedAt = resolvePackedAt(
        availableBags,
        purchasedBags,
        existing.packedAt
      );

      const session = await auth();
      let performedById: number | null = null;
      const userIdStr = session?.user?.id;
      if (userIdStr) {
        const id = parseInt(String(userIdStr), 10);
        if (!Number.isNaN(id)) performedById = id;
      }

      const bagsChanged =
        Math.abs(availableBags - existing.availableBags) > 1e-6 ||
        Math.abs(weights.availableWeightKg - existing.availableWeightKg) > 1e-6;

      const updated = await prisma.$transaction(async (tx) => {
        const row = await tx.rawMaterial.update({
          where: { id: rawMaterialId },
          data: {
            ...(p.materialCode !== undefined && { materialCode: p.materialCode }),
            ...(p.date !== undefined && { date: new Date(p.date) }),
            ...(p.createdBy !== undefined && { createdBy: p.createdBy }),
            ...(p.rawMaterial !== undefined && { rawMaterial: p.rawMaterial }),
            ...(p.grade !== undefined && { grade: p.grade }),
            ...(p.vendor !== undefined && { vendor: p.vendor }),
            ...(p.units !== undefined && { units: p.units }),
            ...(p.weightPerUnit !== undefined && { weightPerUnit: p.weightPerUnit }),
            ...(p.purchasedBags !== undefined && { purchasedBags: p.purchasedBags }),
            ...(p.availableBags !== undefined && { availableBags: p.availableBags }),
            purchasedWeightKg: weights.purchasedWeightKg,
            availableWeightKg: weights.availableWeightKg,
            ...(p.location !== undefined && { location: p.location }),
            status,
            packedAt,
          },
        });

        if (bagsChanged) {
          await logRawMaterialBalanceUpdate(tx, {
            rawMaterialId,
            performedById,
            availableBagsBefore: existing.availableBags,
            availableBagsAfter: availableBags,
            availableWeightKgBefore: existing.availableWeightKg,
            availableWeightKgAfter: weights.availableWeightKg,
            statusBefore: existing.status,
            statusAfter: status,
          });
        }

        return row;
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Raw material updated',
      });
    } catch (error: unknown) {
      console.error('PATCH /api/raw-materials/[id] error:', error);

      let message = 'Failed to update raw material';
      let status = 500;

      if (isPrismaKnownRequestError(error)) {
        if (error.code === 'P2002') {
          message = 'A raw material with this code already exists';
          status = 409;
        } else if (process.env.NODE_ENV === 'development' && error.message) {
          message = error.message;
        }
      } else if (error instanceof Error && process.env.NODE_ENV === 'development') {
        message = error.message;
      }

      return NextResponse.json({ success: false, message }, { status });
    }
  });
}

/**
 * DELETE /api/raw-materials/[id]
 * Requires RAW_MATERIAL_BATCH_DELETE.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  return withRBAC(_request, Permission.RAW_MATERIAL_BATCH_DELETE, async () => {
    try {
      const { id } = await params;
      const rawMaterialId = parseInt(id, 10);
      if (Number.isNaN(rawMaterialId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid raw material id' },
          { status: 400 }
        );
      }

      await dbConnect();

      await prisma.rawMaterial.delete({
        where: { id: rawMaterialId },
      });

      return NextResponse.json({
        success: true,
        message: 'Raw material deleted',
      });
    } catch (error) {
      console.error('DELETE /api/raw-materials/[id] error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete raw material' },
        { status: 500 }
      );
    }
  });
}
