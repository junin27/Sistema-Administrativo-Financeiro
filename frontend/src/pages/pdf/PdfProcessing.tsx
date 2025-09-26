import { useState, useCallback } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Eye, Code, Layout } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface ProcessedData {
  dados_extraidos: {
    numero_nota_fiscal: string;
    data_emissao: string;
    descricao_produtos: string;
    valor_total: number;
    quantidade_parcelas: number;
    fornecedor: {
      razao_social: string;
      nome_fantasia?: string;
      cnpj: string;
    };
    faturado?: {
      nome_completo: string;
      cpf: string;
    };
    parcelas: Array<{
      numero_parcela: number;
      data_vencimento: string;
      valor_parcela: number;
    }>;
    classificacoes_despesa: Array<{
      categoria: string;
      descricao: string;
      percentual: number;
      confianca: number;
    }>;
    confianca_geral: number;
    observacoes_ia?: string;
  };
}

type ViewMode = 'formatted' | 'json';

export function PdfProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('formatted');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione apenas arquivos PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessedData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/pdf/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao processar PDF');
      }

      const data = await response.json();
      setProcessedData(data);
      toast.success('PDF processado com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FileText className="h-8 w-8 mr-3 text-blue-600" />
          Processamento de PDF com IA
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Faça upload de notas fiscais em PDF para extração automática de dados usando Google Gemini AI
        </p>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-body">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            
            {isProcessing ? (
              <div className="space-y-4">
                <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Processando PDF...
                  </h3>
                  <p className="text-sm text-gray-500">
                    A IA está extraindo informações da nota fiscal
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Clique ou arraste um PDF'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Máximo 10MB • Apenas arquivos PDF
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card border-red-200 bg-red-50">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Erro no processamento</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processed Data Display */}
      {processedData && (
        <div className="space-y-6">
          <div className="card border-green-200 bg-green-50">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="text-sm font-medium text-green-800">
                    PDF processado com sucesso!
                  </h3>
                </div>
                
                {/* Toggle de visualização */}
                <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border">
                  <button
                    onClick={() => setViewMode('formatted')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'formatted'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Layout className="h-4 w-4" />
                    <span>Formatado</span>
                  </button>
                  <button
                    onClick={() => setViewMode('json')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'json'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Code className="h-4 w-4" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visualização Condicional */}
          {viewMode === 'formatted' ? (
            <>
              {/* Supplier Info */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium">Dados do Fornecedor</h3>
                </div>
                <div className="card-body space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Razão Social</label>
                    <p className="text-gray-900">{processedData.dados_extraidos?.fornecedor?.razao_social || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">CNPJ</label>
                    <p className="text-gray-900">{processedData.dados_extraidos?.fornecedor?.cnpj || 'N/A'}</p>
                  </div>
                  {processedData.dados_extraidos?.fornecedor?.nome_fantasia && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nome Fantasia</label>
                      <p className="text-gray-900">{processedData.dados_extraidos.fornecedor.nome_fantasia}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Info */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium">Dados da Nota Fiscal</h3>
                </div>
                <div className="card-body space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Número</label>
                      <p className="text-gray-900">{processedData.dados_extraidos?.numero_nota_fiscal || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data de Emissão</label>
                      <p className="text-gray-900">{processedData.dados_extraidos?.data_emissao || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Qtd Parcelas</label>
                      <p className="text-gray-900">{processedData.dados_extraidos?.quantidade_parcelas || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Confiança IA</label>
                      <p className="text-blue-600 font-medium">{Math.round((processedData.dados_extraidos?.confianca_geral || 0) * 100)}%</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Valor Total</label>
                    <p className="text-xl font-bold text-green-600">
                      R$ {(processedData.dados_extraidos?.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Descrição dos Produtos</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{processedData.dados_extraidos?.descricao_produtos || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Faturado Info */}
              {processedData.dados_extraidos?.faturado && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium">Dados do Faturado</h3>
                  </div>
                  <div className="card-body space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                      <p className="text-gray-900">{processedData.dados_extraidos.faturado.nome_completo}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">CPF</label>
                      <p className="text-gray-900">{processedData.dados_extraidos.faturado.cpf}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Parcelas */}
              {processedData.dados_extraidos?.parcelas && processedData.dados_extraidos.parcelas.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium">Parcelas ({processedData.dados_extraidos.quantidade_parcelas})</h3>
                  </div>
                  <div className="card-body">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Parcela
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Data Vencimento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Valor
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {processedData.dados_extraidos.parcelas.map((parcela, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-sm text-gray-900">{parcela.numero_parcela}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{parcela.data_vencimento}</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                R$ {parcela.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Classifications */}
              {processedData.dados_extraidos?.classificacoes_despesa && processedData.dados_extraidos.classificacoes_despesa.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium">Classificações de Despesa</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      {processedData.dados_extraidos.classificacoes_despesa.map((classificacao, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <div className="flex-1">
                            <p className="font-semibold text-blue-900">{classificacao.categoria}</p>
                            <p className="text-sm text-blue-700">{classificacao.descricao}</p>
                            <p className="text-xs text-blue-600 mt-1">Percentual: {classificacao.percentual}%</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {Math.round(classificacao.confianca * 100)}% confiança
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Observações da IA */}
              {processedData.dados_extraidos?.observacoes_ia && (
                <div className="card border-yellow-200 bg-yellow-50">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-yellow-800">Observações da IA</h3>
                  </div>
                  <div className="card-body">
                    <p className="text-yellow-700">{processedData.dados_extraidos.observacoes_ia}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Visualização JSON */
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Dados em Formato JSON
                </h3>
              </div>
              <div className="card-body">
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(processedData.dados_extraidos, null, 2)}
                  </pre>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>Dados extraídos em formato JSON</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(processedData.dados_extraidos, null, 2));
                      toast.success('JSON copiado para a área de transferência!');
                    }}
                    className="btn btn-sm btn-secondary"
                  >
                    Copiar JSON
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button className="btn btn-primary">
              <CheckCircle className="h-4 w-4 mr-2" />
              Salvar como Conta a Pagar
            </button>
            <button className="btn btn-secondary">
              <Eye className="h-4 w-4 mr-2" />
              Revisar Dados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
