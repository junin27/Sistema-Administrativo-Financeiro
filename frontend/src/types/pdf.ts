/**
 * Tipos TypeScript para processamento de PDF.
 * Define interfaces para upload e dados extraídos.
 */

// Upload de PDF
export interface PDFUpload {
  filename: string;
  content_type: string;
  size: number;
}

// Dados extraídos do fornecedor
export interface FornecedorExtraido {
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
}

// Dados extraídos do faturado
export interface FaturadoExtraido {
  nome_completo: string;
  cpf: string;
}

// Parcela extraída
export interface ParcelaExtraida {
  numero_parcela: number;
  data_vencimento: string; // ISO date string
  valor_parcela: number;
}

// Classificação de despesa extraída
export interface ClassificacaoDespesaExtraida {
  categoria: string;
  descricao: string;
  percentual: number;
  confianca: number; // 0 a 1
}

// Todos os dados extraídos do PDF
export interface DadosExtraidosPDF {
  numero_nota_fiscal?: string;
  data_emissao: string; // ISO date string
  descricao_produtos: string;
  valor_total: number;
  fornecedor: FornecedorExtraido;
  faturado?: FaturadoExtraido;
  parcelas: ParcelaExtraida[];
  classificacoes_despesa: ClassificacaoDespesaExtraida[];
  confianca_geral: number; // 0 a 1
  observacoes_ia?: string;
  quantidade_parcelas: number;
}

// Response do processamento
export interface ProcessamentoPDFResponse {
  success: boolean;
  message: string;
  dados_extraidos?: DadosExtraidosPDF;
  verificacoes?: VerificacoesDados;
  // Propriedades para notas fiscais duplicadas
  is_duplicate?: boolean;
  duplicate_message?: string;
  existing_movement_id?: number;
}

// Registros criados automaticamente (deprecated - agora é manual)
export interface RegistrosCriados {
  supplier_created?: boolean;
  billed_person_created?: boolean;
  expense_types_created?: Array<{
    category: string;
    description: string;
  }>;
  payable_account_created?: boolean;
  installments_created?: boolean;
}

// Verificações de dados
export interface VerificacoesDados {
  fornecedor: {
    exists: boolean;
    id: number | null;
    razao_social: string;
    cnpj: string;
    acao: string;
  };
  faturado?: {
    exists: boolean;
    id: number | null;
    nome_completo: string | null;
    cpf: string | null;
    acao: string;
  } | null;
  classificacoes: Array<{
    exists: boolean;
    id: number | null;
    categoria: string;
    descricao: string;
    confianca: number;
  }>;
}

// Estados do processamento
export type StatusProcessamento = 
  | 'idle'           // Aguardando upload
  | 'uploading'      // Fazendo upload
  | 'processing'     // Processando com IA
  | 'success'        // Sucesso
  | 'error';         // Erro

// Context para o processamento
export interface ProcessamentoPDFState {
  status: StatusProcessamento;
  arquivo?: File;
  dadosExtraidos?: DadosExtraidosPDF;
  erro?: string;
  tempoProcessamento?: number;
  progress: number; // 0 a 100
}

// Ações para o context
export type ProcessamentoPDFAction =
  | { type: 'RESET' }
  | { type: 'SET_ARQUIVO'; payload: File }
  | { type: 'START_UPLOAD' }
  | { type: 'START_PROCESSING' }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SUCCESS'; payload: DadosExtraidosPDF; tempo: number }
  | { type: 'ERROR'; payload: string };

// Props para componentes de PDF
export interface PDFUploadProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
  maxSize?: number; // MB
  acceptedTypes?: string[];
}

export interface PDFResultsProps {
  dados: DadosExtraidosPDF;
  tempo: number;
  onGerarConta?: () => void;
  onNovoProcessamento?: () => void;
}

// Configurações de visualização
export interface DisplayConfig {
  showConfidence: boolean;
  showTiming: boolean;
  showRawData: boolean;
  expandedSections: string[];
}

// Formato de exibição dos dados
export interface DadosFormatados {
  informacoesGerais: {
    numeroNota: string | null;
    dataEmissao: string;
    valorTotal: string;
    confiancaGeral: string;
  };
  fornecedor: {
    razaoSocial: string;
    nomeFantasia: string | null;
    cnpj: string;
  };
  faturado?: {
    nomeCompleto: string;
    cpf: string;
  };
  produtos: {
    descricao: string;
    resumo: string;
  };
  parcelas: Array<{
    numero: number;
    dataVencimento: string;
    valor: string;
  }>;
  classificacoes: Array<{
    categoria: string;
    descricao: string;
    percentual: string;
    confianca: string;
    corConfianca: 'low' | 'medium' | 'high';
  }>;
  observacoes: string | null;
}
