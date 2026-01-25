'use client';

import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const DashboardPage = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quick Actions</CardTitle>
          <CardDescription>Perform common inventory actions instantly</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              size="lg"
              className="h-14 gap-2 text-base"
              onClick={() => {
                console.log('Add Commodity clicked');
              }}
            >
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
    </div>
  );
};
