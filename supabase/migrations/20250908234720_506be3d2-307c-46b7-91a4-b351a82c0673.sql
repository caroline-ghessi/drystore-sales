-- Remover produtos mockados - manter apenas dados reais de forro_drywall
DELETE FROM products 
WHERE category IN ('telha_shingle', 'energia_solar', 'drywall_divisorias');

-- Verificar produtos restantes
-- SELECT category, COUNT(*) as total FROM products GROUP BY category;