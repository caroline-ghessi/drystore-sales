import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useRealtimeConversations } from '@/hooks/useRealtimeSubscription';

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Ativar realtime para conversas
  useRealtimeConversations();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <div className="absolute top-4 right-6">
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}