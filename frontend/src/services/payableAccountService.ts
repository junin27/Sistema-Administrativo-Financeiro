/**
 * Serviço para comunicação com a API de contas a pagar - CRUD completo.
 */

import { api } from './api';
import {
  PayableAccountCreateEtapa2,
  PayableAccountValidationResponse,
  PayableAccountCreateResponse,
  PayableAccountResponse
} from '../types/payableAccounts';

export interface PayableAccountListResponse {
  payable_accounts: PayableAccountResponse[];
  total: number;
  page: number;
  per_page: number;
}

export interface PayableAccountFilters {
  supplier_id?: string;
  invoice_number?: string;
  issue_date_start?: string;
  issue_date_end?: string;
  min_amount?: number;
  max_amount?: number;
  description?: string;
  payment_status?: string;
}

export const payableAccountService = {
  /**
   * Valida os dados de uma conta a pagar antes da criação.
   */
  async validatePayableAccount(data: PayableAccountCreateEtapa2): Promise<PayableAccountValidationResponse> {
    const response = await api.post('/api/v1/payable-accounts/validate', data);
    return response.data;
  },

  /**
   * Cria uma nova conta a pagar com validações automáticas.
   */
  async createPayableAccount(data: PayableAccountCreateEtapa2): Promise<PayableAccountCreateResponse> {
    const response = await api.post('/api/v1/payable-accounts', data);
    return response.data;
  },

  /**
   * Lista todas as contas a pagar com filtros opcionais.
   */
  async listPayableAccounts(
    skip: number = 0,
    limit: number = 20,
    filters?: PayableAccountFilters
  ): Promise<PayableAccountListResponse> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/payable-accounts?${params.toString()}`);
    return response.data;
  },

  /**
   * Busca uma conta a pagar específica por ID.
   */
  async getPayableAccountById(accountId: string): Promise<PayableAccountResponse> {
    const response = await api.get(`/payable-accounts/${accountId}`);
    return response.data;
  },

  /**
   * Atualiza uma conta a pagar existente.
   */
  async updatePayableAccount(
    accountId: string,
    data: PayableAccountCreateEtapa2
  ): Promise<PayableAccountCreateResponse> {
    const response = await api.put(`/payable-accounts/${accountId}`, data);
    return response.data;
  },

  /**
   * Exclui uma conta a pagar (soft delete).
   */
  async deletePayableAccount(accountId: string): Promise<void> {
    await api.delete(`/payable-accounts/${accountId}`);
  }
};