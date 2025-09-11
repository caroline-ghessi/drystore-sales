-- Permitir acesso público às propostas através do acceptance_link
CREATE POLICY "Public access to proposals via acceptance_link" 
ON public.proposals 
FOR SELECT 
TO public 
USING (true);

-- Permitir acesso público aos itens das propostas  
CREATE POLICY "Public access to proposal_items via proposal" 
ON public.proposal_items 
FOR SELECT 
TO public 
USING (true);