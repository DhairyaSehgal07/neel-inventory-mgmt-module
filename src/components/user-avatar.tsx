'use client';

import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserAvatar() {
  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name || 'User';

  // Get user initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Avatar className="h-9 w-9">
      <AvatarImage src="https://github.com/shadcn.png" alt={userName} />
      <AvatarFallback>{getInitials(userName)}</AvatarFallback>
    </Avatar>
  );
}
