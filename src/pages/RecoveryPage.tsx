import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecoveryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 RecoveryPage - URL completa:', window.location.href);
    console.log('🔍 RecoveryPage - Hash:', window.location.hash);
    console.log('🔍 RecoveryPage - Search:', window.location.search);
    
    // Primeiro tentar buscar nos hash fragments (padrão Supabase)
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    let type: string | null = null;
    
    const hash = window.location.hash.substring(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      accessToken = hashParams.get('access_token');
      refreshToken = hashParams.get('refresh_token');
      type = hashParams.get('type');
      console.log('🔍 Tokens encontrados no HASH:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
    }
    
    // Fallback: tentar query params
    if (!accessToken) {
      const searchParams = new URLSearchParams(window.location.search);
      accessToken = searchParams.get('access_token');
      refreshToken = searchParams.get('refresh_token');
      type = searchParams.get('type');
      console.log('🔍 Tokens encontrados em QUERY PARAMS:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
    }
    
    if (accessToken && refreshToken && type === 'recovery') {
      console.log('✅ RecoveryPage - Tokens válidos, redirecionando para /reset-password');
      // Redirecionar para a página de reset com query params
      const searchParams = new URLSearchParams({
        access_token: accessToken,
        refresh_token: refreshToken,
        type: type
      });
      navigate(`/reset-password?${searchParams.toString()}`, { replace: true });
    } else {
      console.log('❌ RecoveryPage - Tokens inválidos ou ausentes, redirecionando para /auth');
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processando link de recuperação...</p>
      </div>
    </div>
  );
}