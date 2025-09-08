// Propostas Module - Main entry point
export { ProposalGenerator } from './components/generator/ProposalGenerator';
export { default as ProposalsListPage } from './pages/ProposalsListPage';
export { default as SavedCalculationsPage } from './pages/SavedCalculationsPage';

// Hooks
export { useAIGeneration } from './hooks/useAIGeneration';
export { useProposalCalculator } from './hooks/useProposalCalculator';
export { useSavedCalculations } from './hooks/useSavedCalculations';

// Types
export * from './types';

// Components
export { SolarCalculator } from './components/calculator/SolarCalculator';
export { ShingleCalculator } from './components/calculator/ShingleCalculator';
export { DrywallCalculator } from './components/calculator/DrywallCalculator';
export { ForroDrywallCalculator } from './components/calculator/ForroDrywallCalculator';