import { api } from './api';
import { ProcessamentoPDFResponse, DadosExtraidosPDF } from '../types/pdf';

const BASE_URL = '/pdf';

export interface CheckInvoiceResponse {
  exists: boolean;
  movimento_id?: number;
  numero_nota_fiscal?: string;
  fornecedor_razao_social?: string;
}

export interface SaveResponse {
  movimento_id: number;
}

export const pdfService = {
  // Analisar PDF sem salvar
  analyzeOnly: async (file: File): Promise<ProcessamentoPDFResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`${BASE_URL}/analyze-only`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Salvar dados analisados
  saveAnalyzedData: async (data: DadosExtraidosPDF): Promise<SaveResponse> => {
    const response = await api.post(`${BASE_URL}/save-analyzed-data`, data);
    return response.data;
  },

  // Verificar se nota existe
  checkInvoiceExists: async (numero_nota_fiscal: string): Promise<CheckInvoiceResponse> => {
    const response = await api.get(`${BASE_URL}/check-invoice-exists`, {
      params: { numero_nota_fiscal }
    });
    return response.data;
  },

  // Deletar nota (soft delete)
  deleteInvoice: async (movimento_id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/delete-invoice/${movimento_id}`);
  }
};

export default pdfService;
