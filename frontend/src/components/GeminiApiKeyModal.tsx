import { useState, useEffect } from 'react';
import { X, Key, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import configService from '../services/configService';
import toast from 'react-hot-toast';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GeminiApiKeyModal({ isOpen, onClose, onSuccess }: GeminiApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkApiKey();
    }
  }, [isOpen]);

  const checkApiKey = async () => {
    setIsChecking(true);
    try {
      const response = await configService.checkGeminiApiKey();
      if (response.has_api_key) {
        // Se já tem API key, fecha o modal após um breve delay
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao verificar API key:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma API key');
      return;
    }

    // Validação básica do formato
    if (!apiKey.trim().startsWith('AIza')) {
      toast.error('Formato inválido. A API key do Google Gemini deve começar com "AIza"');
      return;
    }

    setIsLoading(true);
    try {
      await configService.updateGeminiApiKey(apiKey.trim());
      toast.success('API key configurada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao configurar API key';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Configurar API Key do Gemini</h2>
              <p className="text-sm text-gray-500">Necessário para processar PDFs e consultas RAG</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isChecking ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">Verificando configuração...</span>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Como obter sua API Key:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Acesse o Google AI Studio</li>
                      <li>Crie ou selecione um projeto</li>
                      <li>Gere uma nova API key</li>
                    </ol>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Abrir Google AI Studio
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                    API Key do Google Gemini
                  </label>
                  <input
                    type="password"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Sua API key será armazenada apenas em memória e não será salva permanentemente.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isLoading || !apiKey.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Configurar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

