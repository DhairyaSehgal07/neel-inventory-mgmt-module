import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const SettingsPage = () => {
  return (
    <div className="space-y-8 p-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage application configuration and preferences
        </p>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Fabric Card */}
        <Link href="/dashboard/settings/fabrics" className="group">
          <Card className="h-40 cursor-pointer transition-all group-hover:shadow-md group-hover:border-primary/50">
            <CardHeader className="flex h-full flex-col justify-center space-y-2">
              <CardTitle className="text-xl">Fabric</CardTitle>
              <CardDescription className="max-w-[90%]">
                Manage fabric types, ratings, and technical specifications.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Raw Material Card */}
        <Link href="/dashboard/settings/raw-materials" className="group">
          <Card className="h-40 cursor-pointer transition-all group-hover:shadow-md group-hover:border-primary/50">
            <CardHeader className="flex h-full flex-col justify-center space-y-2">
              <CardTitle className="text-xl">Raw Material</CardTitle>
              <CardDescription className="max-w-[90%]">
                Configure raw material master data and usage rules.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
};
