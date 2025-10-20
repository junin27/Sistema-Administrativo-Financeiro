/**
 * Serviço para comunicação com a API de contas a pagar - Etapa 2.
 */

import { api } from './api';
import {
  PayableAccountCreateEtapa2,
  PayableAccountValidationResponse,
  PayableAccountCreateResponse
} from '../types/payableAccounts';

export const payableAccountService = {
  /**
   * Valida os dados de uma conta a pagar antes da criação.
   */
  async validatePayableAccount(data: PayableAccountCreateEtapa2): Promise<PayableAccountValidationResponse> {
    const response = await api.post('/payable-accounts/validate', data);
    return response.data;
  },

  /**
   * Cria uma nova conta a pagar com validações automáticas.
   */
  async createPayableAccount(data: PayableAccountCreateEtapa2): Promise<PayableAccountCreateResponse> {
    const response = await api.post('/payable-accounts', data);
    return response.data;
  }
};