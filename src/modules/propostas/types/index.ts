// Propostas Module Types - Organizationally Prefixed
export type {
  ProductType,
  ProposalStatus,
  ClientData,
  ProjectContext,
  ProposalItem,
  ProposalData,
  ProposalTemplate,
  TemplateSection,
  TemplateStyles,
  ProposalFilters,
  ProposalStats
} from './proposal.types';

export type {
  BaseCalculationInput,
  SolarCalculationInput,
  SolarCalculationResult,
  SimpleSolarCalculationInput,
  SimpleSolarCalculationResult,
  BatteryBackupInput,
  BatteryBackupResult,
  ShingleCalculationInput,
  ShingleCalculationResult,
  DrywallCalculationInput,
  DrywallCalculationResult,
  SteelFrameCalculationInput,
  SteelFrameCalculationResult,
  CeilingCalculationInput,
  CeilingCalculationResult,
  ForroDrywallCalculationInput,
  ForroDrywallCalculationResult,
  CalculationInput,
  CalculationResult
} from './calculation.types';

// Generation types - now properly exported
export type {
  AIGenerationRequest,
  AIGenerationResult,
  ContextAnalysis,
  PDFGenerationOptions,
  PDFGenerationResult,
  ExportOptions
} from './generation.types';