import { useState } from 'react';
import { WhatsAppConversationList } from '@/modules/whatsapp/components/chat/WhatsAppConversationList';
import { WhatsAppChatArea } from '@/modules/whatsapp/components/chat/WhatsAppChatArea';
import { WhatsAppEmptyState } from '@/modules/whatsapp/components/chat/WhatsAppEmptyState';
import { ConversationsHeader } from '@/modules/whatsapp/components/chat/ConversationsHeader';
import { useRealtimeConversations } from '@/hooks/useRealtimeSubscription';

export function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Enable realtime updates for conversations list
  useRealtimeConversations();

  return (
    <div className="flex h-full bg-background overflow-hidden">
      <WhatsAppConversationList 
        onSelect={setSelectedConversationId}
        selectedId={selectedConversationId}
      />
      
      {selectedConversationId ? (
        <WhatsAppChatArea conversationId={selectedConversationId} />
      ) : (
        <WhatsAppEmptyState />
      )}
    </div>
  );
}