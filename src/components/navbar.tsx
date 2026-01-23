'use client';

import { User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoutButton } from './logout-button';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from './ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserAvatar } from './user-avatar';

function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3 py-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex flex-col space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    );
  }

  const user = session?.user;
  const userName = user?.name || 'User';
  const userRole = user?.role || 'User';
  const mobileNumber = user?.mobileNumber || '';

  // Format mobile number with country code
  const formatMobileNumber = (mobile: string) => {
    if (!mobile) return '';
    if (mobile.startsWith('91')) {
      return `🇮🇳 +91 ${mobile.slice(2)}`;
    }
    return `🇮🇳 +91 ${mobile}`;
  };

  return (
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel>
        <div className="flex items-center gap-3 py-2">
          <UserAvatar />
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
            {mobileNumber && (
              <p className="text-xs text-muted-foreground">{formatMobileNumber(mobileNumber)}</p>
            )}
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <User className="mr-2 h-4 w-4" />
        <span>Profile</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <LogoutButton variant="dropdown" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();

  const userName = session?.user?.name || 'User';

  return (
    <nav className="sticky top-0 z-40 bg-background shadow-sm border-b border-border">
      <div className="px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Sidebar Trigger and Page Header */}
        <div className="flex items-center">
          <SidebarTrigger />
          <div className="ml-2 md:ml-6 md:pl-6 border-l border-border">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {status === 'loading' ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <span className="text-sm text-muted-foreground">Welcome, {userName}</span>
          )}
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <UserAvatar />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <UserMenu />
          </DropdownMenu>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <UserAvatar />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <UserMenu />
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
