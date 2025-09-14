import { UnifiedProduct } from '../hooks/useUnifiedProducts';

export interface ProductCalculationSpecs {
  // Rendimentos e características técnicas
  coverage_area?: number;  // m² por unidade/pacote/rolo
  yield_per_unit?: number; // Rendimento específico
  efficiency?: number;     // Eficiência (0-1)  
  power?: number;          // Potência (W) - campo padrão
  power_rating?: number;   // Potência (kW, W) - compatibilidade
  power_continuous?: number; // Potência contínua (W)
  power_peak?: number;     // Potência de pico (W)
  capacity?: number;       // Capacidade (kWh, Ah)
  voltage?: number;        // Voltagem
  dod?: number;           // Depth of Discharge (0-1)
  cycles?: number;        // Ciclos de vida
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
  maxParallel?: number;         // Máximo de unidades em paralelo
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
      let specs = typeof product.specifications === 'string' 
        ? JSON.parse(product.specifications)
        : product.specifications;
      
      // Mapear campos específicos para baterias
      const isBattery = (product.category === 'energia_solar' && product.subcategory === 'bateria') ||
                       (product.category === 'battery_backup' && product.solar_category === 'battery');
      
      if (isBattery) {
        console.log(`📋 Aplicando mapeamento para bateria: ${product.name}`, { 
          category: product.category, 
          subcategory: product.subcategory,
          solar_category: product.solar_category,
          specs_before: specs 
        });
        
        // Mapear capacity_kwh para capacity para compatibilidade
        if (specs.capacity_kwh && !specs.capacity) {
          specs.capacity = specs.capacity_kwh;
        }
        
        // Garantir que dod e cycles estão disponíveis
        if (!specs.dod && specs.depth_of_discharge) {
          specs.dod = specs.depth_of_discharge;
        }
        
        if (!specs.cycles && specs.life_cycles) {
          specs.cycles = specs.life_cycles;
        }
        
        console.log(`📋 Especificações mapeadas:`, { 
          capacity: specs.capacity,
          dod: specs.dod,
          cycles: specs.cycles,
          specs_after: specs 
        });
      }
      
      // Mapear power_rating para power para compatibilidade (caso tenha ambos, power tem prioridade)
      if (specs.power_rating && !specs.power) {
        specs.power = specs.power_rating;
      }
      if (specs.power && !specs.power_rating) {
        specs.power_rating = specs.power;
      }
      
      return specs;
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
      shingles: [
        ...this.findProductsByCategory(products, 'telha_shingle', 'telha_principal'),
        ...this.findProductsByCategory(products, 'telha_shingle', 'telha_starter')
      ],
      osb: this.findProductsByCategory(products, 'telha_shingle', 'base_estrutural'),
      underlayment: this.findProductByCode(products, 'SH-RHI-87'), // RhinoRoof específico
      ridgeCap: this.findProductsByCategory(products, 'telha_shingle', 'cumeeira'),
      nails: this.findProductByCode(products, 'SH-PRG-TEL'), // Pregos específicos
      valleyTape: this.findProductByCode(products, 'FITA-AUTOAD-AGUAS-001'), // Fita para águas furtadas
      sealant: this.findProductByCode(products, 'SELANTE-PU-SHINGLE-001'), // Selante específico
      accessories: this.findProductsByCategory(products, 'telha_shingle', 'acessorios')
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
    console.log('🔋 ProductCalculationService.getBatteryProducts chamado');
    console.log('🔋 Total de produtos recebidos:', products.length);
    
    // Buscar baterias na categoria battery_backup
    const batteryBackupProducts = this.findProductsByCategory(products, 'battery_backup');
    console.log('🔋 Produtos com categoria battery_backup:', batteryBackupProducts.length);
    
    // Buscar inversores híbridos na categoria energia_solar (mudança principal)
    const solarProducts = this.findProductsByCategory(products, 'energia_solar');
    console.log('🔋 Produtos solares encontrados:', solarProducts.length);
    
    const batteries = batteryBackupProducts.filter(p => 
      p.solar_category === 'battery' || p.subcategory === 'bateria'
    );
    console.log('🔋 Baterias filtradas:', batteries.length);
    
    // Buscar inversores híbridos nos produtos solares
    const hybridInverters = solarProducts.filter(p => {
      if (p.solar_category !== 'inverter' && p.subcategory !== 'inversor') return false;
      
      // Verificar se é inversor híbrido usando especificações raw
      const rawSpecs = p.specifications;
      let isHybridBySpecs = false;
      
      if (rawSpecs && typeof rawSpecs === 'object' && !Array.isArray(rawSpecs)) {
        const specsObj = rawSpecs as { [key: string]: any };
        isHybridBySpecs = specsObj.type === 'hybrid' || specsObj.tipo === 'híbrido';
      }
      
      const modelLower = (p.model || p.name || '').toLowerCase();
      const isHybridByModel = modelLower.includes('híbrido') || 
                             modelLower.includes('hibrido') ||
                             modelLower.includes('hybrid');
      const brandLower = (p.brand || '').toLowerCase();
      const isHybridByBrand = brandLower.includes('growatt') ||
                             brandLower.includes('deye') ||
                             brandLower.includes('livoltek');
      
      return isHybridBySpecs || isHybridByModel || isHybridByBrand;
    });
    
    console.log('🔋 Inversores híbridos encontrados:', hybridInverters.length);
    console.log('🔋 Inversores:', hybridInverters.map(p => ({ 
      name: p.name, 
      category: p.category,
      solar_category: p.solar_category, 
      subcategory: p.subcategory 
    })));
    
    const protection = this.findProductsByCategory(products, 'battery_backup', 'protecao');
    console.log('🔋 Proteção encontrada:', protection.length);
    
    const monitoring = this.findProductsByCategory(products, 'battery_backup', 'monitoramento');
    console.log('🔋 Monitoramento encontrado:', monitoring.length);
    
    const result = {
      batteries,
      inverters: hybridInverters,
      protection,
      monitoring
    };
    
    console.log('🔋 Resultado final getBatteryProducts:', {
      batteries: result.batteries.length,
      inverters: result.inverters.length,
      protection: result.protection.length,
      monitoring: result.monitoring.length
    });
    
    return result;
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