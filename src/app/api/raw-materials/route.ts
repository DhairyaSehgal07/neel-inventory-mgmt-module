import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';
import { createRawMaterialSchema } from '@/schemas/rawMaterialSchema';
import { deriveRawMaterialDisplayStatus } from '@/lib/rawMaterialDisplay';

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

const BAG_TOLERANCE = 1e-6;

function computeBagWeights(
  purchasedBags: number,
  availableBags: number,
  weightPerUnit: number
): { ok: true; purchasedWeightKg: number; availableWeightKg: number } | { ok: false; message: string } {
  if (availableBags - purchasedBags > BAG_TOLERANCE) {
    return {
      ok: false,
      message: 'Available bags cannot exceed purchased bags',
    };
  }
  return {
    ok: true,
    purchasedWeightKg: purchasedBags * weightPerUnit,
    availableWeightKg: availableBags * weightPerUnit,
  };
}

/**
 * GET /api/raw-materials
 * Requires RAW_MATERIAL_BATCH_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.RAW_MATERIAL_BATCH_VIEW, async () => {
    try {
      await dbConnect();
      const items = await prisma.rawMaterial.findMany({
        orderBy: { date: 'desc' },
      });
      const data = items.map((item) => ({
        ...item,
        status: deriveRawMaterialDisplayStatus(item),
      }));
      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('GET /api/raw-materials error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to list raw materials' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/raw-materials
 * Requires RAW_MATERIAL_BATCH_CREATE.
 */
export async function POST(request: NextRequest) {
  return withRBAC(request, Permission.RAW_MATERIAL_BATCH_CREATE, async () => {
    try {
      const body = await request.json();
      const parsed = createRawMaterialSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.flatten().fieldErrors
          ? Object.values(parsed.error.flatten().fieldErrors).flat().join(', ')
          : 'Validation failed';
        return NextResponse.json({ success: false, message }, { status: 400 });
      }

      const d = parsed.data;
      const purchasedBags = d.purchasedBags ?? 0;
      const availableBags = d.availableBags !== undefined ? d.availableBags : purchasedBags;
      const weights = computeBagWeights(purchasedBags, availableBags, d.weightPerUnit);
      if (!weights.ok) {
        return NextResponse.json({ success: false, message: weights.message }, { status: 400 });
      }

      await dbConnect();

      const created = await prisma.rawMaterial.create({
        data: {
          materialCode: d.materialCode,
          date: new Date(d.date),
          createdBy: d.createdBy,
          rawMaterial: d.rawMaterial,
          grade: d.grade ?? undefined,
          vendor: d.vendor ?? undefined,
          units: d.units,
          weightPerUnit: d.weightPerUnit,
          purchasedBags,
          availableBags,
          purchasedWeightKg: weights.purchasedWeightKg,
          availableWeightKg: weights.availableWeightKg,
          location: d.location ?? undefined,
          status: d.status ?? undefined,
        },
      });

      return NextResponse.json({
        success: true,
        data: created,
        message: 'Raw material created',
      });
    } catch (error: unknown) {
      console.error('POST /api/raw-materials error:', error);

      let message = 'Failed to create raw material';
      let status = 500;

      if (isPrismaKnownRequestError(error)) {
        switch (error.code) {
          case 'P2002': {
            const target = error.meta?.target;
            const field = Array.isArray(target) ? target.join(', ') : 'materialCode';
            message = field.includes('materialCode')
              ? 'A raw material with this code already exists'
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

      return NextResponse.json({ success: false, message }, { status });
    }
  });
}
