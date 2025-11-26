import { api } from './api';

export interface RagSource {
  title: string;
  snippet: string;
  score?: number;
}

export interface RagResponse {
  answer: string;
  strategy: 'RAG Simples' | 'RAG Embeddings';
  sources?: RagSource[];
  meta?: Record<string, unknown>;
}

class RagService {
  private baseUrl = '/rag';

  async askSimple(question: string): Promise<RagResponse> {
    const response = await api.post(`${this.baseUrl}/simple`, { question });
    return response.data;
  }

  async askEmbeddings(question: string): Promise<RagResponse> {
    const response = await api.post(`${this.baseUrl}/embeddings/query`, { question });
    return response.data;
  }
}

export default new RagService();
