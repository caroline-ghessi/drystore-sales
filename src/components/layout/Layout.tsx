import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
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
        <main className="flex-1 overflow-hidden">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}