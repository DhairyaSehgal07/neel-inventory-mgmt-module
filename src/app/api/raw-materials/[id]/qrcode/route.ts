import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { getBaseUrl } from '@/lib/base-url';

/**
 * GET /api/raw-materials/[id]/qrcode
 * Returns a PNG QR for the raw material detail URL. Public for label printing / scanning.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      select: { id: true },
    });

    if (!row) {
      return NextResponse.json(
        { success: false, message: 'Raw material not found' },
        { status: 404 }
      );
    }

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || getBaseUrl(request)).replace(/\/$/, '');
    const productUrl = `${baseUrl}/raw-materials/${row.id}`;

    const dataUrl = await QRCode.toDataURL(productUrl, {
      type: 'image/png',
      margin: 2,
      width: 256,
    });
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('GET /api/raw-materials/[id]/qrcode error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
