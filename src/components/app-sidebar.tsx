'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, FlaskConical, Layers, Package, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';
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
  SidebarMenuAction,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const fabricSubItems = [
  { name: 'Overview', href: '/fabrics' },
  { name: 'Analytics', href: '/analytics/fabrics' },
  { name: 'Settings', href: '/settings/fabrics' },
] as const;

const rawMaterialSubItems = [
  { name: 'Overview', href: '/raw-materials' },
  { name: 'Analytics', href: '/analytics/raw-materials' },
  { name: 'Settings', href: '/settings/raw-materials' },
] as const;

function isInRawMaterialNavSection(pathname: string) {
  return (
    pathname.startsWith('/raw-materials') ||
    pathname.startsWith('/analytics/raw-materials') ||
    pathname.startsWith('/settings/raw-materials')
  );
}

function isRawMaterialSubActive(pathname: string, href: string) {
  if (href === '/raw-materials') {
    return (
      pathname.startsWith('/raw-materials') && !pathname.startsWith('/analytics/raw-materials')
    );
  }
  return pathname.startsWith(href);
}

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
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'Admin';
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

  const [rawMaterialsOpen, setRawMaterialsOpen] = React.useState(() =>
    isInRawMaterialNavSection(pathname)
  );

  React.useEffect(() => {
    if (isInRawMaterialNavSection(pathname)) setRawMaterialsOpen(true);
  }, [pathname]);

  const rawMaterialsSectionActive = isInRawMaterialNavSection(pathname);

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
                  asChild
                  isActive={fabricsSectionActive}
                  tooltip="Fabrics"
                >
                  <Link href="/fabrics" onClick={() => setFabricsOpen(true)}>
                    <Layers className="h-4 w-4" />
                    <span>Fabrics</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuAction
                  type="button"
                  onClick={() => setFabricsOpen((o) => !o)}
                  aria-label={fabricsOpen ? 'Collapse Fabrics menu' : 'Expand Fabrics menu'}
                  aria-expanded={fabricsOpen}
                >
                  <ChevronRight
                    className={cn(
                      'size-4 transition-transform',
                      fabricsOpen && 'rotate-90'
                    )}
                  />
                </SidebarMenuAction>
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
                  asChild
                  isActive={compoundsSectionActive}
                  tooltip="Compounds"
                >
                  <Link href="/compounds" onClick={() => setCompoundsOpen(true)}>
                    <FlaskConical className="h-4 w-4" />
                    <span>Compounds</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuAction
                  type="button"
                  onClick={() => setCompoundsOpen((o) => !o)}
                  aria-label={compoundsOpen ? 'Collapse Compounds menu' : 'Expand Compounds menu'}
                  aria-expanded={compoundsOpen}
                >
                  <ChevronRight
                    className={cn(
                      'size-4 transition-transform',
                      compoundsOpen && 'rotate-90'
                    )}
                  />
                </SidebarMenuAction>
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={rawMaterialsSectionActive}
                  tooltip="Raw materials"
                >
                  <Link href="/raw-materials" onClick={() => setRawMaterialsOpen(true)}>
                    <Package className="h-4 w-4" />
                    <span>Raw materials</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuAction
                  type="button"
                  onClick={() => setRawMaterialsOpen((o) => !o)}
                  aria-label={
                    rawMaterialsOpen ? 'Collapse Raw materials menu' : 'Expand Raw materials menu'
                  }
                  aria-expanded={rawMaterialsOpen}
                >
                  <ChevronRight
                    className={cn(
                      'size-4 transition-transform',
                      rawMaterialsOpen && 'rotate-90'
                    )}
                  />
                </SidebarMenuAction>
                {rawMaterialsOpen ? (
                  <SidebarMenuSub>
                    {rawMaterialSubItems.map((sub) => (
                      <SidebarMenuSubItem key={`rm-${sub.href}-${sub.name}`}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isRawMaterialSubActive(pathname, sub.href)}
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
              {isAdmin ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin-panel')}
                    tooltip="Admin Panel"
                  >
                    <Link href="/admin-panel">
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
