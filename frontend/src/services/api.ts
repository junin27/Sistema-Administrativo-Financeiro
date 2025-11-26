/**
 * Configuração base do cliente HTTP.
 * Configurações centralizadas para comunicação com a API.
 */

import axios from 'axios';
import toast from 'react-hot-toast';
import type { ApiError } from '../types/entities';

// Configuração base do axios
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  globalThis['console']?.debug('[API] VITE_API_URL raw:', import.meta.env.VITE_API_URL);
  globalThis['console']?.debug('[API] window.protocol:', typeof window !== 'undefined' ? window.location.protocol : 'no-window');
  
  // Remove espaços em branco extras
  url = url.trim();

  // Garante que a URL tenha protocolo
  if (!/^https?:\/\//i.test(url)) {
    const protocol = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'https://' : 'http://';
    url = `${protocol}${url}`;
  }

  // Se a página estiver em HTTPS e a API em HTTP, força HTTPS para evitar Mixed Content
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // Substitui http:// por https:// (case insensitive)
    if (/^http:\/\//i.test(url)) {
      url = url.replace(/^http:\/\//i, 'https://');
    }
  }
  
  globalThis['console']?.debug('[API] API Base URL:', url);
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
