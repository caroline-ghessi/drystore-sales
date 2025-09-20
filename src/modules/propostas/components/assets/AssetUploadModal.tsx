import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useTemplateAssets, UploadAssetData } from '../../hooks/useTemplateAssets';
import { ASSET_TYPES, PRODUCT_CATEGORIES } from '@/lib/constants/asset-types';

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Constantes importadas do arquivo centralizado

export const AssetUploadModal: React.FC<AssetUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [templateCategory, setTemplateCategory] = useState('');
  const [assetType, setAssetType] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadAsset, isUploading } = useTemplateAssets();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
          alert(`Arquivo ${file.name} não é um tipo de imagem válido.`);
          return false;
        }
        
        if (file.size > maxSize) {
          alert(`Arquivo ${file.name} é muito grande (máximo 5MB).`);
          return false;
        }
        
        return true;
      });
      
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!templateCategory || !assetType || selectedFiles.length === 0) {
      alert('Por favor, preencha todos os campos obrigatórios e selecione pelo menos uma imagem.');
      return;
    }

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const uploadData: UploadAssetData = {
          file,
          template_category: templateCategory as any,
          asset_type: assetType,
          description: description || undefined,
          display_order: displayOrder + i,
        };

        await new Promise<void>((resolve, reject) => {
          uploadAsset(uploadData, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
      }

      // Reset form
      setSelectedFiles([]);
      setTemplateCategory('');
      setAssetType('');
      setDescription('');
      setDisplayOrder(0);
      
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload de Imagens para Templates</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria do Template *</Label>
            <Select value={templateCategory} onValueChange={setTemplateCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria do produto" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Asset */}
          <div className="space-y-2">
            <Label htmlFor="assetType">Tipo de Imagem *</Label>
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de imagem" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o uso da imagem (opcional)"
              rows={3}
            />
          </div>

          {/* Ordem de exibição */}
          <div className="space-y-2">
            <Label htmlFor="displayOrder">Ordem de Exibição</Label>
            <Input
              id="displayOrder"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              min={0}
              placeholder="0"
            />
          </div>

          {/* Upload de Arquivos */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Imagens *</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Clique para selecionar imagens ou arraste arquivos aqui
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WEBP, SVG até 5MB cada
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Preview dos arquivos selecionados */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Arquivos Selecionados ({selectedFiles.length})</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>
                {isUploading ? 'Fazendo Upload...' : `Upload ${selectedFiles.length} imagem(s)`}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};