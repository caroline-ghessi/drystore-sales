// Propostas Module - Main entry point
export { ProposalGenerator } from './components/generator/ProposalGenerator';
export { default as ProposalsListPage } from './pages/ProposalsListPage';
export { default as SavedCalculationsPage } from './pages/SavedCalculationsPage';

// Template Components
export { TemplateManager, TemplateCard, TemplateDetailModal, TemplatePreview } from './components/templates';

// Admin Pages
export { AdminLayout, MetasPage, ApprovacoesPage } from './pages/admin';

// Hooks
export { useAIGeneration } from './hooks/useAIGeneration';
export { useProposalCalculator } from './hooks/useProposalCalculator';
export { useSavedCalculations } from './hooks/useSavedCalculations';
export { useProductTemplate, useAllProductTemplates, useTemplatePreview } from './hooks/useProductTemplates';

// Services
export { ProductTemplateService } from './services/product-templates.service';
export { TemplateRendererService } from './services/template-renderer.service';

// Types
export * from './types';

// Components
export { SolarCalculator } from './components/calculator/SolarCalculator';
export { DrystoreShingleCalculator } from './components/calculator/ShingleCalculator';
export { ForroDrywallCalculator } from './components/calculator/ForroDrywallCalculator';
export { WaterproofingMapeiCalculator } from './components/calculator/WaterproofingMapeiCalculator';
export { FloorPreparationMapeiCalculator } from './components/calculator/FloorPreparationMapeiCalculator';