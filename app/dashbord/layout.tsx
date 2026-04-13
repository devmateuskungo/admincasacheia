import { AppSidebar } from '@/components/sidebar/sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LogoutFloatingButton } from '@/components/LogoutFloatingButton';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="w-full flex min-h-screen bg-muted p-4 gap-4 bg-white">
        <AppSidebar />

        <main className="flex-1 min-w-0 rounded-md border bg-background p-4">
          <SidebarTrigger />
          {children}
        </main>

        <LogoutFloatingButton />
      </div>
    </SidebarProvider>
  );
}