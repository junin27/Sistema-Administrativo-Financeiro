import { useState, useCallback, useEffect } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Eye, Code, Save, Layout, Database, Trash2, Search } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { ProcessamentoPDFResponse } from '../../types/pdf';
import pdfService from '../../services/pdfService';
import { GeminiApiKeyModal } from '../../components/GeminiApiKeyModal';
import configService from '../../services/configService';

interface ProcessedData extends ProcessamentoPDFResponse {}

export function PdfProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'formatted' | 'json'>('formatted');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Mostrar modal de API key ao montar o componente
  useEffect(() => {
    setShowApiKeyModal(true);
  }, []);

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
      // USAR NOVO ENDPOINT QUE APENAS ANALISA (NÃO SALVA)
      const data = await pdfService.analyzeOnly(file);
      setProcessedData(data);
      toast.success('PDF analisado! Revise os dados antes de salvar.');
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      const errorMessage = err.response?.data?.detail || err.message || 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleSaveData = async () => {
    if (!processedData?.dados_extraidos) {
      toast.error('Nenhum dado para salvar');
      return;
    }

    setIsSaving(true);
    try {
      const result = await pdfService.saveAnalyzedData(processedData.dados_extraidos);
      toast.success(`Dados salvos com sucesso! Movimento ID: ${result.movimento_id}`);
      
      // Limpar dados após salvar
      setProcessedData(null);
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      const errorMessage = err.response?.data?.detail || err.message || 'Erro ao salvar';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckData = async () => {
    if (!processedData?.dados_extraidos) {
      toast.error('Nenhum dado para consultar');
      return;
    }

    setIsChecking(true);
    try {
      // Verificar se o movimento já existe pelo número da nota fiscal
      // Verifica se numero_nota_fiscal está definido, senão usa string vazia ou trata erro
      const numeroNota = processedData.dados_extraidos.numero_nota_fiscal || '';
      if (!numeroNota) {
         toast.error('Número da nota fiscal não encontrado nos dados extraídos.');
         return;
      }

      const result = await pdfService.checkInvoiceExists(numeroNota);
      
      if (result.exists) {
        toast.success(
          `✅ Dados JÁ estão cadastrados no sistema!\n` +
          `Movimento ID: ${result.movimento_id}\n` +
          `Nota Fiscal: ${result.numero_nota_fiscal}\n` +
          `Fornecedor: ${result.fornecedor_razao_social}`,
          { duration: 6000 }
        );
      } else {
        toast.error(
          `ℹ️ Dados NÃO estão cadastrados no sistema.\n` +
          `Nota Fiscal: ${processedData.dados_extraidos.numero_nota_fiscal} não encontrada.`,
          { 
            duration: 5000,
            style: {
              background: '#3b82f6',
              color: '#fff',
            }
          }
        );
      }
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      const errorMessage = err.response?.data?.detail || err.message || 'Erro ao consultar';
      toast.error(errorMessage);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDeleteData = async () => {
    if (!processedData?.dados_extraidos) {
      toast.error('Nenhum dado para deletar');
      return;
    }

    setIsDeleting(true);
    try {
      const numeroNota = processedData.dados_extraidos.numero_nota_fiscal || '';
      if (!numeroNota) {
         toast.error('Número da nota fiscal não encontrado.');
         return;
      }

      // Verificar se existe antes de deletar
      const checkResult = await pdfService.checkInvoiceExists(numeroNota);

      if (!checkResult.exists) {
        toast.error(
          'Não é possível deletar esses dados, pois eles não estão inseridos no sistema!',
          { duration: 5000 }
        );
        return;
      }

      if (!checkResult.movimento_id) {
         throw new Error('ID do movimento não retornado pela verificação.');
      }

      // Deletar o movimento (soft delete)
      await pdfService.deleteInvoice(checkResult.movimento_id);

      toast.success(
        `✅ Dados deletados com sucesso!\n` +
        `Movimento ID: ${checkResult.movimento_id}\n` +
        `Nota Fiscal: ${checkResult.numero_nota_fiscal}`,
        { duration: 5000 }
      );
      
      // Limpar dados após deletar
      setProcessedData(null);
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      const errorMessage = err.response?.data?.detail || err.message || 'Erro ao deletar';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

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
          {/* Aviso de Duplicata */}
          {processedData.is_duplicate && (
            <div className="card border-yellow-200 bg-yellow-50">
              <div className="card-body">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Nota Fiscal Duplicada
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {processedData.duplicate_message}
                    </p>
                    {processedData.existing_movement_id && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ID do movimento existente: {processedData.existing_movement_id}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className={`card ${processedData.is_duplicate ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {processedData.is_duplicate ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  <h3 className={`text-sm font-medium ${processedData.is_duplicate ? 'text-yellow-800' : 'text-green-800'}`}>
                    {processedData.is_duplicate ? 'Dados da nota fiscal duplicada' : 'PDF processado com sucesso!'}
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
          {viewMode === 'formatted' && (
            <div>
              {/* Bloco de Análise Formatado */}
              {processedData.verificacoes && (
                <div className="card border-gray-300 bg-gray-50">
                  <div className="card-header">
                    <h3 className="text-lg font-medium flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-gray-600" />
                      Análise de Verificação
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="bg-white p-6 rounded-lg border font-mono text-sm whitespace-pre-line">
                      <div className="space-y-4">
                        {/* FORNECEDOR */}
                        <div>
                          <div className="font-bold text-gray-900 mb-1">FORNECEDOR:</div>
                          <div className="text-gray-800 ml-2">
                            {processedData.dados_extraidos?.fornecedor?.razao_social || 'N/A'}
                          </div>
                          <div className="text-gray-700 ml-2">
                            CNPJ: {processedData.dados_extraidos?.fornecedor?.cnpj || 'N/A'}
                          </div>
                          <div className={`font-bold ${
                            processedData.verificacoes.fornecedor.exists
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`}>
                            {processedData.verificacoes.fornecedor.exists ? 'EXISTE' : 'NÃO EXISTE'}
                            {processedData.verificacoes.fornecedor.id && ` – ID: ${processedData.verificacoes.fornecedor.id}`}
                          </div>
                        </div>

                        {/* FATURADO */}
                        <div>
                          <div className="font-bold text-gray-900 mb-1">FATURADO:</div>
                          {processedData.dados_extraidos?.faturado ? (
                            <>
                              <div className="text-gray-800 ml-2">
                                {processedData.dados_extraidos.faturado.nome_completo}
                              </div>
                              <div className="text-gray-700 ml-2">
                                CPF: {processedData.dados_extraidos.faturado.cpf}
                              </div>
                              <div className={`font-bold ${
                                processedData.verificacoes.faturado?.exists
                                  ? 'text-green-700' 
                                  : 'text-red-700'
                              }`}>
                                {processedData.verificacoes.faturado?.exists ? 'EXISTE' : 'NÃO EXISTE'}
                                {processedData.verificacoes.faturado?.id && ` – ID: ${processedData.verificacoes.faturado.id}`}
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-500 ml-2">Não informado</div>
                          )}
                        </div>

                        {/* DESPESAS */}
                        <div>
                          <div className="font-bold text-gray-900 mb-1">DESPESA:</div>
                          {processedData.dados_extraidos?.classificacoes_despesa && processedData.dados_extraidos.classificacoes_despesa.length > 0 ? (
                            processedData.dados_extraidos.classificacoes_despesa.map((classificacao, index) => (
                              <div key={index} className="ml-2 mb-2">
                                <div className="text-gray-800">
                                  {classificacao.categoria || 'N/A'}
                                </div>
                                {classificacao.descricao && (
                                  <div className="text-gray-700 text-xs">
                                    {classificacao.descricao}
                                  </div>
                                )}
                                <div className="text-gray-600 text-xs">
                                  Percentual: {classificacao.percentual}% | Confiança: {(classificacao.confianca * 100).toFixed(1)}%
                                </div>
                                {/* Verificação de existência da despesa */}
                                {processedData.verificacoes?.classificacoes && processedData.verificacoes.classificacoes[index] ? (
                                  <div className={`font-bold ${
                                    processedData.verificacoes.classificacoes[index].exists 
                                      ? 'text-green-700' 
                                      : 'text-red-700'
                                  }`}>
                                    {processedData.verificacoes.classificacoes[index].exists 
                                      ? `EXISTE ID ${processedData.verificacoes.classificacoes[index].id}` 
                                      : 'NÃO EXISTE'
                                    }
                                  </div>
                                ) : (
                                  <div className="font-bold text-blue-700">
                                    CLASSIFICAÇÃO EXTRAÍDA
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-500 ml-2">Nenhuma despesa identificada</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verificações Obrigatórias */}
              {processedData.verificacoes && (
                <div className="card border-blue-200 bg-blue-50">
                  <div className="card-header">
                    <h3 className="text-lg font-medium flex items-center">
                      <Database className="h-5 w-5 mr-2 text-blue-600" />
                      Verificações Detalhadas
                    </h3>
                  </div>
                  <div className="card-body space-y-4">
                    {/* Verificação do Fornecedor */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-gray-900 mb-2">FORNECEDOR:</h4>
                      <p className="text-gray-900">{processedData.dados_extraidos?.fornecedor?.razao_social || 'N/A'}</p>
                      <p className="text-gray-700">CNPJ: {processedData.dados_extraidos?.fornecedor?.cnpj || 'N/A'}</p>
                      <p className={`font-medium mt-2 ${
                        processedData.verificacoes.fornecedor.exists 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {processedData.verificacoes.fornecedor.acao}
                      </p>
                    </div>

                    {/* Verificação do Faturado */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-gray-900 mb-2">FATURADO:</h4>
                      {processedData.dados_extraidos?.faturado ? (
                        <>
                          <p className="text-gray-900">{processedData.dados_extraidos.faturado.nome_completo}</p>
                          <p className="text-gray-700">CPF: {processedData.dados_extraidos.faturado.cpf}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">Não informado</p>
                      )}
                      {processedData.verificacoes?.faturado && (
                        <p className={`font-medium mt-2 ${
                          processedData.verificacoes.faturado.exists 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {processedData.verificacoes.faturado.acao}
                        </p>
                      )}
                    </div>

                    {/* Verificação das Despesas */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-gray-900 mb-2">DESPESAS:</h4>
                      {processedData.dados_extraidos?.classificacoes_despesa && processedData.dados_extraidos.classificacoes_despesa.length > 0 ? (
                        processedData.dados_extraidos.classificacoes_despesa.map((classificacao, index) => (
                          <div key={index} className="mb-3 p-3 bg-gray-50 rounded border-l-4 border-blue-400">
                            <p className="font-medium text-gray-900">{classificacao.categoria || 'N/A'}</p>
                            {classificacao.descricao && (
                              <p className="text-gray-700 text-sm mt-1">{classificacao.descricao}</p>
                            )}
                            <p className="text-gray-600 text-sm mt-1">
                              Percentual: {classificacao.percentual}% | Confiança: {(classificacao.confianca * 100).toFixed(1)}%
                            </p>
                            {/* Status de verificação da despesa */}
                            {processedData.verificacoes?.classificacoes && processedData.verificacoes.classificacoes[index] ? (
                              <p className={`font-medium mt-2 ${
                                processedData.verificacoes.classificacoes[index].exists 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {processedData.verificacoes.classificacoes[index].exists 
                                  ? `Existe ID ${processedData.verificacoes.classificacoes[index].id}` 
                                  : 'Não existe'
                                }
                              </p>
                            ) : (
                              <p className="font-medium mt-2 text-blue-600">
                                Classificação extraída pela IA
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">Nenhuma despesa identificada</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Análise de Dados - Nova div solicitada */}
              {processedData && (
                <div className="card border-purple-200 bg-purple-50">
                  <div className="card-header">
                    <h3 className="text-lg font-medium flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-purple-600" />
                      {processedData.is_duplicate ? 'Verificação de Dados da Nota Duplicada' : 'Análise de Dados'}
                    </h3>
                    {processedData.is_duplicate && (
                      <p className="text-sm text-purple-700 mt-1">
                        Informações sobre a existência dos dados no sistema
                      </p>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="bg-white p-6 rounded-lg border font-mono text-sm whitespace-pre-line">
                      <div className="space-y-4">
                        {/* FORNECEDOR */}
                        <div>
                          <div className="font-bold text-gray-900 mb-1">FORNECEDOR:</div>
                          <div className="text-gray-800 ml-2">
                            {processedData.dados_extraidos?.fornecedor?.razao_social || 'N/A'}
                          </div>
                          <div className="text-gray-700 ml-2">
                            CNPJ: {processedData.dados_extraidos?.fornecedor?.cnpj || 'N/A'}
                          </div>
                          <div className={`font-bold ml-2 ${
                            processedData.verificacoes?.fornecedor.exists 
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`}>
                            {processedData.verificacoes?.fornecedor.acao}
                          </div>
                        </div>

                        {/* FATURADO */}
                        {processedData.dados_extraidos?.faturado && (
                          <div>
                            <div className="font-bold text-gray-900 mb-1">FATURADO:</div>
                            <div className="text-gray-800 ml-2">
                              {processedData.dados_extraidos.faturado.nome_completo || 'N/A'}
                            </div>
                            <div className="text-gray-700 ml-2">
                              CPF: {processedData.dados_extraidos.faturado.cpf || 'N/A'}
                            </div>
                            {processedData.verificacoes?.faturado && (
                              <div className={`font-bold ml-2 ${
                                processedData.verificacoes?.faturado.exists 
                                  ? 'text-green-700' 
                                  : 'text-red-700'
                              }`}>
                                {processedData.verificacoes?.faturado.acao}
                              </div>
                            )}
                          </div>
                        )}

                        {/* PARCELAS */}
                        <div>
                          <div className="font-bold text-gray-900 mb-1">PARCELAS:</div>
                          {processedData.dados_extraidos?.parcelas && processedData.dados_extraidos.parcelas.length > 0 ? (
                            <div className="ml-2 space-y-2">
                              {processedData.dados_extraidos.parcelas.map((parcela, index) => (
                                <div key={index} className="bg-gray-50 p-2 rounded">
                                  <div className="text-gray-800">
                                    Parcela {parcela.numero_parcela} de {processedData.dados_extraidos?.quantidade_parcelas}
                                  </div>
                                  <div className="text-gray-700">
                                    Vencimento: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                                  </div>
                                  <div className="text-gray-700">
                                    Valor: R$ {parcela.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 ml-2">Nenhuma parcela identificada</div>
                          )}
                        </div>

                        {/* CLASSIFICAÇÕES DE DESPESA */}
                        <div>
                          <div className="font-bold text-gray-900 mb-1">CLASSIFICAÇÕES DE DESPESA:</div>
                          {processedData.dados_extraidos?.classificacoes_despesa && processedData.dados_extraidos.classificacoes_despesa.length > 0 ? (
                            <div className="ml-2 space-y-2">
                              {processedData.dados_extraidos.classificacoes_despesa.map((classificacao, index) => (
                                <div key={index} className="bg-gray-50 p-2 rounded">
                                  <div className="text-gray-800 font-medium">
                                    {classificacao.categoria}
                                  </div>
                                  {classificacao.descricao && (
                                    <div className="text-gray-700 text-sm">
                                      {classificacao.descricao}
                                    </div>
                                  )}
                                  <div className="text-gray-600 text-xs">
                                    Percentual: {classificacao.percentual}% | Confiança: {(classificacao.confianca * 100).toFixed(1)}%
                                  </div>
                                  {processedData.verificacoes?.classificacoes && processedData.verificacoes.classificacoes[index] && (
                                    <div className={`font-bold text-sm ${
                                      processedData.verificacoes.classificacoes[index].exists 
                                        ? 'text-green-700' 
                                        : 'text-red-700'
                                    }`}>
                                      {processedData.verificacoes.classificacoes[index].exists 
                                        ? `Existe (ID ${processedData.verificacoes.classificacoes[index].id})` 
                                        : 'Não existe – Será criada'
                                      }
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 ml-2">Nenhuma despesa identificada</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Botões de Ação */}
                    <div className="mt-6 flex justify-center gap-4">
                      {/* Botão CONSULTAR DADOS */}
                      <button
                        onClick={handleCheckData}
                        disabled={isChecking}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isChecking ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Consultando...</span>
                          </>
                        ) : (
                          <>
                            <Search className="h-5 w-5" />
                            <span>Consultar Dados</span>
                          </>
                        )}
                      </button>

                      {/* Botão INSERIR DADOS */}
                      <button
                        onClick={handleSaveData}
                        disabled={isSaving}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Salvando dados...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5" />
                            <span>Inserir Dados</span>
                          </>
                        )}
                      </button>

                      {/* Botão DELETAR DADOS */}
                      <button
                        onClick={handleDeleteData}
                        disabled={isDeleting}
                        className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Deletando...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-5 w-5" />
                            <span>Deletar Dados</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JSON View */}
          {viewMode === 'json' && (
            <div className="card">
                <div className="card-header border-b border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewMode('formatted')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === 'json' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white'
                      }`}
                    >
                      <Eye className="inline h-4 w-4 mr-2" />
                      Visualização Formatada
                    </button>
                    <button
                      onClick={() => setViewMode('json')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === 'json'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Code className="inline h-4 w-4 mr-2" />
                      JSON Bruto
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono">
                      {JSON.stringify(processedData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
          )}
        </div>
      )}

      {/* Modal de API Key */}
      <GeminiApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSuccess={() => {
          toast.success('API key configurada! Agora você pode processar PDFs.');
        }}
      />
    </div>
  );
}
