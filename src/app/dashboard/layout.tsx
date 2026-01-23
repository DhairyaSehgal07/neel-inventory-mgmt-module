import Navbar from '@/components/navbar';
import AppSidebar from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default async function StoreAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        <div className="md:p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
