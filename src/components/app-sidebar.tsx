'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Circle, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from '@/components/ui/sidebar';
import Image from 'next/image';

// ✅ Updated navigation items
const navigationItems = [
  {
    name: 'item1',
    href: '/item1',
    icon: Circle,
  },
  {
    name: 'item2',
    href: '/item2',
    icon: Circle,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

const AppSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Image src="/neelkanth.webp" alt="Logo" width={120} height={120} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
