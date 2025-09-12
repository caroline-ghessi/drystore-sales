import React from 'react';
import { SafeStorage } from '@/lib/storage';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary capturou erro:', error, errorInfo);
    
    // Se for erro de JSON, limpar storage e tentar recuperar
    if (error.message.includes('not valid JSON') || 
        error.message.includes('JSON.parse') ||
        error.message.includes('[object Object]')) {
      console.log('🧹 Erro de JSON detectado, limpando storage...');
      SafeStorage.cleanCorruptedData();
      
      // Recarregar página após limpar storage
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-destructive">Algo deu errado</h1>
            <p className="text-muted-foreground">
              {this.state.error?.message?.includes('JSON') 
                ? 'Detectamos um problema com os dados armazenados. Limpando automaticamente...'
                : (this.state.error?.message || 'Erro desconhecido')
              }
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}