import { useState } from 'react';
import { Phone, User, Building, Tag, MoreHorizontal, Power, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useExcludedContacts, type ExcludedContact } from '../../hooks/useExcludedContacts';
import { formatPhoneDisplay, CONTACT_TYPES } from '../../utils/phoneUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getContactTypeBadge = (type: string) => {
  const typeInfo = CONTACT_TYPES.find(t => t.value === type);
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    employee: 'default',
    vendor: 'secondary',
    test: 'outline',
    supplier: 'outline',
    partner: 'outline',
    spam: 'destructive',
  };
  
  return (
    <Badge variant={variants[type] || 'default'}>
      {typeInfo?.label || type}
    </Badge>
  );
};

export function ExcludedContactsList() {
  const { contacts, isLoading, toggleContactStatus, removeContact } = useExcludedContacts();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<ExcludedContact | null>(null);

  // Filtrar contatos
  const filteredContacts = contacts.filter(contact => {
    const search = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(search) ||
      contact.phone_number.includes(search) ||
      contact.department?.toLowerCase().includes(search) ||
      contact.reason?.toLowerCase().includes(search)
    );
  });

  const handleDelete = (contact: ExcludedContact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (contactToDelete) {
      await removeContact.mutateAsync(contactToDelete.id);
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-2">Carregando contatos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeContacts = filteredContacts.filter(c => c.is_active);
  const inactiveContacts = filteredContacts.filter(c => !c.is_active);

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Input
          placeholder="Buscar por nome, telefone, departamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{activeContacts.length}</div>
            <div className="text-sm text-muted-foreground">Contatos ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{inactiveContacts.length}</div>
            <div className="text-sm text-muted-foreground">Contatos inativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{contacts.filter(c => c.contact_type === 'vendor').length}</div>
            <div className="text-sm text-muted-foreground">Vendedores monitorados</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de contatos */}
      {filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum contato encontrado para a busca.' : 'Nenhum contato na lista de exclusão.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Contatos Excluídos</CardTitle>
            <CardDescription>
              Estes contatos não são contabilizados como clientes e não afetam as métricas de qualidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`py-4 flex items-center justify-between ${!contact.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-muted rounded-full p-2">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{contact.name}</span>
                        {getContactTypeBadge(contact.contact_type)}
                        {!contact.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {formatPhoneDisplay(contact.phone_number)}
                        </span>
                        {contact.department && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {contact.department}
                          </span>
                        )}
                        {contact.reason && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {contact.reason}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Adicionado em {format(new Date(contact.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => toggleContactStatus.mutate({ 
                          id: contact.id, 
                          isActive: !contact.is_active 
                        })}
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {contact.is_active ? 'Desativar' : 'Reativar'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(contact)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover permanentemente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover contato permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contato <strong>{contactToDelete?.name}</strong> será
              removido permanentemente da lista de exclusão. As conversas existentes permanecerão
              com a flag de contato interno até que sejam atualizadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
