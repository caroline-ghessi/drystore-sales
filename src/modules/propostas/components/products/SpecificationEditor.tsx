import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpCircle, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { 
  getSpecificationSchema, 
  validateProductSpecifications, 
  SpecificationField,
  ProductSpecificationSchema 
} from '../../utils/productSpecificationSchemas';
import { UnifiedProductCategory } from '../../hooks/useUnifiedProducts';

interface SpecificationEditorProps {
  category: UnifiedProductCategory;
  specifications: any;
  onChange: (specifications: any) => void;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
  compact?: boolean;
}

export function SpecificationEditor({
  category,
  specifications,
  onChange,
  onSave,
  onCancel,
  readOnly = false,
  compact = false
}: SpecificationEditorProps) {
  const [localSpecs, setLocalSpecs] = useState(specifications || {});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const schema = getSpecificationSchema(category);

  useEffect(() => {
    setLocalSpecs(specifications || {});
    setHasChanges(false);
  }, [specifications]);

  useEffect(() => {
    if (schema) {
      const validation = validateProductSpecifications(category, localSpecs);
      setValidationErrors(validation.errors);
    }
  }, [localSpecs, category, schema]);

  if (!schema) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Não há especificações editáveis disponíveis para esta categoria de produto.
        </AlertDescription>
      </Alert>
    );
  }

  const handleFieldChange = (fieldKey: string, value: any) => {
    if (readOnly) return;

    const newSpecs = { ...localSpecs, [fieldKey]: value };
    setLocalSpecs(newSpecs);
    setHasChanges(true);
    onChange(newSpecs);
  };

  const handleSave = () => {
    if (onSave && validationErrors.length === 0) {
      onSave();
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    setLocalSpecs(specifications || {});
    setHasChanges(false);
    if (onCancel) {
      onCancel();
    }
  };

  const renderField = (field: SpecificationField) => {
    const value = localSpecs[field.key];
    const hasError = validationErrors.some(error => error.includes(field.label));

    const fieldContent = (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={field.key} className={`text-sm font-medium ${hasError ? 'text-destructive' : ''}`}>
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
            {field.unit && <Badge variant="outline" className="text-xs ml-1">{field.unit}</Badge>}
          </Label>
          {field.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">{field.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {field.type === 'number' && (
          <Input
            id={field.key}
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value ? Number(e.target.value) : '')}
            min={field.min}
            max={field.max}
            disabled={readOnly}
            className={hasError ? 'border-destructive' : ''}
            placeholder={field.defaultValue?.toString() || ''}
          />
        )}

        {field.type === 'text' && (
          <Input
            id={field.key}
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={readOnly}
            className={hasError ? 'border-destructive' : ''}
            placeholder={field.defaultValue || ''}
          />
        )}

        {field.type === 'select' && field.options && (
          <Select 
            value={value || field.defaultValue || ''} 
            onValueChange={(newValue) => handleFieldChange(field.key, newValue)}
            disabled={readOnly}
          >
            <SelectTrigger className={hasError ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione uma opção..." />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === 'boolean' && (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.key}
              checked={value || field.defaultValue || false}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
              disabled={readOnly}
            />
            <Label htmlFor={field.key} className="text-sm text-muted-foreground">
              {value ? 'Sim' : 'Não'}
            </Label>
          </div>
        )}

        {field.type === 'array' && (
          <Textarea
            id={field.key}
            value={Array.isArray(value) ? value.join(', ') : value || ''}
            onChange={(e) => {
              const arrayValue = e.target.value.split(',').map(item => item.trim()).filter(item => item);
              handleFieldChange(field.key, arrayValue);
            }}
            disabled={readOnly}
            className={hasError ? 'border-destructive' : ''}
            placeholder="Separe os itens por vírgula..."
            rows={3}
          />
        )}
      </div>
    );

    return fieldContent;
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schema.fields.map(renderField)}
        </div>
        
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {!readOnly && (onSave || onCancel) && (
          <div className="flex gap-2 pt-2">
            {onSave && (
              <Button 
                onClick={handleSave} 
                disabled={validationErrors.length > 0 || !hasChanges}
                size="sm"
              >
                <Save className="h-3 w-3 mr-1" />
                Salvar
              </Button>
            )}
            {onCancel && hasChanges && (
              <Button onClick={handleCancel} variant="outline" size="sm">
                <RotateCcw className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{schema.title}</CardTitle>
        <CardDescription>{schema.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schema.fields.map(renderField)}
        </div>

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {!readOnly && (onSave || onCancel) && (
          <>
            <Separator />
            <div className="flex justify-end gap-2">
              {onCancel && hasChanges && (
                <Button onClick={handleCancel} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
              {onSave && (
                <Button 
                  onClick={handleSave} 
                  disabled={validationErrors.length > 0 || !hasChanges}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Especificações
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}