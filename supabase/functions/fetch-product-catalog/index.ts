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
  
  // Log primeiros 2000 caracteres para debug
  console.log('📋 XML Structure Sample:', xmlText.substring(0, 2000));
  
  // Parse XML (estrutura básica - ajustar conforme necessário)
  const products: Product[] = [];
  
  // Tentar múltiplos padrões de tags comuns
  const patterns = [
    /<produto[^>]*>(.*?)<\/produto>/gs,
    /<item[^>]*>(.*?)<\/item>/gs,
    /<product[^>]*>(.*?)<\/product>/gs,
    /<PRODUTO[^>]*>(.*?)<\/PRODUTO>/gs,
  ];
  
  let productMatches: IterableIterator<RegExpMatchArray> | null = null;
  
  for (const pattern of patterns) {
    const matches = Array.from(xmlText.matchAll(pattern));
    if (matches.length > 0) {
      console.log(`✓ Found ${matches.length} products with pattern: ${pattern}`);
      productMatches = xmlText.matchAll(pattern);
      break;
    }
  }
  
  if (!productMatches) {
    console.error('❌ No product tags found in XML. Trying alternative extraction...');
    
    // Tentar extrair estrutura alternativa (lista de campos)
    const fieldPatterns = {
      id: /<(?:id|codigo|sku)[^>]*>([^<]+)<\/(?:id|codigo|sku)>/gi,
      name: /<(?:nome|descricao|title|name)[^>]*>([^<]+)<\/(?:nome|descricao|title|name)>/gi,
    };
    
    const ids = Array.from(xmlText.matchAll(fieldPatterns.id));
    const names = Array.from(xmlText.matchAll(fieldPatterns.name));
    
    console.log(`Found ${ids.length} IDs and ${names.length} names in alternative extraction`);
    
    if (ids.length === 0) {
      console.error('❌ Failed to parse XML: no products found with any pattern');
      console.log('Root tags found:', xmlText.match(/<[a-zA-Z][a-zA-Z0-9]*[\s>]/g)?.slice(0, 20));
    }
    
    return products;
  }
  
  for (const match of productMatches) {
    const productXml = match[1];
    
    // Google Shopping RSS Feed format - usar tags corretas
    const id = extractTag(productXml, 'g:id') || extractTag(productXml, 'id') || '';
    const name = extractTag(productXml, 'title') || '';
    const priceStr = extractTag(productXml, 'g:price') || '0';
    const brand = extractTag(productXml, 'g:brand') || 'Sem Marca';
    const categoryFull = extractTag(productXml, 'g:product_type') || 'Sem Categoria';
    const description = extractTag(productXml, 'description') || '';
    const url = extractTag(productXml, 'link') || '';
    const stock = extractTag(productXml, 'g:availability') || 'unknown';
    const sku = extractTag(productXml, 'g:mpn') || extractTag(productXml, 'g:gtin') || id;
    
    // Extrair primeira categoria de "Ferramentas > Acessórios > Lâminas"
    const category = categoryFull.split('>')[0].trim();
    
    // Converter preço: "R$ 49,90" → 49.90
    const cleanPrice = priceStr
      .replace(/R\$/g, '')
      .replace(/\s/g, '')
      .replace(/[^\d,\.]/g, '')
      .replace(',', '.');
    const price = parseFloat(cleanPrice) || 0;
    
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
  
  // Log amostra dos primeiros produtos
  if (products.length > 0) {
    console.log('📦 Sample products:', JSON.stringify(products.slice(0, 3), null, 2));
  }
  
  return products;
}

function extractTag(xml: string, tagName: string): string {
  // Suportar namespaces (g:id, g:price, etc.) e tags normais
  // Escape dos dois pontos no namespace
  const escapedTag = tagName.replace(':', '\\:');
  const regex = new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i');
  const match = xml.match(regex);
  if (match && match[1]) {
    // Limpar CDATA se presente
    let cleaned = match[1].replace(/<!\[CDATA\[([\\s\\S]*?)\]\]>/g, '$1').trim();
    // Decodificar entidades HTML básicas
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
    return cleaned;
  }
  return '';
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
