import { AppSidebar } from '@/components/sidebar/sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/notificacoes/NotificationBell';
import { UserMenu } from '@/components/navbar/UserMenu';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="w-full flex min-h-screen bg-muted p-4 gap-4 bg-white">
        <AppSidebar />

        <main className="flex-1 min-w-0 flex flex-col gap-4">
          <header className="flex items-center justify-between rounded-md border bg-white/70 px-3 py-2">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <section className="flex-1 min-w-0 rounded-md border bg-background p-4">
            {children}
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
}