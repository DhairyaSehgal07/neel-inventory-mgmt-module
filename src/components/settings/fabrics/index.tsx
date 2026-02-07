import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const FabricSettingsPage = () => {
  return (
    <div className="space-y-8 p-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Fabric Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure fabric-related master data
        </p>
      </div>

      {/* Fabric Settings Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Fabric Type */}
        <Link href="/dashboard/settings/fabrics/types" className="group">
          <Card className="h-40 cursor-pointer transition-all group-hover:shadow-md group-hover:border-primary/50">
            <CardHeader className="flex h-full flex-col justify-center space-y-2">
              <CardTitle className="text-xl">Fabric Type</CardTitle>
              <CardDescription>
                Define and manage available fabric categories.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Strength */}
        <Link href="/settings/fabrics/strength" className="group">
          <Card className="h-40 cursor-pointer transition-all group-hover:shadow-md group-hover:border-primary/50">
            <CardHeader className="flex h-full flex-col justify-center space-y-2">
              <CardTitle className="text-xl">Strength</CardTitle>
              <CardDescription>
                Maintain fabric strength ratings and standards.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Width */}
        <Link href="/settings/fabrics/width" className="group">
          <Card className="h-40 cursor-pointer transition-all group-hover:shadow-md group-hover:border-primary/50">
            <CardHeader className="flex h-full flex-col justify-center space-y-2">
              <CardTitle className="text-xl">Width</CardTitle>
              <CardDescription>
                Configure supported fabric widths and limits.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
};
