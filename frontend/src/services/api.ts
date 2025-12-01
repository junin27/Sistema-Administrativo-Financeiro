/**
 * Configuração base do cliente HTTP.
 * Configurações centralizadas para comunicação com a API.
 */

import axios from 'axios';
import toast from 'react-hot-toast';
import type { ApiError } from '../types/entities';

// Configuração base do axios
const getBaseUrl = () => {
  // No navegador (client-side)
  if (typeof window !== 'undefined') {
    // Log de debug para diagnóstico
    globalThis['console']?.log('[API] Debug Info:', {
      DEV: import.meta.env.DEV,
      MODE: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      VITE_API_URL: import.meta.env.VITE_API_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
      VITE_API_URL_VALUE: import.meta.env.VITE_API_URL,
      hostname: window.location.hostname
    });
    
    // Se VITE_API_URL estiver definida, sempre usa ela (mesmo em dev)
    // Isso permite testar produção localmente se necessário
    let url = import.meta.env.VITE_API_URL;
    
    if (url && url.trim() !== '') {
      // VITE_API_URL está definida, usa ela
      url = url.trim();
      
      // Garante que a URL tenha o protocolo
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`; // Em produção, assume HTTPS
      }
      
      // Garante que termine com /api/v1
      if (!url.endsWith('/api/v1')) {
        url = url.replace(/\/+$/, '') + '/api/v1';
      }
      
      globalThis['console']?.log('[API] Usando VITE_API_URL:', url);
      return url;
    }
    
    // Se VITE_API_URL não estiver definida
    if (import.meta.env.DEV) {
      // Em desenvolvimento, usa o proxy do Vite
      const url = '/api/v1';
      globalThis['console']?.log('[API] Modo DEV - usando proxy Vite:', url);
      return url;
    }
    
    // Em produção sem VITE_API_URL, mostra erro
    const errorMsg = 'VITE_API_URL não está configurada! Configure esta variável de ambiente no Vercel com a URL completa do backend (ex: https://seu-backend.com/api/v1)';
    globalThis['console']?.error('[API] ERRO:', errorMsg);
    globalThis['console']?.error('[API] Variáveis de ambiente disponíveis:', {
      DEV: import.meta.env.DEV,
      MODE: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      VITE_API_URL: import.meta.env.VITE_API_URL
    });
    toast.error('Erro de configuração: URL do backend não configurada. Verifique VITE_API_URL.');
    
    // Fallback apenas para desenvolvimento local
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      url = 'http://localhost:8000/api/v1';
      globalThis['console']?.warn('[API] Usando fallback localhost:', url);
      return url;
    }
    
    // Em produção sem VITE_API_URL, não podemos fazer nada
    throw new Error(errorMsg);
  }
  
  // Server-side (SSR): usa a URL completa
  let url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  url = url.trim();
  
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  
  globalThis['console']?.debug('[API] API Base URL (server):', url);
  return url;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 120000, // 2 minutos (para processamento de PDF com retry do Gemini)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptador para garantir HTTPS em todas as requisições
api.interceptors.request.use((config) => {
  const originalBase = config.baseURL;
  // Se a URL for absoluta e começar com http, força https quando página estiver em https
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && config.url?.startsWith('http://')) {
    config.url = config.url.replace(/^http:\/\//i, 'https://');
    globalThis['console']?.warn('[API] absolute URL forced to https:', config.url);
  }

  if (config.url && !config.url.startsWith('http')) {
    // Se a URL for relativa, o axios usa a baseURL. 
    // Vamos garantir que a baseURL esteja correta no momento da requisição também
    if (config.baseURL && typeof window !== 'undefined' && window.location.protocol === 'https:') {
      if (/^http:\/\//i.test(config.baseURL)) {
        config.baseURL = config.baseURL.replace(/^http:\/\//i, 'https://');
      }
    }
  }
  if (originalBase !== config.baseURL) {
    globalThis['console']?.warn('[API] baseURL forced to https:', originalBase, '->', config.baseURL);
  }
  globalThis['console']?.debug('[API] request config:', {
    method: config.method,
    baseURL: config.baseURL,
    url: config.url,
    fullURL: (() => {
      try {
        if (config.url?.startsWith('http')) return config.url;
        if (config.baseURL) return new URL(config.url || '', config.baseURL).href;
        return config.url;
      } catch {
        return config.url;
      }
    })()
  });
  return config;
});

// Interceptador de requisições
api.interceptors.request.use(
  (config) => {
    // Aqui pode adicionar token de autenticação quando implementar
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(new Error(error));
  }
);

// Interceptador de respostas
api.interceptors.response.use(
  (response) => {
    // Detecta se a resposta é HTML (indicando que foi para o frontend ao invés do backend)
    const contentType = response.headers['content-type'] || '';
    const isHtml = contentType.includes('text/html') || 
                   (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype html>'));
    
    if (isHtml) {
      const errorMsg = `Erro: A requisição foi para o frontend ao invés do backend. Verifique a configuração de VITE_API_URL. URL usada: ${response.config?.baseURL}${response.config?.url}`;
      globalThis['console']?.error('[API] HTML response detected (wrong endpoint):', {
        status: response.status,
        method: response.config?.method,
        baseURL: response.config?.baseURL,
        url: response.config?.url,
        fullURL: response.config?.url?.startsWith('http') 
          ? response.config.url 
          : `${response.config?.baseURL}${response.config?.url}`
      });
      toast.error('Erro de configuração: Backend não encontrado. Verifique VITE_API_URL.');
      return Promise.reject(new Error(errorMsg));
    }
    
    globalThis['console']?.debug('[API] response:', {
      status: response.status,
      method: response.config?.method,
      baseURL: response.config?.baseURL,
      url: response.config?.url
    });
    return response;
  },
  (error) => {
    // Tratamento global de erros
    if (error.response) {
      globalThis['console']?.error('[API] error response:', {
        status: error.response.status,
        data: error.response.data,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        url: error.config?.url
      });
      const status = error.response.status;
      const data = error.response.data as ApiError;
      
      switch (status) {
        case 400:
          toast.error(data.detail || 'Dados inválidos');
          break;
        case 401:
          toast.error('Não autorizado');
          // Redirecionar para login se implementar autenticação
          break;
        case 403:
          toast.error('Acesso negado');
          break;
        case 404:
          toast.error('Recurso não encontrado');
          break;
        case 409:
          // Erro de conflito (duplicação)
          toast.error(data.detail || 'Recurso já existe');
          break;
        case 422:
          // Erros de validação
          if (data.errors && data.errors.length > 0) {
            const errorMessages = data.errors.map(err => err.msg).join(', ');
            toast.error(`Erro de validação: ${errorMessages}`);
          } else {
            toast.error(data.detail || 'Erro de validação');
          }
          break;
        case 500:
          toast.error('Erro interno do servidor');
          break;
        default:
          toast.error('Erro inesperado');
      }
    } else if (error.request) {
      globalThis['console']?.error('[API] error request (no response):', {
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        url: error.config?.url
      });
      toast.error('Erro de conexão com o servidor');
    } else {
      globalThis['console']?.error('[API] error general:', {
        message: error.message
      });
      toast.error('Erro inesperado');
    }
    
    return Promise.reject(error);
  }
);
