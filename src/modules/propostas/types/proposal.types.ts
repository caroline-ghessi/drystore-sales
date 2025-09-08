export type ProductType = 'solar' | 'shingle' | 'drywall' | 'steel_frame' | 'ceiling' | 'knauf_ceiling';

export type ProposalStatus = 'draft' | 'generated' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired';

export interface ClientData {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  document?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface ProjectContext {
  id: string;
  conversation_id: string;
  customer_phone: string;
  product_interest: ProductType;
  extracted_data: Record<string, any>;
  summary: string;
  created_at: string;
}

export interface ProposalItem {
  id: string;
  product: ProductType;
  description: string;
  specifications: Record<string, any>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  laborCost?: number;
  materialCost?: number;
}

export interface ProposalData {
  id: string;
  client: ClientData;
  items: ProposalItem[];
  subtotal: number;
  discountPercent: number;
  discountValue: number;
  total: number;
  validityDays: number;
  paymentTerms: string;
  deliveryTime: string;
  notes?: string;
  status: ProposalStatus;
  projectContextId?: string;
  templateId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  productType: ProductType;
  sections: TemplateSection[];
  styling: TemplateStyles;
  isDefault: boolean;
  createdAt: Date;
}

export interface TemplateSection {
  id: string;
  type: 'header' | 'client_info' | 'items' | 'totals' | 'terms' | 'technical' | 'custom';
  title: string;
  content: string;
  order: number;
  isRequired: boolean;
  variables: string[];
}

export interface TemplateStyles {
  primaryColor: string;
  logoUrl?: string;
  fontFamily: string;
  headerStyle: Record<string, any>;
  bodyStyle: Record<string, any>;
}

export interface ProposalFilters {
  search?: string;
  status?: ProposalStatus;
  productType?: ProductType;
  clientName?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  createdBy?: string;
}

export interface ProposalStats {
  total: number;
  byStatus: Record<ProposalStatus, number>;
  byProduct: Record<ProductType, number>;
  averageValue: number;
  conversionRate: number;
  totalValue: number;
}