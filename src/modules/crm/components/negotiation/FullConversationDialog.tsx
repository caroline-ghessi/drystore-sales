import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User } from 'lucide-react';
import { VendorMessageBubble } from '@/modules/whatsapp/components/vendor/VendorMessageBubble';
import { useVendorMessages } from '@/modules/whatsapp/hooks/useVendorMessages';
import { useConversationMessages } from '../../hooks/useOpportunityDetail';

interface FullConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorConversationId: number | null | undefined;
  conversationId: string | null | undefined;
  customerName?: string;
  vendorName?: string;
}

export function FullConversationDialog({
  open,
  onOpenChange,
  vendorConversationId,
  conversationId,
  customerName,
  vendorName,
}: FullConversationDialogProps) {
  // Fetch vendor messages (up to 200)
  const { data: vendorMessages, isLoading: loadingVendor } = useVendorMessages(
    vendorConversationId || 0,
    false // Disable real-time for dialog
  );

  // Fetch bot messages
  const { data: botMessages, isLoading: loadingBot } = useConversationMessages(conversationId);

  const isLoading = loadingVendor || loadingBot;

  // Normalize and combine messages from both sources
  const allMessages = useMemo(() => {
    // Normalize vendor messages (already in correct format for VendorMessageBubble)
    const normalizedVendorMessages = (vendorMessages || []).map((msg) => ({
      ...msg,
      source: 'vendor' as const,
      sortTimestamp: new Date(msg.timestamp_whatsapp || msg.created_at || 0).getTime(),
    }));

    // Normalize bot messages to match VendorMessageBubble format
    const normalizedBotMessages = (botMessages || []).map((msg) => ({
      id: msg.id,
      content: msg.content,
      from_me: msg.sender_type !== 'customer',
      from_name: msg.sender_type === 'customer' ? customerName : 'Bot',
      timestamp_whatsapp: msg.created_at,
      created_at: msg.created_at,
      message_type: 'text',
      status: 'delivered',
      source: 'bot' as const,
      sortTimestamp: new Date(msg.created_at || 0).getTime(),
    }));

    // Combine and sort by timestamp (ascending = chronological)
    return [...normalizedVendorMessages, ...normalizedBotMessages].sort(
      (a, b) => a.sortTimestamp - b.sortTimestamp
    );
  }, [vendorMessages, botMessages, customerName]);

  const hasMessages = allMessages.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Conversa com {customerName || 'Cliente'}
          </DialogTitle>
          {vendorName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Vendedor: {vendorName}</span>
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-16 bg-muted animate-pulse rounded-lg ${
                    i % 2 === 0 ? 'ml-auto w-3/4' : 'w-3/4'
                  }`}
                />
              ))}
            </div>
          ) : hasMessages ? (
            <div className="py-4 space-y-1">
              {allMessages.map((message, index) => (
                <div key={`${message.source}-${message.id || index}`}>
                  <VendorMessageBubble message={message} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mensagem encontrada.</p>
            </div>
          )}
        </ScrollArea>

        {hasMessages && (
          <div className="pt-2 border-t text-center">
            <Badge variant="secondary" className="text-xs">
              Total: {allMessages.length} mensagens
            </Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
