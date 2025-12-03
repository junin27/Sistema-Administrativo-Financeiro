import { api } from './api';

export interface InternalStorageResponse {
  message: string;
  inserted?: {
    pessoas: number;
    classificacao: number;
    movimento_contas: number;
    parcelas_contas: number;
    movimento_contas_has_classificacao: number;
  };
  deleted?: {
    movimento_contas_has_classificacao: number;
    parcelas_contas: number;
    movimento_contas: number;
    classificacao: number;
    pessoas: number;
  };
}

class InternalStorageService {
  async insertData(): Promise<InternalStorageResponse> {
    const response = await api.post<InternalStorageResponse>('/internal-storage/seed');
    return response.data;
  }

  async resetData(): Promise<InternalStorageResponse> {
    const response = await api.post<InternalStorageResponse>('/internal-storage/reset');
    return response.data;
  }
}

export default new InternalStorageService();


