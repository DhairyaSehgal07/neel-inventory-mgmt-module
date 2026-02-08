import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';

/**
 * GET /api/fabrics/[id]
 * Get a fabric by id. Public (no auth) so QR scan can open product page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fabricId = parseInt(id, 10);
    if (Number.isNaN(fabricId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid fabric id' },
        { status: 400 }
      );
    }

    await dbConnect();

    const fabric = await prisma.fabric.findUnique({
      where: { id: fabricId },
      include: {
        fabricType: true,
        fabricStrength: true,
        fabricWidth: true,
      },
    });

    if (!fabric) {
      return NextResponse.json(
        { success: false, message: 'Fabric not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: fabric });
  } catch (error) {
    console.error('GET /api/fabrics/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch fabric' },
      { status: 500 }
    );
  }
}
