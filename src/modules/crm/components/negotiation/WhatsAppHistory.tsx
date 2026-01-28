import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { WhatsAppMessage } from './WhatsAppMessage';
import { useConversationMessages } from '../../hooks/useOpportunityDetail';

interface WhatsAppHistoryProps {
  conversationId: string | null | undefined;
}

export function WhatsAppHistory({ conversationId }: WhatsAppHistoryProps) {
  const { data: messages, isLoading } = useConversationMessages(conversationId);

  if (!conversationId) {
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
        ) : messages && messages.length > 0 ? (
          <div className="space-y-1">
            {[...messages].reverse().map((message) => (
              <WhatsAppMessage
                key={message.id}
                content={message.content}
                timestamp={new Date(message.created_at || Date.now())}
                isFromCustomer={message.sender_type === 'customer'}
                hasAvatar={message.sender_type === 'customer'}
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
