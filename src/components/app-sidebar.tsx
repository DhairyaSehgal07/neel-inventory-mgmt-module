'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Layers, Package } from 'lucide-react';
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

// 🎯 Only keep required items
const navigationItems = [
  {
    name: 'Belts',
    href: '/dashboard/belts',
    icon: Package,
    activePaths: ['/dashboard/belts', '/dashboard/belts/create', '/dashboard/belts/edit'],
  },
  {
    name: 'Compounds',
    href: '/dashboard/compounds',
    icon: Layers,
    activePaths: ['/dashboard/compounds', '/dashboard/compounds/create'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    activePaths: [
      '/dashboard/settings',
      '/dashboard/settings/compounds',
      '/dashboard/settings/fabrics',
      '/dashboard/settings/belts',
    ],
  },
];

const AppSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Image src="/neelkanth.webp" alt="Neelkanth Rubber Mills Logo" width={120} height={120} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Factory Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                // 🚀 Correct multi-route active check
                const isActive =
                  pathname === item.href ||
                  (item.activePaths &&
                    item.activePaths.some((route) => pathname.startsWith(route)));

                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
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
