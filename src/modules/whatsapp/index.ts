// WhatsApp Module Main Export
// Note: Routes are handled directly in App.tsx for cleaner architecture

// Bot Components
export { AgentList } from './components/bot/AgentList';
export { FeedbackWidget } from './components/bot/FeedbackWidget';
export { FlowsTab } from './components/bot/FlowsTab';
export { KeywordsTab } from './components/bot/KeywordsTab';
export { KnowledgeBaseManager } from './components/bot/KnowledgeBaseManager';
export { LLMSection } from './components/bot/LLMSection';
export { LLMSelector } from './components/bot/LLMSelector';
export { MasterAgentSection } from './components/bot/MasterAgentSection';
export { MasterConfigTab } from './components/bot/MasterConfigTab';
export { OverviewSection } from './components/bot/OverviewSection';
export { PromptEditor } from './components/bot/PromptEditor';
export { PromptTester } from './components/bot/PromptTester';
export { SemanticSearchTest } from './components/bot/SemanticSearchTest';
export { TestSection } from './components/bot/TestSection';
export { WebScrapingTab } from './components/bot/WebScrapingTab';
export { QuickActionCard } from './components/bot/QuickActionCard';
export { LogEntry } from './components/bot/LogEntry';
export { RuleCard } from './components/bot/RuleCard';
export { StatusCard } from './components/bot/StatusCard';
export { ClassificationLogsSection } from './components/bot/ClassificationLogsSection';
export { ChatSimulator } from './components/bot/ChatSimulator';
export { SpyAgentCard } from './components/bot/SpyAgentCard';
export { StepsEditor } from './components/bot/StepsEditor';
export { ClassificationStats } from './components/bot/ClassificationStats';

// Chat Components
export { ChatHeader } from './components/chat/ChatHeader';
export { CloseConversationDialog } from './components/chat/CloseConversationDialog';
export { ConversationItem } from './components/chat/ConversationItem';
export { ConversationList } from './components/chat/ConversationList';
export { LeadSummaryModal } from './components/chat/LeadSummaryModal';
export { MessageBubble } from './components/chat/MessageBubble';
export { WhatsAppChatArea } from './components/chat/WhatsAppChatArea';
export { WhatsAppConversationItem } from './components/chat/WhatsAppConversationItem';
export { WhatsAppConversationList } from './components/chat/WhatsAppConversationList';
export { WhatsAppMessageBubble } from './components/chat/WhatsAppMessageBubble';
export { MessageList } from './components/chat/MessageList';
export { EmptyState } from './components/chat/EmptyState';
export { ConversationsHeader } from './components/chat/ConversationsHeader';
export { ChatArea } from './components/chat/ChatArea';
export { WhatsAppEmptyState } from './components/chat/WhatsAppEmptyState';
export { MessageInput } from './components/chat/MessageInput';

// Vendor Components
export { AddVendorDialog } from './components/vendor/AddVendorDialog';
export { TokenConfigurationButton } from './components/vendor/TokenConfigurationButton';
export { VendorChatArea } from './components/vendor/VendorChatArea';
export { VendorConversationList } from './components/vendor/VendorConversationList';
export { VendorList } from './components/vendor/VendorList';
export { VendorMessageBubble } from './components/vendor/VendorMessageBubble';
export { VendorQuality } from './components/vendor/VendorQuality';
export { VendorStatusDiagnostic } from './components/vendor/VendorStatusDiagnostic';
export { VendorMessageList } from './components/vendor/VendorMessageList';
export { VendorConversations } from './components/vendor/VendorConversations';

// Atendentes Components
export { AtendenteList } from './components/atendentes/AtendenteList';
export { AddAtendenteDialog } from './components/atendentes/AddAtendenteDialog';

// Hooks
export { useVendorPerformance } from './hooks/useVendorPerformance';
export { useVendorQuality } from './hooks/useVendorQuality';
export { useVendorQualityAnalysis } from './hooks/useVendorQualityAnalysis';
export { useVendorConversations } from './hooks/useVendorConversations';
export { useVendorMessages } from './hooks/useVendorMessages';
export { useVendorTokenTest } from './hooks/useVendorTokenTest';

// Services
export * from './services/whatsapp-business.service';
export * from './services/whatsapp-integration.service';