import { useState } from 'react';
import { MoreHorizontal, UserX, Trash2, Mail, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { type Atendente } from '@/hooks/useAtendentes';
import { useInviteManagement } from '@/hooks/useInviteManagement';

interface UserActionsDropdownProps {
  atendente: Atendente;
  isLoading?: boolean;
  onAction?: () => void;
}

export function UserActionsDropdown({ atendente, isLoading, onAction }: UserActionsDropdownProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
  
  const { 
    resendInvite, 
    isResending, 
    deleteUser, 
    isDeleting, 
    cancelInvite, 
    isCancelling 
  } = useInviteManagement();

  const handleResendInvite = async () => {
    try {
      await resendInvite({
        email: atendente.email,
        displayName: atendente.display_name,
        department: atendente.department,
        role: atendente.role || 'atendente'
      });
      onAction?.();
    } catch (error) {
      console.error('Error resending invite:', error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser({
        userId: atendente.user_id,
        deleteType
      });
      setShowDeleteDialog(false);
      onAction?.();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleCancelInvite = async () => {
    try {
      await cancelInvite({
        email: atendente.email
      });
      setShowCancelDialog(false);
      onAction?.();
    } catch (error) {
      console.error('Error cancelling invite:', error);
    }
  };

  const isProcessing = isLoading || isResending || isDeleting || isCancelling;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isProcessing}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-48">
          {atendente.invite_status === 'pending' && (
            <>
              <DropdownMenuItem 
                onClick={handleResendInvite}
                disabled={isProcessing}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reenviar Convite
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setShowCancelDialog(true)}
                disabled={isProcessing}
                className="gap-2 text-orange-600 focus:text-orange-600"
              >
                <Mail className="h-4 w-4" />
                Cancelar Convite
              </DropdownMenuItem>
            </>
          )}
          
          {atendente.invite_status === 'confirmed' && (
            <>
              <DropdownMenuItem 
                onClick={() => {
                  setDeleteType('soft');
                  setShowDeleteDialog(true);
                }}
                disabled={isProcessing}
                className="gap-2 text-orange-600 focus:text-orange-600"
              >
                <UserX className="h-4 w-4" />
                Desativar Usuário
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => {
                  setDeleteType('hard');
                  setShowDeleteDialog(true);
                }}
                disabled={isProcessing}
                className="gap-2 text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Permanentemente
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {deleteType === 'soft' ? 'Desativar Usuário' : 'Excluir Usuário Permanentemente'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'soft' ? (
                <>
                  Tem certeza que deseja desativar <strong>{atendente.display_name}</strong>? 
                  O usuário será desativado mas seus dados serão mantidos.
                </>
              ) : (
                <>
                  <strong>ATENÇÃO:</strong> Esta ação é IRREVERSÍVEL! 
                  Todos os dados de <strong>{atendente.display_name}</strong> serão 
                  removidos permanentemente do sistema.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className={deleteType === 'hard' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {deleteType === 'soft' ? 'Desativar' : 'Excluir Permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invite Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              Cancelar Convite
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o convite para <strong>{atendente.email}</strong>? 
              O usuário não conseguirá mais aceitar este convite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter Convite</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvite}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Cancelar Convite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}