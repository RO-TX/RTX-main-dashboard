import { AuthGate } from '@/components/AuthGate';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="relative flex h-screen overflow-hidden bg-background">
        {/* Main background — soft blue-shade gradient (no bg1) */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              'radial-gradient(1100px 650px at 100% 0%, color-mix(in srgb, var(--color-navy-300) 50%, transparent), transparent 55%), radial-gradient(950px 600px at -5% 105%, color-mix(in srgb, var(--color-navy-200) 55%, transparent), transparent 58%), linear-gradient(155deg, var(--color-navy-50) 0%, #e6eef6 55%, var(--color-navy-100) 100%)',
          }}
        />
        <Sidebar />
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <Topbar />
          {/* scrollbar-gutter keeps content from shifting between pages
              (reserves the scrollbar space whether or not it's needed) */}
          <main className="flex-1 overflow-y-auto p-6 [scrollbar-gutter:stable]">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}
