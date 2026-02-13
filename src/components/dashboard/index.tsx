'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const DashboardPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quick Actions</CardTitle>
          <CardDescription>Perform common inventory actions instantly</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button size="lg" className="h-14 gap-2 text-base" onClick={() => setIsOpen(true)}>
              <Plus className="h-5 w-5" />
              Add Commodity
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-14 gap-2 text-base"
              onClick={() => {
                console.log('Remove Commodity clicked');
              }}
            >
              <Minus className="h-5 w-5" />
              Remove Commodity
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Commodity</DialogTitle>
            <DialogDescription>Select the type of commodity you want to add</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <Link href="/fabrics/new" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="h-12 text-base w-full">
                Fabric
              </Button>
            </Link>

            <Link href="/raw-materials/new" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="h-12 text-base w-full">
                Raw Materials
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
