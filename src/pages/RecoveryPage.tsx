import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecoveryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Capturar tokens do hash fragment e redirecionar para reset-password
    const hash = window.location.hash.substring(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      
      if (accessToken && refreshToken && type === 'recovery') {
        // Redirecionar para a página de reset com query params
        const searchParams = new URLSearchParams({
          access_token: accessToken,
          refresh_token: refreshToken,
          type: type
        });
        navigate(`/reset-password?${searchParams.toString()}`);
      } else {
        // Se não é recovery, redirecionar para auth
        navigate('/');
      }
    } else {
      navigate('/');
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