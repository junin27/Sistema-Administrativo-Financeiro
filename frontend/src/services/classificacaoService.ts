import { api } from './api';
import { 
  Classificacao, 
  ClassificacaoCreate, 
  ClassificacaoUpdate, 
  ClassificacaoTipo,
  PaginationResponse,
  PaginationParams 
} from '../types/entities';

const BASE_URL = '/classificacoes/';

export const classificacaoService = {
  // Listar todas com paginação
  getAll: async (params?: PaginationParams & { 
    tipo?: ClassificacaoTipo, 
    include_deleted?: boolean 
  }): Promise<PaginationResponse<Classificacao>> => {
    const path = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    const response = await api.get(path, { params });
    return response.data;
  },

  // Listar por tipo (sem paginação, lista simples)
  getByTipo: async (tipo: ClassificacaoTipo): Promise<Classificacao[]> => {
    const response = await api.get(`${BASE_URL}tipo/${tipo}`);
    return response.data;
  },

  // Listar apenas ativas
  getAtivas: async (): Promise<Classificacao[]> => {
    const response = await api.get(`${BASE_URL}ativas`);
    return response.data;
  },

  // Listar apenas inativas
  getInativas: async (): Promise<Classificacao[]> => {
    const response = await api.get(`${BASE_URL}inativas`);
    return response.data;
  },

  // Buscar por ID
  getById: async (id: number): Promise<Classificacao> => {
    const response = await api.get(`${BASE_URL}${id}`);
    return response.data;
  },

  // Criar nova
  create: async (data: ClassificacaoCreate): Promise<Classificacao> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  // Atualizar
  update: async (id: number, data: ClassificacaoUpdate): Promise<Classificacao> => {
    const response = await api.put(`${BASE_URL}${id}`, data);
    return response.data;
  },

  // Inativar (Soft Delete)
  inativar: async (id: number): Promise<Classificacao> => {
    const response = await api.post(`${BASE_URL}${id}/inativar`);
    return response.data;
  },

  // Reativar
  reativar: async (id: number): Promise<Classificacao> => {
    const response = await api.post(`${BASE_URL}${id}/reativar`);
    return response.data;
  }
};
