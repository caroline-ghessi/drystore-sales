// Utility functions for dashboard calculations and formatting

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getDaysRemaining(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function getProgressVariant(percentage: number): 'success' | 'warning' | 'danger' | 'default' {
  if (percentage >= 100) return 'success';
  if (percentage >= 70) return 'default';
  if (percentage >= 50) return 'warning';
  return 'danger';
}

export function getProgressMessage(percentage: number, remaining: number): string {
  if (percentage >= 100) {
    return 'Meta alcançada! Parabéns! 🎉';
  }
  
  if (percentage >= 90) {
    return `Quase lá! Faltam ${formatCurrency(remaining)}`;
  }
  
  if (percentage >= 70) {
    return `No caminho certo! Faltam ${formatCurrency(remaining)}`;
  }
  
  if (percentage >= 50) {
    return `Acelere o ritmo! Faltam ${formatCurrency(remaining)}`;
  }
  
  return `Precisa acelerar! Faltam ${formatCurrency(remaining)}`;
}

export function getAlertLevel(percentage: number): 'success' | 'warning' | 'danger' {
  if (percentage >= 70) return 'success';
  if (percentage >= 50) return 'warning';
  return 'danger';
}

export function generateMiniChartData(days: number = 7): number[] {
  // Generate mock data for mini charts
  const baseValue = Math.random() * 10000 + 5000;
  const data: number[] = [];
  
  for (let i = 0; i < days; i++) {
    const variation = (Math.random() - 0.5) * 2000;
    const value = Math.max(baseValue + variation, 1000);
    data.push(Math.round(value));
  }
  
  return data;
}

export function calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable';
  
  const first = data[0];
  const last = data[data.length - 1];
  const threshold = first * 0.05; // 5% threshold
  
  if (last > first + threshold) return 'up';
  if (last < first - threshold) return 'down';
  return 'stable';
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'aberta': 'text-blue-600 bg-blue-50',
    'em-analise': 'text-yellow-600 bg-yellow-50',
    'aguardando-aprovacao': 'text-orange-600 bg-orange-50',
    'negociacao': 'text-purple-600 bg-purple-50',
    'aceita': 'text-green-600 bg-green-50',
    'recusada': 'text-red-600 bg-red-50',
    'expirada': 'text-gray-600 bg-gray-50'
  };
  
  return statusMap[status] || 'text-gray-600 bg-gray-50';
}

export function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'aberta': 'Em Aberto',
    'em-analise': 'Em Análise',
    'aguardando-aprovacao': 'Aguardando Aprovação',
    'negociacao': 'Em Negociação',
    'aceita': 'Aceita',
    'recusada': 'Recusada',
    'expirada': 'Expirada'
  };
  
  return statusMap[status] || status;
}