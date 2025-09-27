import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Buscar notificações existentes
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Escutar novas notificações em tempo real
  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications'
        },
        (payload) => {
          const newNotification = payload.new as UserNotification;
          
          // Adicionar à lista
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Mostrar toast para PDFs prontos
          if (newNotification.type === 'pdf_ready') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
            });
          } else if (newNotification.type === 'pdf_error') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: 'destructive',
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}