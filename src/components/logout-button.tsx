'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogoutButtonProps {
  variant?: 'button' | 'dropdown';
  className?: string;
}

export function LogoutButton({ variant = 'button', className }: LogoutButtonProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/sign-in' });
  };

  if (variant === 'dropdown') {
    return (
      <Button
        variant="ghost"
        className={cn('w-full justify-start', className)}
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" className={className} onClick={handleSignOut}>
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
}
