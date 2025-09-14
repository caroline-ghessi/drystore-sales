import { TemplateRenderData, ProductKPI, ProductTechnicalSpec } from '../types/product-templates.types';

export class TemplateRendererService {
  static generateProposalHTML(data: TemplateRenderData): string {
    const { proposal, client, items, template, calculationData } = data;
    const config = template.config;
    
    // Gerar dados dinâmicos
    const kpis = template.generateKPIs(calculationData);
    const technicalSpecs = template.generateTechnicalSpecs(calculationData);
    const benefits = template.generateBenefits(calculationData);

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proposta - ${proposal.proposal_number}</title>
      <style>
        ${this.generateCSS(config)}
      </style>
    </head>
    <body>
      <div class="proposal-container">
        ${this.generateHeader(proposal, config)}
        ${this.generateClientInfo(client)}
        ${this.generateKPISection(kpis, config)}
        ${this.generateItemsSection(items)}
        ${this.generateFinancialSummary(proposal)}
        ${this.generateBenefitsSection(benefits, config)}
        ${this.generateTechnicalSection(technicalSpecs, config)}
        ${this.generateWarrantySection(config)}
        ${this.generateTermsSection()}
        ${this.generateFooter(proposal)}
      </div>
      
      <style media="print">
        ${this.generatePrintCSS()}
      </style>
    </body>
    </html>
    `;
  }

  private static generateCSS(config: any): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f8f9fa;
      }
      
      .proposal-container {
        max-width: 900px;
        margin: 0 auto;
        background: white;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
      }
      
      .header {
        background: linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor});
        color: white;
        padding: 40px 30px;
        text-align: center;
      }
      
      .header h1 {
        font-size: 2.5rem;
        margin-bottom: 10px;
        font-weight: 700;
      }
      
      .header p {
        font-size: 1.2rem;
        opacity: 0.9;
      }
      
      .section {
        padding: 30px;
        border-bottom: 1px solid #eee;
      }
      
      .section h2 {
        color: ${config.primaryColor};
        margin-bottom: 20px;
        font-size: 1.8rem;
        border-bottom: 3px solid ${config.accentColor};
        padding-bottom: 10px;
      }
      
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin: 20px 0;
      }
      
      .kpi-card {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        border-left: 4px solid ${config.primaryColor};
      }
      
      .kpi-card.highlight {
        background: linear-gradient(135deg, ${config.primaryColor}15, ${config.accentColor}15);
        border-left-color: ${config.accentColor};
      }
      
      .kpi-value {
        font-size: 2rem;
        font-weight: bold;
        color: ${config.primaryColor};
      }
      
      .kpi-label {
        font-size: 0.9rem;
        color: #666;
        margin-top: 5px;
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      .items-table th,
      .items-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      
      .items-table th {
        background: ${config.primaryColor};
        color: white;
        font-weight: 600;
      }
      
      .items-table tr:hover {
        background: #f5f5f5;
      }
      
      .financial-summary {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      
      .total-row {
        font-size: 1.2rem;
        font-weight: bold;
        color: ${config.primaryColor};
        border-top: 2px solid ${config.primaryColor};
        padding-top: 10px;
      }
      
      .benefits-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin: 20px 0;
      }
      
      .benefit-item {
        display: flex;
        align-items: center;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 5px;
      }
      
      .benefit-item::before {
        content: '✓';
        color: ${config.primaryColor};
        font-weight: bold;
        margin-right: 10px;
      }
      
      .warranty-grid {
        display: grid;
        gap: 20px;
        margin: 20px 0;
      }
      
      .warranty-item {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid ${config.primaryColor};
      }
      
      .warranty-component {
        font-weight: bold;
        color: ${config.primaryColor};
        margin-bottom: 5px;
      }
      
      .warranty-duration {
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 5px;
      }
      
      .tech-spec-category {
        margin-bottom: 20px;
      }
      
      .tech-spec-title {
        font-weight: bold;
        color: ${config.primaryColor};
        margin-bottom: 10px;
        font-size: 1.1rem;
      }
      
      .spec-list {
        display: grid;
        gap: 8px;
      }
      
      .spec-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      
      .footer {
        background: #333;
        color: white;
        padding: 30px;
        text-align: center;
      }
      
      .status-badge {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .status-valid {
        background: #d4edda;
        color: #155724;
      }
      
      .status-expired {
        background: #f8d7da;
        color: #721c24;
      }
    `;
  }

  private static generatePrintCSS(): string {
    return `
      body { background: white !important; }
      .proposal-container { box-shadow: none !important; }
      .section { page-break-inside: avoid; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .benefits-grid { grid-template-columns: 1fr !important; }
    `;
  }

  private static generateHeader(proposal: any, config: any): string {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    return `
      <div class="header">
        <h1>${config.heroTitle}</h1>
        <p>${config.heroSubtitle}</p>
        <div style="margin-top: 20px; font-size: 1rem;">
          <strong>Proposta Nº:</strong> ${proposal.proposal_number}<br>
          <strong>Data:</strong> ${currentDate}
        </div>
      </div>
    `;
  }

