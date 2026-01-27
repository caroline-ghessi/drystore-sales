// Re-export para compatibilidade - Hook movido para módulo WhatsApp
export { useRAGSearch, useKnowledgeFeedback, useKnowledgeUsageLog, useKnowledgeAnalytics, useFAQPatterns, useGenerateEmbeddings } from '@/modules/whatsapp/hooks/useRAGSystem';
export type { RAGSearchResult, KnowledgeFeedback, UsageLogEntry } from '@/modules/whatsapp/hooks/useRAGSystem';
