'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, FlaskConical, Layers } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const fabricSubItems = [
  { name: 'Overview', href: '/fabrics' },
  { name: 'Analytics', href: '/analytics/fabrics' },
  { name: 'Settings', href: '/settings/fabrics' },
] as const;

const compoundSubItems = [
  { name: 'Overview', href: '/compounds' },
  { name: 'Analytics', href: '/analytics/compounds' },
  { name: 'Settings', href: '/settings/compounds' },
] as const;

function isInFabricNavSection(pathname: string) {
  return (
    pathname.startsWith('/fabrics') ||
    pathname.startsWith('/analytics/fabrics') ||
    pathname.startsWith('/settings/fabrics')
  );
}

function isInCompoundNavSection(pathname: string) {
  return (
    pathname.startsWith('/compounds') ||
    pathname.startsWith('/analytics/compounds') ||
    pathname.startsWith('/settings/compounds')
  );
}

function isFabricSubActive(pathname: string, href: string) {
  if (href === '/fabrics') return pathname.startsWith('/fabrics');
  return pathname.startsWith(href);
}

function isCompoundSubActive(pathname: string, href: string) {
  if (href === '/compounds') return pathname.startsWith('/compounds');
  if (href === '/settings/compounds') return pathname.startsWith('/settings/compounds');
  return pathname.startsWith(href);
}

const AppSidebar = () => {
  const pathname = usePathname();
  const [fabricsOpen, setFabricsOpen] = React.useState(() =>
    isInFabricNavSection(pathname)
  );
  const [compoundsOpen, setCompoundsOpen] = React.useState(() =>
    isInCompoundNavSection(pathname)
  );

  React.useEffect(() => {
    if (isInFabricNavSection(pathname)) setFabricsOpen(true);
  }, [pathname]);

  React.useEffect(() => {
    if (isInCompoundNavSection(pathname)) setCompoundsOpen(true);
  }, [pathname]);

  const fabricsSectionActive = isInFabricNavSection(pathname);
  const compoundsSectionActive = isInCompoundNavSection(pathname);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <Image src="/neelkanth.webp" alt="Logo" width={120} height={120} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  onClick={() => setFabricsOpen((o) => !o)}
                  isActive={fabricsSectionActive}
                  tooltip="Fabrics"
                  className="cursor-pointer"
                >
                  <Layers className="h-4 w-4" />
                  <span>Fabrics</span>
                  <ChevronRight
                    className={cn(
                      'ml-auto size-4 shrink-0 transition-transform',
                      fabricsOpen && 'rotate-90'
                    )}
                  />
                </SidebarMenuButton>
                {fabricsOpen ? (
                  <SidebarMenuSub>
                    {fabricSubItems.map((sub) => (
                      <SidebarMenuSubItem key={sub.href}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isFabricSubActive(pathname, sub.href)}
                          size="md"
                        >
                          <Link href={sub.href}>
                            <span>{sub.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  onClick={() => setCompoundsOpen((o) => !o)}
                  isActive={compoundsSectionActive}
                  tooltip="Compounds"
                  className="cursor-pointer"
                >
                  <FlaskConical className="h-4 w-4" />
                  <span>Compounds</span>
                  <ChevronRight
                    className={cn(
                      'ml-auto size-4 shrink-0 transition-transform',
                      compoundsOpen && 'rotate-90'
                    )}
                  />
                </SidebarMenuButton>
                {compoundsOpen ? (
                  <SidebarMenuSub>
                    {compoundSubItems.map((sub) => (
                      <SidebarMenuSubItem key={`compound-${sub.href}-${sub.name}`}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isCompoundSubActive(pathname, sub.href)}
                          size="md"
                        >
                          <Link href={sub.href}>
                            <span>{sub.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
