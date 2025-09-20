import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Trash2, Eye, Download, Upload, Search } from 'lucide-react';
import { useTemplateAssets, TemplateAsset } from '../../hooks/useTemplateAssets';
import { AssetUploadModal } from './AssetUploadModal';
import { ASSET_TYPES_WITH_ALL, PRODUCT_CATEGORIES_WITH_ALL, getAssetTypeLabel, getCategoryLabel } from '@/lib/constants/asset-types';

type CategoryFilter = 'all' | 'energia_solar' | 'drywall_divisorias' | 'steel_frame' | 'forros' | 'ferramentas' | 'impermeabilizacao_mapei' | 'preparacao_piso_mapei' | 'telha_shingle' | 'pisos' | 'acabamentos' | 'indefinido';

// Constantes importadas do arquivo centralizado

export const AssetGallery: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<TemplateAsset | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    display_order: 0
  });

  const { 
    assets, 
    isLoading, 
    updateAsset, 
    deleteAsset, 
    getAssetUrl,
    isUpdating,
    isDeleting 
  } = useTemplateAssets(categoryFilter === 'all' ? undefined : categoryFilter, typeFilter === 'all' ? undefined : typeFilter);

  // Filtrar assets por termo de busca
  const filteredAssets = assets.filter(asset => 
    asset.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditSave = () => {
    if (!editingAsset) return;

    updateAsset({
      id: editingAsset.id,
      updates: {
        description: editForm.description || undefined,
        display_order: editForm.display_order
      }
    });

    setEditingAsset(null);
  };

  const handleEditCancel = () => {
    setEditingAsset(null);
  };

  const handleDelete = (asset: TemplateAsset) => {
    if (confirm(`Tem certeza que deseja remover a imagem "${asset.file_name}"?`)) {
      deleteAsset(asset.id);
    }
  };

  const handleDownload = (asset: TemplateAsset) => {
    const url = getAssetUrl(asset.file_path);
    const link = document.createElement('a');
    link.href = url;
    link.download = asset.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Funções utilitárias importadas do arquivo centralizado

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando imagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Galeria de Imagens dos Templates</h2>
          <p className="text-muted-foreground">
            Gerencie as imagens utilizadas nos templates de propostas
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload de Imagens
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES_WITH_ALL.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES_WITH_ALL.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCategoryFilter('all');
                  setTypeFilter('all');
                  setSearchTerm('');
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{assets.length}</div>
            <div className="text-sm text-muted-foreground">Total de Imagens</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredAssets.length}</div>
            <div className="text-sm text-muted-foreground">Imagens Filtradas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Set(assets.map(a => a.template_category)).size}
            </div>
            <div className="text-sm text-muted-foreground">Categorias</div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de imagens */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground mb-4">
              {assets.length === 0 
                ? 'Nenhuma imagem encontrada. Faça upload de algumas imagens para começar.'
                : 'Nenhuma imagem corresponde aos filtros aplicados.'
              }
            </div>
            {assets.length === 0 && (
              <Button onClick={() => setShowUploadModal(true)}>
                Fazer Upload
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <img
                  src={getAssetUrl(asset.file_path)}
                  alt={asset.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-sm truncate" title={asset.file_name}>
                    {asset.file_name}
                  </h3>
                  {asset.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {asset.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryLabel(asset.template_category)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getAssetTypeLabel(asset.asset_type)}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Tamanho: {formatFileSize(asset.file_size)}</div>
                  <div>Ordem: {asset.display_order}</div>
                </div>

                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>{asset.file_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <img
                            src={getAssetUrl(asset.file_path)}
                            alt={asset.file_name}
                            className="w-full max-h-96 object-contain"
                          />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Categoria:</strong> {getCategoryLabel(asset.template_category)}
                            </div>
                            <div>
                              <strong>Tipo:</strong> {getAssetTypeLabel(asset.asset_type)}
                            </div>
                            <div>
                              <strong>Tamanho:</strong> {formatFileSize(asset.file_size)}
                            </div>
                            <div>
                              <strong>Ordem:</strong> {asset.display_order}
                            </div>
                          </div>
                          {asset.description && (
                            <div>
                              <strong>Descrição:</strong>
                              <p className="mt-1">{asset.description}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingAsset(asset);
                            setEditForm({
                              description: asset.description || '',
                              display_order: asset.display_order
                            });
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Imagem</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                description: e.target.value
                              })}
                              placeholder="Descrição da imagem"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Ordem de Exibição</Label>
                            <Input
                              type="number"
                              value={editForm.display_order}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                display_order: parseInt(e.target.value) || 0
                              })}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleEditCancel}>
                              Cancelar
                            </Button>
                            <Button onClick={handleEditSave} disabled={isUpdating}>
                              {isUpdating ? 'Salvando...' : 'Salvar'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(asset)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(asset)}
                    disabled={isDeleting}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Upload */}
      <AssetUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
};