import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, TrendingUp, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { VendorList } from '@/modules/whatsapp/components/vendor/VendorList';
import { VendorConversations } from '@/modules/whatsapp/components/vendor/VendorConversations';
import { VendorQuality } from '@/modules/whatsapp/components/vendor/VendorQuality';
import { AddVendorDialog } from '@/modules/whatsapp/components/vendor/AddVendorDialog';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function VendedoresPage() {
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('vendedores');

  return (
    <RouteGuard requireSupervisor={true}>
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Monitoramento de Vendedores
              </h1>
              <p className="text-muted-foreground text-sm">
                Gerencie os vendedores e acompanhe performance no WhatsApp
              </p>
            </div>
          </div>
          
          <Button onClick={() => setShowAddDialog(true)} className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Vendedor
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-6 w-fit bg-muted rounded-lg p-1 h-11">
            <TabsTrigger value="vendedores" className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4" />
              Vendedores
            </TabsTrigger>
            
            {selectedVendor && (
              <>
                <TabsTrigger value="conversas" className="flex items-center gap-2 font-medium">
                  <Clock className="h-4 w-4" />
                  Conversas
                </TabsTrigger>
                <TabsTrigger value="qualidade" className="flex items-center gap-2 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Qualidade
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="vendedores" className="h-full m-0">
              <VendorList 
                onSelectVendor={(vendor) => {
                  setSelectedVendor(vendor);
                  setActiveTab('conversas');
                }}
                selectedVendor={selectedVendor}
              />
            </TabsContent>

            {selectedVendor && (
              <>
                <TabsContent value="conversas" className="h-full m-0">
                  <VendorConversations vendor={selectedVendor} />
                </TabsContent>
                
                <TabsContent value="qualidade" className="h-full m-0">
                  <VendorQuality vendor={selectedVendor} />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>

        <AddVendorDialog 
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      </div>
    </RouteGuard>
  );
}