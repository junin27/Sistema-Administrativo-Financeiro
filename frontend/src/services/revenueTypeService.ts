import { api } from './api';
import { RevenueType, RevenueTypeCreate, RevenueTypeUpdate, RevenueTypeFilter } from '../types/entities';

export const revenueTypeService = {
  // Listar todos os tipos de receita
  async list(filters?: RevenueTypeFilter) {
    const params = new URLSearchParams();
    
    if (filters?.description) {
      params.append('description', filters.description);
    }
    if (filters?.notes) {
      params.append('notes', filters.notes);
    }
    if (filters?.include_inactive !== undefined) {
      params.append('include_inactive', filters.include_inactive.toString());
    }
    if (filters?.page !== undefined) {
      params.append('page', filters.page.toString());
    }
    if (filters?.size !== undefined) {
      params.append('size', filters.size.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/api/v1/revenue-types/?${queryString}` : '/api/v1/revenue-types/';
    
    const response = await api.get(url);
    return response.data;
  },

  // Buscar tipo de receita por ID
  async getById(id: string) {
    const response = await api.get(`/revenue-types/${id}`);
    return response.data;
  },

  // Criar novo tipo de receita
  async create(data: RevenueTypeCreate) {
    const response = await api.post('/api/v1/revenue-types/', data);
    return response.data;
  },

  // Atualizar tipo de receita
  async update(id: string, data: RevenueTypeUpdate) {
    const response = await api.put(`/revenue-types/${id}`, data);
    return response.data;
  },

  // Excluir tipo de receita (soft delete)
  async delete(id: string) {
    const response = await api.delete(`/revenue-types/${id}`);
    return response.data;
  },

  // Reativar tipo de receita
  async reactivate(id: string) {
    const response = await api.patch(`/revenue-types/${id}/reactivate`);
    return response.data;
  },

  // Buscar tipos de receita por descrição
  async searchByDescription(description: string) {
    const response = await api.get(`/revenue-types/search?description=${encodeURIComponent(description)}`);
    return response.data;
  },

  // Validar se descrição já existe
  async validateDescription(description: string, excludeId?: string) {
    try {
      const searchResults = await this.searchByDescription(description);
      
      if (excludeId) {
        // Se estamos editando, excluir o próprio registro da validação
        return searchResults.some((revenueType: RevenueType) => 
          revenueType.description.toLowerCase() === description.toLowerCase() && 
          revenueType.id !== excludeId
        );
      }
      
      return searchResults.some((revenueType: RevenueType) => 
        revenueType.description.toLowerCase() === description.toLowerCase()
      );
    } catch (error) {
      console.error('Erro ao validar descrição:', error);
      return false;
    }
  }
};