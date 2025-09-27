import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { proposalId } = await req.json();

    if (!proposalId) {
      throw new Error('Proposal ID is required');
    }

    // Fetch proposal data
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        *,
        proposal_items (*)
      `)
      .eq('id', proposalId)
      .single();

    if (error || !proposal) {
      throw new Error('Proposal not found');
    }

    // Generate HTML content for the proposal
    const htmlContent = generateProposalHTML(proposal);

    return new Response(htmlContent, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html; charset=utf-8' 
      }
    });

  } catch (error: any) {
    console.error('❌ Generate proposal failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

function generateProposalHTML(proposal: any): string {
  const clientData = proposal.client_data || {};
  const items = proposal.proposal_items || [];

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proposta ${proposal.proposal_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background: #f8fafc; 
          padding: 20px;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 10px; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .proposal-number { 
          font-size: 1.2rem; 
          opacity: 0.9; 
          font-weight: 300; 
        }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section-title { 
          font-size: 1.4rem; 
          color: #2d3748; 
          margin-bottom: 15px; 
          padding-bottom: 8px; 
          border-bottom: 2px solid #e2e8f0; 
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
          gap: 15px; 
          margin-bottom: 20px; 
        }
        .info-item { 
          background: #f7fafc; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #667eea; 
        }
        .info-label { font-weight: 600; color: #4a5568; margin-bottom: 5px; }
        .info-value { color: #2d3748; }
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px; 
          background: white; 
          border-radius: 8px; 
          overflow: hidden; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .items-table th { 
          background: #667eea; 
          color: white; 
          padding: 15px; 
          text-align: left; 
          font-weight: 600; 
        }
        .items-table td { 
          padding: 15px; 
          border-bottom: 1px solid #e2e8f0; 
        }
        .items-table tr:nth-child(even) { background: #f7fafc; }
        .items-table tr:hover { background: #edf2f7; }
        .total-section { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 25px 30px; 
          margin-top: 30px; 
          border-radius: 10px; 
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 10px; 
        }
        .total-row:last-child { 
          margin-bottom: 0; 
          padding-top: 15px; 
          border-top: 1px solid rgba(255,255,255,0.3); 
          font-size: 1.3rem; 
          font-weight: bold; 
        }
        .status-badge { 
          display: inline-block; 
          padding: 5px 15px; 
          border-radius: 20px; 
          font-size: 0.9rem; 
          font-weight: 600; 
          text-transform: uppercase; 
        }
        .status-draft { background: #fed7d7; color: #c53030; }
        .status-sent { background: #bee3f8; color: #2b6cb0; }
        .status-accepted { background: #c6f6d5; color: #2f855a; }
        .footer { 
          text-align: center; 
          padding: 20px 30px; 
          background: #f7fafc; 
          color: #718096; 
          font-style: italic; 
        }
        @media (max-width: 600px) {
          .info-grid { grid-template-columns: 1fr; }
          .total-row { flex-direction: column; align-items: flex-start; }
          .container { margin: 10px; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PROPOSTA COMERCIAL</h1>
          <div class="proposal-number">${proposal.proposal_number}</div>
          <div style="margin-top: 15px;">
            <span class="status-badge status-${proposal.status}">${getStatusLabel(proposal.status)}</span>
          </div>
        </div>

        <div class="content">
          <div class="section">
            <h2 class="section-title">Informações Gerais</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Data da Proposta</div>
                <div class="info-value">${formatDate(proposal.created_at)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Válida até</div>
                <div class="info-value">${formatDate(proposal.valid_until)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Tipo de Projeto</div>
                <div class="info-value">${getProjectTypeLabel(proposal.project_type)}</div>
              </div>
            </div>
          </div>

          ${clientData.name ? `
          <div class="section">
            <h2 class="section-title">Dados do Cliente</h2>
            <div class="info-grid">
              ${clientData.name ? `
              <div class="info-item">
                <div class="info-label">Nome</div>
                <div class="info-value">${clientData.name}</div>
              </div>
              ` : ''}
              ${clientData.email ? `
              <div class="info-item">
                <div class="info-label">E-mail</div>
                <div class="info-value">${clientData.email}</div>
              </div>
              ` : ''}
              ${clientData.phone ? `
              <div class="info-item">
                <div class="info-label">Telefone</div>
                <div class="info-value">${clientData.phone}</div>
              </div>
              ` : ''}
              ${clientData.address ? `
              <div class="info-item">
                <div class="info-label">Endereço</div>
                <div class="info-value">${formatAddress(clientData.address)}</div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          ${proposal.description ? `
          <div class="section">
            <h2 class="section-title">Descrição do Projeto</h2>
            <div class="info-item">
              <div class="info-value">${proposal.description}</div>
            </div>
          </div>
          ` : ''}

          ${items.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Itens da Proposta</h2>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Quantidade</th>
                  <th>Valor Unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                <tr>
                  <td>
                    <strong>${item.custom_name || 'Item'}</strong>
                    ${item.description ? `<br><small style="color: #718096;">${item.description}</small>` : ''}
                  </td>
                  <td>${item.quantity || 1}</td>
                  <td>${formatCurrency(item.unit_price || 0)}</td>
                  <td><strong>${formatCurrency(item.total_price || 0)}</strong></td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="total-section">
            <div class="total-row">
              <span>Valor Total:</span>
              <span>${formatCurrency(proposal.total_value || 0)}</span>
            </div>
            ${proposal.discount_value > 0 ? `
            <div class="total-row">
              <span>Desconto (${proposal.discount_percentage || 0}%):</span>
              <span>- ${formatCurrency(proposal.discount_value || 0)}</span>
            </div>
            ` : ''}
            <div class="total-row">
              <span>VALOR FINAL:</span>
              <span>${formatCurrency(proposal.final_value || proposal.total_value || 0)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          Esta proposta é válida até ${formatDate(proposal.valid_until)}
        </div>
      </div>
    </body>
    </html>
  `;
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function formatAddress(address: any): string {
  if (typeof address === 'string') return address;
  if (!address) return '';
  
  const parts = [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
    address.zipCode
  ].filter(Boolean);
  
  return parts.join(', ');
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'draft': 'Rascunho',
    'sent': 'Enviada',
    'accepted': 'Aceita',
    'rejected': 'Rejeitada',
    'expired': 'Expirada',
    'viewed': 'Visualizada',
    'under_review': 'Em Análise'
  };
  return labels[status] || status;
}

function getProjectTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'shingle': 'Telha Shingle',
    'solar': 'Energia Solar',
    'solar_advanced': 'Energia Solar Avançada',
    'battery_backup': 'Backup de Bateria'
  };
  return labels[type] || type;
}