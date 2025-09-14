-- Limpar produtos desnecessários e duplicados para calculadora shingle

-- Excluir produtos que não devem ser contabilizados na calculadora
DELETE FROM products WHERE code IN (
  'SH-EQUIP-AUX', -- Equipamentos Auxiliares para Instalação 
  'CONECT-PARAF-SHINGLE-001', -- Conectores e Parafusos para Shingle
  'FITA-VEDACAO-SHINGLE-001', -- Fita de Vedação para Shingle
  'SH-ACESS-COMP', -- Kit de Acessórios Complementares Shingle
  'PREGO-GALV-SHINGLE-001' -- Pregos Galvanizados para Shingle (duplicado)
);

-- Manter apenas produtos essenciais:
-- - Fita Autoadesiva para Águas Furtadas (FITA-AUTOAD-AGUAS-001) 
-- - Selante Poliuretano para Vedação Shingle (SELANTE-PU-SHINGLE-001)
-- - Pregos existente correto (SH-PRG-TEL)

-- Verificar se os produtos essenciais existem com as especificações corretas
UPDATE products 
SET 
  subcategory = 'acessorios',
  specifications = jsonb_build_object(
    'largura_mm', 75,
    'espessura_mm', 2.0,
    'material', 'asfalto modificado com polímeros',
    'adesivo', 'butílico',
    'flexibilidade', 'alta', 
    'resistencia_temperatura', '-20°C a +80°C',
    'resistencia_uv', 'excelente',
    'aplicacao', 'águas furtadas e cantos internos'
  )
WHERE code = 'FITA-AUTOAD-AGUAS-001';

UPDATE products
SET
  subcategory = 'acessorios',
  specifications = jsonb_build_object(
    'volume_ml', 300,
    'tipo', 'poliuretano',
    'cor', 'transparente',
    'temperatura_aplicacao', '-10°C a +35°C',
    'tempo_cura_horas', 24,
    'resistencia_uv', 'alta'
  )
WHERE code = 'SELANTE-PU-SHINGLE-001';