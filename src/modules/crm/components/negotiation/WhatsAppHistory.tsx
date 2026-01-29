import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { WhatsAppMessage } from './WhatsAppMessage';
import { useConversationMessages, useVendorConversationMessages } from '../../hooks/useOpportunityDetail';

interface WhatsAppHistoryProps {
  conversationId: string | null | undefined;
  vendorConversationId: number | null | undefined;
}

export function WhatsAppHistory({ conversationId, vendorConversationId }: WhatsAppHistoryProps) {
  const { data: botMessages, isLoading: loadingBot } = useConversationMessages(conversationId);
  const { data: vendorMessages, isLoading: loadingVendor } = useVendorConversationMessages(vendorConversationId);

  const isLoading = loadingBot || loadingVendor;
  const hasAnySource = conversationId || vendorConversationId;

  // Normalize and combine messages from both sources
  const allMessages = useMemo(() => {
    const normalizedBotMessages = (botMessages || []).map((msg) => ({
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      isFromCustomer: msg.sender_type === 'customer',
      source: 'bot' as const,
    }));

    const normalizedVendorMessages = (vendorMessages || []).map((msg) => ({
      id: String(msg.id),
      content: msg.content,
      created_at: msg.created_at,
      isFromCustomer: !msg.from_me,
      source: 'vendor' as const,
    }));

    return [...normalizedBotMessages, ...normalizedVendorMessages].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
  }, [botMessages, vendorMessages]);

  if (!hasAnySource) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Histórico WhatsApp
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma conversa vinculada a esta negociação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Histórico WhatsApp
          </CardTitle>
          <Button variant="link" size="sm" className="gap-1 text-primary">
            Ver Conversa Completa
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : allMessages.length > 0 ? (
          <div className="space-y-1">
            {allMessages.map((message) => (
              <WhatsAppMessage
                key={message.id}
                content={message.content}
                timestamp={new Date(message.created_at || Date.now())}
                isFromCustomer={message.isFromCustomer}
                hasAvatar={message.isFromCustomer}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma mensagem encontrada.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
