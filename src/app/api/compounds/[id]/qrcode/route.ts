import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { getBaseUrl } from '@/lib/base-url';

/**
 * GET /api/compounds/[id]/qrcode
 * Returns a PNG image of the QR code for the compound detail URL.
 * Encodes NEXT_PUBLIC_API_URL/compounds/[id]. Public (no auth) so it can be displayed on the product page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      select: { id: true },
    });

    if (!compound) {
      return NextResponse.json(
        { success: false, message: 'Compound not found' },
        { status: 404 }
      );
    }

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || getBaseUrl(request)).replace(/\/$/, '');
    const productUrl = `${baseUrl}/compounds/${compound.id}`;

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
    console.error('GET /api/compounds/[id]/qrcode error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
