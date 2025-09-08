-- Alterar enum product_category para renomear forro_knauf para forro_drywall
ALTER TYPE product_category RENAME VALUE 'forro_knauf' TO 'forro_drywall';

-- Atualizar produtos existentes (caso existam)
UPDATE products 
SET category = 'forro_drywall'::product_category 
WHERE category = 'forro_knauf'::product_category;