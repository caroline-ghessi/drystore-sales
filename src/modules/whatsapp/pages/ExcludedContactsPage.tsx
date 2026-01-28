import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AddExcludedContactDialog, ExcludedContactsList } from '../components/excluded-contacts';

export default function ExcludedContactsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/whatsapp/vendedores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Contatos Excluídos</h1>
            </div>
            <p className="text-muted-foreground">
              Gerencie números de telefone que não devem ser contabilizados como clientes
            </p>
          </div>
        </div>
        <AddExcludedContactDialog />
      </div>

      {/* Info Card */}
      <div className="bg-muted border rounded-lg p-4">
        <h3 className="font-medium mb-2">
          Como funciona a lista de exclusão?
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Números nesta lista não são contabilizados como leads</li>
          <li>• Conversas com esses contatos não afetam as métricas de qualidade dos vendedores</li>
          <li>• Vendedores monitorados são adicionados automaticamente quando cadastrados</li>
          <li>• Ao adicionar um número, as conversas existentes são atualizadas automaticamente</li>
        </ul>
      </div>

      {/* Lista de contatos */}
      <ExcludedContactsList />
    </div>
  );
}
