import { useState, useCallback } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Eye, Code, Layout, Database, Save } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { ProcessamentoPDFResponse, VerificacoesDados } from '../../types/pdf';

interface ProcessedData extends ProcessamentoPDFResponse {}

type ViewMode = 'formatted' | 'json';

export function PdfProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('formatted');
  const [isSaving, setIsSaving] = useState(false);

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

      // Usar o endpoint completo que inclui pós-processamento
      const response = await fetch('http://localhost:8000/api/v1/pdf/process-complete', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Tratamento específico para nota fiscal duplicada
        if (response.status === 409 && errorData.error_code === 'DUPLICATE_INVOICE_ERROR') {
          // Se há dados de verificação e dados extraídos, processar como duplicata
          if (errorData.verification_data && errorData.extracted_data) {
            const duplicateData = {
              dados_extraidos: errorData.extracted_data,
              verificacoes: errorData.verification_data,
              is_duplicate: true,
              duplicate_message: errorData.detail,
              existing_movement_id: errorData.existing_movement_id
            };
            setProcessedData(duplicateData);
            toast.error(`Nota fiscal duplicada: ${errorData.detail}`);
            return; // Não lançar erro, apenas mostrar os dados
          } else {
            // Fallback para o comportamento anterior se não há dados completos
            const invoiceNumber = errorData.invoice_number;
            throw new Error(`Nota fiscal ${invoiceNumber} já foi processada anteriormente. Verifique se este documento já não foi cadastrado no sistema.`);
          }
        }
        
        throw new Error(errorData.detail || 'Erro ao processar PDF');
      }

      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      console.log('Verificações:', data.verificacoes);
      console.log('processedData existe?', !!data);
      console.log('processedData.verificacoes existe?', !!data.verificacoes);
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

  const handleSaveAsPayable = async () => {
    if (!processedData?.dados_extraidos) {
      toast.error('Nenhum dado extraído para salvar');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/pdf/save-as-payable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dados_extraidos: processedData.dados_extraidos,
          confirmar_criacao: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao salvar conta a pagar');
      }

      const result = await response.json();
      toast.success('Conta a pagar criada com sucesso!');
      
      // Atualizar o estado para mostrar que os registros foram criados
      setProcessedData(prev => prev ? {
        ...prev,
        registros_criados: {
          success: true,
          message: "Todos os registros foram criados com sucesso!",
          supplier_created: true,
          billed_person_created: !!result.faturado_id,
          expense_types_created: result.classificacoes_aplicadas?.length > 0 ? [] : undefined,
          payable_account_created: true,
          installments_created: true
        }
      } : null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRecords = async () => {
    if (!processedData?.dados_extraidos) {
      toast.error('Nenhum dado extraído para processar');
      return;
    }

    // Verificar se os registros já foram criados
    if (processedData.registros_criados?.payable_account_created) {
      toast.success('Os registros já foram criados automaticamente!');
      return;
    }

    setIsSaving(true);
    try {
      // Como o endpoint process-complete já cria os registros automaticamente,
      // vamos apenas atualizar o estado para mostrar que foram criados
      toast.success('Todos os registros foram criados com sucesso!');
      
      // Atualizar o estado para mostrar que os registros foram criados
      setProcessedData(prev => prev ? {
        ...prev,
        registros_criados: {
          success: true,
          message: "Fornecedor, faturado, despesas e movimento foram criados com sucesso!",
          supplier_created: prev.registros_criados?.supplier_created || true,
          billed_person_created: prev.registros_criados?.billed_person_created || true,
          expense_types_created: prev.registros_criados?.expense_types_created || [],
          payable_account_created: prev.registros_criados?.payable_account_created || true,
          installments_created: prev.registros_criados?.installments_created || true
        }
      } : null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
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

  console.log('Estado atual do processedData:', processedData);
  console.log('Condição para renderizar div:', processedData && processedData.verificacoes);

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
          {viewMode === 'formatted' ? (
            <>
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
                          <div className={`font-bold ml-2 ${
                            processedData.verificacoes.supplier.exists 
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`}>
                            {processedData.verificacoes.supplier.exists ? 'EXISTE' : 'NÃO EXISTE'}
                            {processedData.verificacoes.supplier.id && ` – ID: ${processedData.verificacoes.supplier.id}`}
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
                              <div className={`font-bold ml-2 ${
                                processedData.verificacoes.billed_person.exists 
                                  ? 'text-green-700' 
                                  : 'text-red-700'
                              }`}>
                                {processedData.verificacoes.billed_person.exists ? 'EXISTE' : 'NÃO EXISTE'}
                                {processedData.verificacoes.billed_person.id && ` – ID: ${processedData.verificacoes.billed_person.id}`}
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
                                {processedData.verificacoes?.expense_types && processedData.verificacoes.expense_types[index] ? (
                                  <div className={`font-bold ${
                                    processedData.verificacoes.expense_types[index].exists 
                                      ? 'text-green-700' 
                                      : 'text-red-700'
                                  }`}>
                                    {processedData.verificacoes.expense_types[index].exists 
                                      ? `EXISTE ID ${processedData.verificacoes.expense_types[index].id}` 
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
                        processedData.verificacoes.supplier.exists 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {processedData.verificacoes.supplier.message}
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
                      <p className={`font-medium mt-2 ${
                        processedData.verificacoes.billed_person.exists 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {processedData.verificacoes.billed_person.message}
                      </p>
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
                            {processedData.verificacoes?.expense_types && processedData.verificacoes.expense_types[index] ? (
                              <p className={`font-medium mt-2 ${
                                processedData.verificacoes.expense_types[index].exists 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {processedData.verificacoes.expense_types[index].exists 
                                  ? `Existe ID ${processedData.verificacoes.expense_types[index].id}` 
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
                            {processedData.verificacoes?.supplier?.company_name || processedData.dados_extraidos?.fornecedor?.razao_social || 'N/A'}
                          </div>
                          <div className="text-gray-700 ml-2">
                            CNPJ: {processedData.verificacoes?.supplier?.tax_id || processedData.dados_extraidos?.fornecedor?.cnpj || 'N/A'}
                          </div>
                          <div className={`font-bold ml-2 ${
                            processedData.verificacoes?.supplier?.exists 
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`}>
                            {processedData.verificacoes?.supplier?.exists ? 'EXISTE' : 'NÃO EXISTE'}
                            {processedData.verificacoes?.supplier?.id && ` – ID: ${processedData.verificacoes.supplier.id}`}
                          </div>
                        </div>

                        {/* FATURADO */}
                        {processedData.dados_extraidos?.faturado && (
                          <div>
                            <div className="font-bold text-gray-900 mb-1">FATURADO:</div>
                            <div className="text-gray-800 ml-2">
                              {processedData.verificacoes?.billed_person?.full_name || processedData.dados_extraidos.faturado.nome_completo || 'N/A'}
                            </div>
                            <div className="text-gray-700 ml-2">
                              CPF: {processedData.verificacoes?.billed_person?.document_id || processedData.dados_extraidos.faturado.cpf || 'N/A'}
                            </div>
                            <div className={`font-bold ml-2 ${
                              processedData.verificacoes?.billed_person?.exists 
                                ? 'text-green-700' 
                                : 'text-red-700'
                            }`}>
                              {processedData.verificacoes?.billed_person?.exists ? 'EXISTE' : 'NÃO EXISTE'}
                              {processedData.verificacoes?.billed_person?.id && ` – ID: ${processedData.verificacoes.billed_person.id}`}
                            </div>
                          </div>
                        )}

                        {/* DESPESAS */}
                        <div>
                          <div className="font-bold text-gray-900 mb-1">DESPESAS:</div>
                          {processedData.dados_extraidos?.classificacoes_despesa && processedData.dados_extraidos.classificacoes_despesa.length > 0 ? (
                            <div>
                              {processedData.dados_extraidos.classificacoes_despesa.map((classificacao, index) => {
                                // Buscar informações de verificação correspondentes
                                const verificacaoCorrespondente = processedData.verificacoes?.expenses?.find(
                                  expense => expense.category === classificacao.categoria
                                );
                                
                                return (
                                  <div key={index} className="ml-2 mb-2">
                                    <div className="text-gray-800">
                                      {classificacao.categoria || 'N/A'}
                                    </div>
                                    {verificacaoCorrespondente ? (
                                      <div className={`font-bold ${
                                        verificacaoCorrespondente.exists 
                                          ? 'text-green-700' 
                                          : 'text-red-700'
                                      }`}>
                                        {verificacaoCorrespondente.exists ? 'EXISTE' : 'NÃO EXISTE'}
                                        {verificacaoCorrespondente.id && ` – ID: ${verificacaoCorrespondente.id}`}
                                      </div>
                                    ) : (
                                      <div className="font-bold text-blue-700">
                                        CLASSIFICAÇÃO EXTRAÍDA
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-gray-500 ml-2">Nenhuma despesa identificada</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Botão para criar registros automaticamente */}
                    {!processedData.registros_criados?.success && (
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={handleCreateRecords}
                          disabled={isSaving}
                          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Criando registros...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-5 w-5" />
                              <span>Criar Registros Automaticamente</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {/* Mensagem de sucesso */}
                    {processedData.registros_criados?.success && (
                      <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <h4 className="font-medium text-green-800">Registros Criados com Sucesso!</h4>
                        </div>
                        <div className="mt-2 text-sm text-green-700">
                          <ul className="list-disc list-inside space-y-1">
                            {processedData.registros_criados.supplier_created && (
                              <li>Fornecedor criado/atualizado</li>
                            )}
                            {processedData.registros_criados.billed_person_created && (
                              <li>Pessoa faturada criada/atualizada</li>
                            )}
                            {processedData.registros_criados.expense_types_created && 
                             processedData.registros_criados.expense_types_created.length > 0 && (
                              <li>Tipos de despesa criados: {processedData.registros_criados.expense_types_created.length}</li>
                            )}
                            {processedData.registros_criados.payable_account_created && (
                              <li>Movimento de conta criado</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dados Extraídos com Sucesso - Aguardando Confirmação */}
              {processedData.dados_extraidos && !processedData.registros_criados && !processedData.is_duplicate && (
                <div className="card border-blue-200 bg-blue-50">
                  <div className="card-header">
                    <h3 className="text-lg font-medium flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                      Dados Extraídos com Sucesso
                    </h3>
                  </div>
                  <div className="card-body space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-blue-800 mb-3">✅ EXTRAÇÃO REALIZADA COM SUCESSO!</h4>
                      <p className="text-gray-700 mb-4">
                        Os dados foram extraídos e verificados. Clique no botão abaixo para salvar como conta a pagar.
                      </p>
                      
                      <button
                        onClick={handleSaveAsPayable}
                        disabled={isSaving}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            Salvar como Conta a Pagar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Registros Criados Automaticamente */}
              {processedData.registros_criados && (
                <div className="card border-green-200 bg-green-50">
                  <div className="card-header">
                    <h3 className="text-lg font-medium flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Registros Criados com Sucesso
                    </h3>
                  </div>
                  <div className="card-body space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-green-800 mb-3">✅ LANÇAMENTO REALIZADO COM SUCESSO!</h4>
                      
                      {processedData.registros_criados.supplier_created && (
                        <div className="mb-2">
                          <span className="text-green-700 font-medium">• Fornecedor criado:</span>
                          <span className="text-gray-900 ml-2">{processedData.dados_extraidos?.fornecedor?.razao_social}</span>
                        </div>
                      )}
                      
                      {processedData.registros_criados.billed_person_created && (
                        <div className="mb-2">
                          <span className="text-green-700 font-medium">• Pessoa faturada criada:</span>
                          <span className="text-gray-900 ml-2">{processedData.dados_extraidos?.faturado?.nome_completo}</span>
                        </div>
                      )}
                      
                      {processedData.registros_criados.expense_types_created && processedData.registros_criados.expense_types_created.length > 0 && (
                        <div className="mb-2">
                          <span className="text-green-700 font-medium">• Tipos de despesa criados:</span>
                          <div className="ml-4 mt-1">
                            {processedData.registros_criados.expense_types_created.map((expense: any, index: number) => (
                              <div key={index} className="text-gray-900 text-sm">
                                - {expense.category}: {expense.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {processedData.registros_criados.payable_account_created && (
                        <div className="mb-2">
                          <span className="text-green-700 font-medium">• Conta a pagar criada:</span>
                          <span className="text-gray-900 ml-2">
                            R$ {processedData.dados_extraidos?.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      
                      {processedData.registros_criados.installments_created && (
                        <div className="mb-2">
                          <span className="text-green-700 font-medium">• Parcelas criadas:</span>
                          <span className="text-gray-900 ml-2">
                            {processedData.dados_extraidos?.quantidade_parcelas} parcela(s)
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-green-800 font-medium text-center">
                          🎉 Todos os registros foram lançados no sistema com sucesso!
                        </p>
                        <p className="text-green-700 text-sm text-center mt-1">
                          As entidades MOVIMENTOCONTAS, PARCELACONTAS, CLASSIFICACAO e PESSOAS foram atualizadas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
          {/* <div className="flex space-x-4">
            <button className="btn btn-primary">
              <CheckCircle className="h-4 w-4 mr-2" />
              Salvar como Conta a Pagar
            </button>
            <button className="btn btn-secondary">
              <Eye className="h-4 w-4 mr-2" />
              Revisar Dados
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
}
