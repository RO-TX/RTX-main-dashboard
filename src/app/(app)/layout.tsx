import { AuthGate } from '@/components/AuthGate';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          {/* scrollbar-gutter keeps content from shifting between pages
              (reserves the scrollbar space whether or not it's needed) */}
          <main className="flex-1 overflow-y-auto p-6 [scrollbar-gutter:stable]">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}
