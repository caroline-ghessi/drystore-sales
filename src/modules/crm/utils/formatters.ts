export class CRMFormatters {
  // Formatação de números
  static formatNumber(value: number, options?: {
    decimals?: number;
    compact?: boolean;
  }): string {
    const { decimals = 0, compact = false } = options || {};
    
    if (compact) {
      return new Intl.NumberFormat('pt-BR', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: decimals
      }).format(value);
    }
    
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    }).format(value);
  }

  // Formatação de moeda
  static formatCurrency(value: number, options?: {
    compact?: boolean;
    showSymbol?: boolean;
  }): string {
    const { compact = false, showSymbol = true } = options || {};
    
    if (compact && value >= 1000) {
      if (value >= 1000000) {
        return `${showSymbol ? 'R$ ' : ''}${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${showSymbol ? 'R$ ' : ''}${(value / 1000).toFixed(0)}k`;
      }
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Formatação de porcentagem
  static formatPercentage(value: number, options?: {
    decimals?: number;
    showSign?: boolean;
  }): string {
    const { decimals = 1, showSign = false } = options || {};
    
    const formatted = `${value.toFixed(decimals)}%`;
    
    if (showSign && value > 0) {
      return `+${formatted}`;
    }
    
    return formatted;
  }

  // Formatação de tempo
  static formatDuration(minutes: number): string {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`;
    }
    
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0 ? `${days}d${remainingHours}h` : `${days}d`;
  }

  // Formatação de telefone
  static formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  }

  // Formatação de nome
  static formatName(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Formatação de score
  static formatScore(score: number): {
    formatted: string;
    color: string;
    emoji: string;
  } {
    const rounded = Math.round(score);
    
    let color = 'text-gray-600';
    let emoji = '⭐';
    
    if (rounded >= 80) {
      color = 'text-red-600';
      emoji = '🔥';
    } else if (rounded >= 60) {
      color = 'text-orange-600';
      emoji = '🟠';
    } else if (rounded >= 40) {
      color = 'text-yellow-600';
      emoji = '🟡';
    } else {
      color = 'text-blue-600';
      emoji = '❄️';
    }
    
    return {
      formatted: `${rounded}°`,
      color,
      emoji
    };
  }

  // Formatação de status badge
  static formatStatusBadge(status: string): {
    label: string;
    variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning';
    color: string;
  } {
    const statusMap = {
      'new': { label: 'Novo', variant: 'default' as const, color: 'bg-blue-500' },
      'contacted': { label: 'Contatado', variant: 'secondary' as const, color: 'bg-gray-500' },
      'qualified': { label: 'Qualificado', variant: 'warning' as const, color: 'bg-yellow-500' },
      'proposal': { label: 'Proposta', variant: 'secondary' as const, color: 'bg-purple-500' },
      'negotiation': { label: 'Negociação', variant: 'warning' as const, color: 'bg-orange-500' },
      'won': { label: 'Ganho', variant: 'success' as const, color: 'bg-green-500' },
      'lost': { label: 'Perdido', variant: 'destructive' as const, color: 'bg-red-500' },
      'hot': { label: 'Quente', variant: 'destructive' as const, color: 'bg-red-500' },
      'warm': { label: 'Morno', variant: 'warning' as const, color: 'bg-orange-500' },
      'cold': { label: 'Frio', variant: 'secondary' as const, color: 'bg-blue-500' }
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap['new'];
  }
}