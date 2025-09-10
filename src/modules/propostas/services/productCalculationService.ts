import { UnifiedProduct } from '../hooks/useUnifiedProducts';

export interface ProductCalculationSpecs {
  // Rendimentos e características técnicas
  coverage_area?: number;  // m² por unidade/pacote/rolo
  yield_per_unit?: number; // Rendimento específico
  efficiency?: number;     // Eficiência (0-1)
  power_rating?: number;   // Potência (kW, W)
  capacity?: number;       // Capacidade (kWh, Ah)
  voltage?: number;        // Voltagem
  dimensions?: {
    width?: number;
    height?: number; 
    depth?: number;
    weight?: number;
  };
  // Características específicas por produto
  installation_factor?: number; // Fator de instalação/perda
  regional_multiplier?: number; // Multiplicador regional
  compatibility?: string[];     // Produtos compatíveis
}

export class ProductCalculationService {
  /**
   * Busca produto por código específico
   */
  static findProductByCode(products: UnifiedProduct[], code: string): UnifiedProduct | null {
    return products.find(p => p.code === code && p.is_active) || null;
  }

  /**
   * Busca produtos por categoria e critério
   */
  static findProductsByCategory(
    products: UnifiedProduct[], 
    category: string,
    subcategory?: string
  ): UnifiedProduct[] {
    return products.filter(p => {
      const matchesCategory = p.category === category;
      const matchesSubcategory = !subcategory || p.subcategory === subcategory;
      return matchesCategory && matchesSubcategory && p.is_active;
    });
  }

  /**
   * Extrai especificações técnicas do produto
   */
  static getProductSpecs(product: UnifiedProduct): ProductCalculationSpecs {
    if (!product.specifications) return {};
    
    try {
      return typeof product.specifications === 'string' 
        ? JSON.parse(product.specifications)
        : product.specifications;
    } catch {
      return {};
    }
  }

  /**
   * Calcula quantidade necessária baseado no rendimento do produto
   */
  static calculateQuantityFromSpecs(
    totalArea: number,
    product: UnifiedProduct,
    wasteFactor: number = 1.0
  ): number {
    const specs = this.getProductSpecs(product);
    const coverage = specs.coverage_area || specs.yield_per_unit || 1;
    const adjustedArea = totalArea * wasteFactor;
    
    return Math.ceil(adjustedArea / coverage);
  }

  /**
   * Valida se produto possui especificações mínimas necessárias
   */
  static validateProductSpecs(
    product: UnifiedProduct, 
    requiredSpecs: (keyof ProductCalculationSpecs)[]
  ): { isValid: boolean; missingSpecs: string[] } {
    const specs = this.getProductSpecs(product);
    const missingSpecs: string[] = [];
    
    requiredSpecs.forEach(spec => {
      if (specs[spec] === undefined) {
        missingSpecs.push(spec);
      }
    });
    
    return {
      isValid: missingSpecs.length === 0,
      missingSpecs
    };
  }

  /**
   * Busca produtos específicos para cada calculadora
   */
  static getShingleProducts(products: UnifiedProduct[]) {
    return {
      shingles: this.findProductsByCategory(products, 'telha_shingle', 'telha'),
      osb: this.findProductsByCategory(products, 'telha_shingle', 'osb'),
      underlayment: this.findProductByCode(products, 'SH-RHI-87'), // RhinoRoof específico
      ridgeCap: this.findProductsByCategory(products, 'telha_shingle', 'cumeeira'),
      accessories: this.findProductsByCategory(products, 'telha_shingle', 'acessorio')
    };
  }

  static getSolarProducts(products: UnifiedProduct[]) {
    const solarProducts = this.findProductsByCategory(products, 'energia_solar');
    return {
      panels: solarProducts.filter(p => 
        p.solar_category === 'panel' || p.subcategory === 'painel'
      ),
      inverters: solarProducts.filter(p => 
        p.solar_category === 'inverter' || p.subcategory === 'inversor'
      ),
      batteries: solarProducts.filter(p => 
        p.solar_category === 'battery' || p.subcategory === 'bateria'
      ),
      structure: solarProducts.filter(p => p.subcategory === 'estrutura'),
      cables: solarProducts.filter(p => p.subcategory === 'cabo')
    };
  }

  static getBatteryProducts(products: UnifiedProduct[]) {
    return {
      batteries: this.findProductsByCategory(products, 'battery_backup').filter(p => 
        p.solar_category === 'battery' || p.subcategory === 'bateria'
      ),
      inverters: this.findProductsByCategory(products, 'battery_backup', 'inversor'),
      protection: this.findProductsByCategory(products, 'battery_backup', 'protecao'),
      monitoring: this.findProductsByCategory(products, 'battery_backup', 'monitoramento')
    };
  }

  static getDrywallProducts(products: UnifiedProduct[]) {
    return {
      profiles: this.findProductsByCategory(products, 'drywall_divisorias', 'perfil'),
      plates: this.findProductsByCategory(products, 'drywall_divisorias', 'placa'),
      insulation: this.findProductsByCategory(products, 'drywall_divisorias', 'isolamento'),
      screws: this.findProductsByCategory(products, 'drywall_divisorias', 'parafuso'),
      accessories: this.findProductsByCategory(products, 'drywall_divisorias', 'acessorio')
    };
  }

  /**
   * Calcula custo total baseado em produtos reais
   */
  static calculateProductCosts(
    quantities: { [productId: string]: number },
    products: UnifiedProduct[]
  ): { [productId: string]: number } {
    const costs: { [productId: string]: number } = {};
    
    Object.entries(quantities).forEach(([productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        costs[productId] = quantity * product.base_price;
      }
    });
    
    return costs;
  }
}