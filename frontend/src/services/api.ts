/**
 * Configuração base do cliente HTTP.
 * Configurações centralizadas para comunicação com a API.
 */

import axios from 'axios';
import toast from 'react-hot-toast';
import type { ApiResponse, ApiError } from '../types/entities';

// Configuração base do axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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
    return response;
  },
  (error) => {
    // Tratamento global de erros
    if (error.response) {
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
      toast.error('Erro de conexão com o servidor');
    } else {
      toast.error('Erro inesperado');
    }
    
    return Promise.reject(new Error(error.message || 'Unknown error'));
  }
);

// Funções auxiliares para requests tipados
export async function get<T>(url: string, params?: Record<string, any>): Promise<T> {
  const response = await api.get<ApiResponse<T>>(url, { params });
  return response.data.data as T;
}

export async function post<T>(url: string, data?: any): Promise<T> {
  const response = await api.post<ApiResponse<T>>(url, data);
  return response.data.data as T;
}

export async function put<T>(url: string, data?: any): Promise<T> {
  const response = await api.put<ApiResponse<T>>(url, data);
  return response.data.data as T;
}

export async function patch<T>(url: string, data?: any): Promise<T> {
  const response = await api.patch<ApiResponse<T>>(url, data);
  return response.data.data as T;
}

export async function del<T>(url: string): Promise<T> {
  const response = await api.delete<ApiResponse<T>>(url);
  return response.data.data as T;
}

// Função para upload de arquivos
export async function uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<ApiResponse<T>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
  
  return response.data.data as T;
}
