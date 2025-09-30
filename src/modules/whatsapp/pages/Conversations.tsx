import { useState } from 'react';
import { WhatsAppConversationList } from '@/modules/whatsapp/components/chat/WhatsAppConversationList';
import { WhatsAppChatArea } from '@/modules/whatsapp/components/chat/WhatsAppChatArea';
import { WhatsAppEmptyState } from '@/modules/whatsapp/components/chat/WhatsAppEmptyState';
import { ConversationsHeader } from '@/modules/whatsapp/components/chat/ConversationsHeader';
import { useRealtimeConversations } from '@/hooks/useRealtimeSubscription';
import { useBufferWorker } from '@/hooks/useBufferWorker';

export function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Enable realtime updates for conversations list
  useRealtimeConversations();
  
  // Enable buffer worker to process messages every 60 seconds
  useBufferWorker();

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