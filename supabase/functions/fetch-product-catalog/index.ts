import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const XML_URL = 'https://www.drystore.com.br/xml/xml.php?Chave=w9GazVGbn92bnxHO4ETNwITM';
const CACHE_PATH = 'product-catalog-cache.json';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  sku: string;
  stock: string;
  url: string;
  description?: string;
}

interface CatalogCache {
  lastUpdate: string;
  totalProducts: number;
  xmlHash: string;
  products: Product[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query = '', forceRefresh = false } = await req.json();
    
    console.log(`🔍 Fetching product catalog - Query: "${query}", Force: ${forceRefresh}`);

    // Tentar buscar cache primeiro (se não for forçado refresh)
    let cachedData: CatalogCache | null = null;
    if (!forceRefresh) {
      cachedData = await loadCache();
      
      if (cachedData && isCacheValid(cachedData.lastUpdate)) {
        console.log(`✅ Using cached catalog (${cachedData.totalProducts} products)`);
        
        // Buscar produtos relevantes no cache
        const results = searchProducts(cachedData.products, query);
        
        return new Response(JSON.stringify({
          products: results,
          source: 'cache',
          lastUpdate: cachedData.lastUpdate,
          totalProducts: cachedData.totalProducts
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Cache inválido ou refresh forçado - buscar XML
    console.log('🌐 Fetching fresh XML from Drystore...');
    const products = await fetchAndParseXML();
    
    // Salvar novo cache
    const cacheData: CatalogCache = {
      lastUpdate: new Date().toISOString(),
      totalProducts: products.length,
      xmlHash: await hashString(JSON.stringify(products)),
      products
    };
    
    await saveCache(cacheData);
    console.log(`✅ Catalog cached successfully (${products.length} products)`);
    
    // Buscar produtos relevantes
    const results = searchProducts(products, query);
    
    return new Response(JSON.stringify({
      products: results,
      source: 'xml',
      lastUpdate: cacheData.lastUpdate,
      totalProducts: products.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error fetching product catalog:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      products: [],
      source: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function fetchAndParseXML(): Promise<Product[]> {
  const response = await fetch(XML_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch XML: ${response.status}`);
  }
  
  const xmlText = await response.text();
  console.log(`📄 XML fetched successfully (${xmlText.length} bytes)`);
  
  // Parse XML (estrutura básica - ajustar conforme necessário)
  const products: Product[] = [];
  
  // Usar regex para extrair produtos (alternativa ao XML parser)
  const productMatches = xmlText.matchAll(/<produto>(.*?)<\/produto>/gs);
  
  for (const match of productMatches) {
    const productXml = match[1];
    
    const id = extractTag(productXml, 'id') || extractTag(productXml, 'codigo') || '';
    const name = extractTag(productXml, 'nome') || extractTag(productXml, 'descricao') || '';
    const priceStr = extractTag(productXml, 'preco') || extractTag(productXml, 'valor') || '0';
    const category = extractTag(productXml, 'categoria') || 'Sem Categoria';
    const brand = extractTag(productXml, 'marca') || 'Sem Marca';
    const sku = extractTag(productXml, 'sku') || extractTag(productXml, 'codigo') || id;
    const stock = extractTag(productXml, 'estoque') || 'available';
    const url = extractTag(productXml, 'url') || extractTag(productXml, 'link') || '';
    const description = extractTag(productXml, 'descricao_completa') || '';
    
    // Converter preço (remover vírgula e converter para número)
    const price = parseFloat(priceStr.replace(',', '.')) || 0;
    
    if (id && name) {
      products.push({
        id,
        name,
        price,
        category,
        brand,
        sku,
        stock,
        url,
        description
      });
    }
  }
  
  console.log(`✅ Parsed ${products.length} products from XML`);
  return products;
}

function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, 's');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function searchProducts(products: Product[], query: string): Product[] {
  if (!query || query.trim() === '') {
    return products.slice(0, 10); // Retornar primeiros 10 se sem query
  }
  
  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery.split(/\s+/);
  
  // Buscar produtos que contenham qualquer keyword
  const results = products.filter(product => {
    const searchText = `${product.name} ${product.category} ${product.brand} ${product.description || ''}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword));
  });
  
  // Priorizar produtos com nome exato ou similar
  results.sort((a, b) => {
    const aNameMatch = a.name.toLowerCase().includes(lowerQuery) ? 1 : 0;
    const bNameMatch = b.name.toLowerCase().includes(lowerQuery) ? 1 : 0;
    return bNameMatch - aNameMatch;
  });
  
  return results.slice(0, 10); // Retornar top 10
}

async function loadCache(): Promise<CatalogCache | null> {
  try {
    const { data, error } = await supabase.storage
      .from('agent-knowledge')
      .download(CACHE_PATH);
    
    if (error || !data) {
      console.log('ℹ️ No cache found');
      return null;
    }
    
    const text = await data.text();
    return JSON.parse(text);
  } catch (error) {
    console.warn('⚠️ Error loading cache:', error);
    return null;
  }
}

async function saveCache(data: CatalogCache): Promise<void> {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    
    // Remove cache antigo se existir
    await supabase.storage
      .from('agent-knowledge')
      .remove([CACHE_PATH]);
    
    // Upload novo cache
    const { error } = await supabase.storage
      .from('agent-knowledge')
      .upload(CACHE_PATH, blob, {
        contentType: 'application/json',
        upsert: true
      });
    
    if (error) throw error;
    
    console.log('✅ Cache saved successfully');
  } catch (error) {
    console.error('❌ Error saving cache:', error);
  }
}

function isCacheValid(lastUpdate: string): boolean {
  const cacheAge = Date.now() - new Date(lastUpdate).getTime();
  return cacheAge < CACHE_DURATION_MS;
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
