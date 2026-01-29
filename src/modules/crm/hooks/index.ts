// CRM Hooks Barrel Export
export { useLeadAnalytics } from './useLeadAnalytics';
export { useHotLeads, useHotLeadsStats } from './useHotLeads';
export { useGenerateLeadSummary, useSendLeadToVendor, useVendors, useLeadDistributions } from './useLeadSummary';
export { useRealQualityMetrics } from './useRealQualityMetrics';
export { useOpportunities, useUpdateOpportunityStage, useOpportunitiesCount, useDeleteOpportunity, STAGE_CONFIG } from './useOpportunities';
export { usePipelineStats, formatCurrency, formatFullCurrency } from './usePipelineStats';
export { useOpportunityDetail, useUpdateOpportunity, useConversationMessages } from './useOpportunityDetail';

// CRM Agent Hooks
export { 
  useCRMAgentConfigs, 
  useCRMAgentConfig, 
  useCreateCRMAgent, 
  useUpdateCRMAgent, 
  useToggleCRMAgentStatus, 
  useDeleteCRMAgent,
  CRM_AGENT_DEFINITIONS,
} from './useCRMAgentConfigs';
export { 
  useOpportunityExtractions, 
  useLatestExtractionByType, 
  useLatestExtractionsMap, 
  useAgentMetrics,
  useProcessOpportunityWithAgents,
} from './useCRMAgentExtractions';

// Re-export types
export type { HotLead } from './useHotLeads';
export type { LeadSummaryData } from './useLeadSummary';
export type { Opportunity, OpportunitiesByStage } from './useOpportunities';
export type { OpportunityDetail } from './useOpportunityDetail';
export type { CRMAgentConfig, CRMAgentConfigInput } from './useCRMAgentConfigs';
export type { CRMAgentExtraction, AgentType } from './useCRMAgentExtractions';
