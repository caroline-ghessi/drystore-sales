// CRM Hooks Barrel Export
export { useLeadAnalytics } from './useLeadAnalytics';
export { useHotLeads, useHotLeadsStats } from './useHotLeads';
export { useGenerateLeadSummary, useSendLeadToVendor, useVendors, useLeadDistributions } from './useLeadSummary';
export { useRealQualityMetrics } from './useRealQualityMetrics';
export { useOpportunities, useUpdateOpportunityStage, useOpportunitiesCount, STAGE_CONFIG } from './useOpportunities';
export { usePipelineStats, formatCurrency, formatFullCurrency } from './usePipelineStats';

// Re-export types
export type { HotLead } from './useHotLeads';
export type { LeadSummaryData } from './useLeadSummary';
export type { Opportunity, OpportunitiesByStage } from './useOpportunities';
