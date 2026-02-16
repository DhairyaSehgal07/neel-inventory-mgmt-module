import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { getBaseUrl } from '@/lib/base-url';

/**
 * GET /api/fabrics/[id]/qrcode
 * Returns a PNG image of the QR code for the fabric's product URL.
 * Encodes NEXT_PUBLIC_API_URL/fabrics/[id]. Public (no auth) so it can be displayed on the product page.
 */
export async function GET(
  request: NextRequest,
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
      select: { id: true },
    });

    if (!fabric) {
      return NextResponse.json(
        { success: false, message: 'Fabric not found' },
        { status: 404 }
      );
    }

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || getBaseUrl(request)).replace(/\/$/, '');
    const productUrl = `${baseUrl}/fabrics/${fabric.id}`;

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
    console.error('GET /api/fabrics/[id]/qrcode error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
