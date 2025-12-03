import { api } from './api';

export interface GeminiApiKeyResponse {
  success: boolean;
  message: string;
  has_api_key: boolean;
}

export interface GeminiApiKeyRequest {
  api_key: string;
}

class ConfigService {
  /**
   * Atualiza a API key do Gemini no backend.
   */
  async updateGeminiApiKey(apiKey: string): Promise<GeminiApiKeyResponse> {
    const response = await api.post<GeminiApiKeyResponse>('/config/gemini-api-key', {
      api_key: apiKey,
    });
    return response.data;
  }

  /**
   * Verifica se há uma API key do Gemini configurada.
   */
  async checkGeminiApiKey(): Promise<GeminiApiKeyResponse> {
    const response = await api.get<GeminiApiKeyResponse>('/config/gemini-api-key');
    return response.data;
  }
}

export default new ConfigService();

