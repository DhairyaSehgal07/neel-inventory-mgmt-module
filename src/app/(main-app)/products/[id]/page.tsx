import Image from 'next/image';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Props = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const fabricId = parseInt(id, 10);
  if (Number.isNaN(fabricId)) {
    notFound();
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
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fabric #{fabric.id}</h1>
        <p className="text-muted-foreground text-sm">
          Scanned from QR code · Product details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product information</CardTitle>
          <CardDescription>Fabric inventory entry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Date</dt>
              <dd className="mt-1 text-sm">{format(new Date(fabric.date), 'PPP')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Fabric type</dt>
              <dd className="mt-1 text-sm">{fabric.fabricType.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Strength</dt>
              <dd className="mt-1 text-sm">{fabric.fabricStrength.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Width</dt>
              <dd className="mt-1 text-sm">{fabric.fabricWidth.value} m</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Fabric length</dt>
              <dd className="mt-1 text-sm">{fabric.fabricLength} m</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Vendor</dt>
              <dd className="mt-1 text-sm">{fabric.nameOfVendor}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">GSM (observed)</dt>
              <dd className="mt-1 text-sm">{fabric.gsmObserved}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">GSM (calculated)</dt>
              <dd className="mt-1 text-sm">{fabric.gsmCalculated}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Net weight</dt>
              <dd className="mt-1 text-sm">{fabric.netWeight} kg</dd>
            </div>
          </dl>
          {fabric.qrCode ? (
            <div className="mt-6 pt-6 border-t">
              <dt className="text-sm font-medium text-muted-foreground mb-2">QR code</dt>
              <p className="text-xs text-muted-foreground mb-2">
                Scan to open this product page
              </p>
              <Image
                src={`/api/fabrics/${fabric.id}/qrcode`}
                alt="Product QR code"
                width={256}
                height={256}
                unoptimized
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