  private static generateClientInfo(client: any): string {
    return `
      <div class="section">
        <h2>Informações do Cliente</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
          <div><strong>Nome:</strong> ${client.name}</div>
          <div><strong>Telefone:</strong> ${client.phone}</div>
          ${client.email ? `<div><strong>Email:</strong> ${client.email}</div>` : ''}
        </div>
      </div>
    `;
  }

  private static generateKPISection(kpis: ProductKPI[], config: any): string {
    if (!kpis.length) return '';
    
    const kpiCards = kpis.map(kpi => `
      <div class="kpi-card ${kpi.highlight ? 'highlight' : ''}">
        <div class="kpi-value">${kpi.value}${kpi.unit ? kpi.unit : ''}</div>
        <div class="kpi-label">${kpi.label}</div>
      </div>
    `).join('');

    return `
      <div class="section">
        <h2>${config.kpiSection.title}</h2>
        <div class="kpi-grid">
          ${kpiCards}
        </div>
      </div>
    `;
  }

  private static generateItemsSection(items: any[]): string {
    const itemRows = items.map(item => `
      <tr>
        <td>${item.custom_name}</td>
        <td>${item.description || ''}</td>
        <td>${item.quantity}</td>
        <td>R$ ${item.unit_price?.toFixed(2) || '0,00'}</td>
        <td>R$ ${item.total_price?.toFixed(2) || '0,00'}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>Itens da Proposta</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Descrição</th>
              <th>Qtd</th>
              <th>Valor Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>
    `;
  }

  private static generateFinancialSummary(proposal: any): string {
    return `
      <div class="section">
        <h2>Resumo Financeiro</h2>
        <div class="financial-summary">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Subtotal:</span>
            <span>R$ ${proposal.total_value?.toFixed(2) || '0,00'}</span>
          </div>
          ${proposal.discount_value > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #dc3545;">
              <span>Desconto (${proposal.discount_percentage}%):</span>
              <span>- R$ ${proposal.discount_value?.toFixed(2) || '0,00'}</span>
            </div>
          ` : ''}
          <div class="total-row" style="display: flex; justify-content: space-between;">
            <span>Total:</span>
            <span>R$ ${proposal.final_value?.toFixed(2) || proposal.total_value?.toFixed(2) || '0,00'}</span>
          </div>
          <div style="margin-top: 15px; font-size: 0.9rem; color: #666;">
            <strong>Validade:</strong> ${new Date(proposal.valid_until).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    `;
  }

  private static generateBenefitsSection(benefits: string[], config: any): string {
    if (!benefits.length) return '';

    const benefitItems = benefits.map(benefit => `
      <div class="benefit-item">${benefit}</div>
    `).join('');

    return `
      <div class="section">
        <h2>${config.benefitsSection.title}</h2>
        <div class="benefits-grid">
          ${benefitItems}
        </div>
      </div>
    `;
  }

  private static generateTechnicalSection(specs: ProductTechnicalSpec[], config: any): string {
    if (!specs.length) return '';

    const specSections = specs.map(spec => `
      <div class="tech-spec-category">
        <div class="tech-spec-title">${spec.category}</div>
        <div class="spec-list">
          ${spec.specifications.map(item => `
            <div class="spec-item">
              <span>${item.name}</span>
              <span><strong>${item.value}${item.unit ? ' ' + item.unit : ''}</strong></span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    return `
      <div class="section">
        <h2>${config.technicalSection.title}</h2>
        ${specSections}
      </div>
    `;
  }

  private static generateWarrantySection(config: any): string {
    const warrantyItems = config.warrantySection.warranties.map((warranty: any) => `
      <div class="warranty-item">
        <div class="warranty-component">${warranty.component}</div>
        <div class="warranty-duration">${warranty.duration}</div>
        <div>${warranty.details}</div>
      </div>
    `).join('');

    return `
      <div class="section">
        <h2>${config.warrantySection.title}</h2>
        <div class="warranty-grid">
          ${warrantyItems}
        </div>
      </div>
    `;
  }

  private static generateTermsSection(): string {
    return `
      <div class="section">
        <h2>Termos e Condições</h2>
        <div style="font-size: 0.9rem; line-height: 1.6;">
          <p><strong>Condições de Pagamento:</strong> Conforme acordado na proposta.</p>
          <p><strong>Prazo de Execução:</strong> Conforme cronograma apresentado.</p>
          <p><strong>Validade da Proposta:</strong> Conforme data indicada no resumo financeiro.</p>
          <p><strong>Observações:</strong> Esta proposta está sujeita à aprovação técnica e disponibilidade de materiais.</p>
        </div>
      </div>
    `;
  }

  private static generateFooter(proposal: any): string {
    return `
      <div class="footer">
        <p>Proposta gerada em ${new Date().toLocaleDateString('pt-BR')}</p>
        <p>Proposta Nº: ${proposal.proposal_number}</p>
        <p style="margin-top: 10px; font-size: 0.9rem;">
          Esta é uma proposta automatizada. Para dúvidas, entre em contato conosco.
        </p>
      </div>
    `;
  }
}