// WhatsApp Module Hooks Barrel Export

// Vendor hooks (já existentes)
export { useVendorPerformance } from './useVendorPerformance';
export { useVendorQuality } from './useVendorQuality';
export { useVendorQualityAnalysis } from './useVendorQualityAnalysis';
export { useVendorConversations } from './useVendorConversations';
export { useVendorMessages } from './useVendorMessages';
export { useVendorTokenTest } from './useVendorTokenTest';

// Conversation hooks
export { 
  useConversations, 
  useConversation, 
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation 
} from './useConversations';

// Messages hooks
export {
  useMessages,
  useCreateMessage,
  useMarkMessageAsRead,
  useMarkAllMessagesAsRead,
  useDeleteMessage
} from './useMessages';

// Realtime hooks
export {
  useRealtimeConversations,
  useRealtimeMessages,
  useRealtimeSystemEvents
} from './useRealtimeSubscription';

// Conversation actions
export {
  useAssumeConversation,
  useReturnConversationToBot,
  useCloseConversation
} from './useConversationActions';

// Analytics
export {
  useConversationAnalytics,
  useConversationAccessLogs,
  useVendorConversationOverview
} from './useConversationAnalytics';

// Classification
export {
  useClassificationLogs,
  useAddClassificationLog,
  useClassificationStats
} from './useClassificationLogs';

export type { ClassificationLog } from './useClassificationLogs';

export {
  useClassificationKeywords,
  useClassificationKeywordsByCategory,
  useAddKeyword,
  useUpdateKeyword,
  useDeleteKeyword
} from './useClassificationKeywords';

export type { ClassificationKeyword } from './useClassificationKeywords';

// Agent configs
export {
  useAgentConfigs,
  useAgentConfig,
  useCreateAgentConfig,
  useUpdateAgentConfig,
  useDeleteAgentConfig,
  useAgentsByType,
  useSpecialistAgents
} from './useAgentConfigs';

export type { AgentConfig } from './useAgentConfigs';

// Agent prompts
export {
  useAgentPrompt,
  useAgentPrompts,
  useGeneralAgent,
  usePromptVariables,
  useUpdateAgentPrompt,
  useTestPrompt
} from './useAgentPrompts';

// RAG System
export {
  useRAGSearch,
  useKnowledgeFeedback,
  useKnowledgeUsageLog,
  useKnowledgeAnalytics,
  useFAQPatterns,
  useGenerateEmbeddings
} from './useRAGSystem';

export type { RAGSearchResult, KnowledgeFeedback, UsageLogEntry } from './useRAGSystem';

// Semantic Search
export {
  useSemanticSearch,
  useSemanticSearchFiles
} from './useSemanticSearch';

// Knowledge Files
export {
  useKnowledgeFiles,
  useUploadKnowledgeFile,
  useDeleteKnowledgeFile
} from './useKnowledgeFiles';

export type { KnowledgeFile } from './useKnowledgeFiles';

// Firecrawl
export { useFirecrawlScrape } from './useFirecrawl';
