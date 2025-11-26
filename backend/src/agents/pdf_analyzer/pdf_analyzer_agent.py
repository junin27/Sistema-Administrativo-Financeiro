"""
PDF Analyzer Agent - Extrai informações de notas fiscais usando IA Gemini.

Responsabilidades:
- Extrair texto de PDFs
- Processar com IA Gemini para extrair dados estruturados
- Validar integridade dos dados extraídos
- Retornar schema estruturado com as informações
"""
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import re

try:
    import google.generativeai as genai  # type: ignore
    from PyPDF2 import PdfReader  # type: ignore
    PDF_LIBS_AVAILABLE = True
    print(f"[PDF_ANALYZER] Bibliotecas PDF carregadas com sucesso! PDF_LIBS_AVAILABLE={PDF_LIBS_AVAILABLE}")
except ImportError as e:
    PDF_LIBS_AVAILABLE = False
    genai = None  # type: ignore
    PdfReader = None  # type: ignore
    print(f"[PDF_ANALYZER] Erro ao carregar bibliotecas PDF: {e}. PDF_LIBS_AVAILABLE={PDF_LIBS_AVAILABLE}")

from ...schemas.pdf_processing import DadosExtraidosPDFSchema, ParcelaExtraidaSchema, ClassificacaoDespesaExtraidaSchema
from ...core.exceptions import PDFProcessingError
from ...config.settings import settings

logger = logging.getLogger(__name__)


class PDFAnalyzerAgent:
    """
    Agent especializado em análise de PDFs de notas fiscais.
    
    Usa Google Gemini AI para extrair dados estruturados.
    """
    
    def __init__(self):
        """Inicializa o agente configurando a API do Gemini."""
        if not PDF_LIBS_AVAILABLE:
            logger.warning("Bibliotecas PDF/IA não disponíveis. PDFAnalyzerAgent não pode ser utilizado.")
            raise PDFProcessingError("Bibliotecas google.generativeai e PyPDF2 não estão instaladas")
        
        # Tenta obter a API key de múltiplas fontes
        self.gemini_api_key = (
            os.getenv("GEMINI_API_KEY") or 
            os.getenv("GOOGLE_API_KEY") or 
            settings.gemini_api_key or 
            ""
        )
        
        if not self.gemini_api_key or self.gemini_api_key.strip() == "":
            error_msg = (
                "GEMINI_API_KEY não configurada!\n"
                "Configure a variável de ambiente GEMINI_API_KEY no docker-compose ou arquivo .env\n"
                "Obtenha sua API key em: https://aistudio.google.com/app/apikey"
            )
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        genai.configure(api_key=self.gemini_api_key)  # type: ignore
        self.model_name = settings.gemini_model
        self.model = genai.GenerativeModel(self.model_name)  # type: ignore
        
        logger.info(f"PDFAnalyzerAgent inicializado com sucesso usando modelo: {self.model_name}")
    
    async def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extrai texto bruto do PDF.
        
        Args:
            pdf_path: Caminho do arquivo PDF
            
        Returns:
            Texto extraído do PDF
            
        Raises:
            PDFProcessingError: Se houver erro na extração
        """
        try:
            logger.info(f"Extraindo texto do PDF: {pdf_path}")
            
            reader = PdfReader(pdf_path)  # type: ignore
            texto_completo = ""
            
            for page_num, page in enumerate(reader.pages, 1):
                texto_pagina = page.extract_text()
                texto_completo += f"\n--- Página {page_num} ---\n{texto_pagina}"
            
            if not texto_completo.strip():
                raise PDFProcessingError("PDF vazio ou sem texto extraível")
            
            logger.info(f"Texto extraído com sucesso: {len(texto_completo)} caracteres")
            return texto_completo
            
        except Exception as e:
            logger.error(f"Erro ao extrair texto do PDF: {str(e)}")
            raise PDFProcessingError(f"Falha na extração de texto: {str(e)}")
    
    async def analyze_with_ai(self, texto_pdf: str) -> Dict[str, Any]:
        """
        Processa texto com IA Gemini para extrair dados estruturados.
        
        Args:
            texto_pdf: Texto extraído do PDF
            
        Returns:
            Dicionário com dados extraídos
            
        Raises:
            PDFProcessingError: Se houver erro no processamento
        """
        import asyncio
        import time
        
        prompt = self._build_extraction_prompt(texto_pdf)
        
        max_retries = 3
        retry_delay = 2  # segundos
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Enviando texto para análise com Gemini AI (tentativa {attempt + 1}/{max_retries})...")
                
                response = self.model.generate_content(prompt)
                texto_resposta = response.text
                
                logger.info("Resposta recebida do Gemini AI")
                
                # Parse da resposta JSON
                dados_extraidos = self._parse_ai_response(texto_resposta)
                
                return dados_extraidos
                
            except Exception as e:
                error_str = str(e)
                
                # Verifica se é erro de quota/rate limit
                if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                    if attempt < max_retries - 1:
                        # Extrai o tempo de retry se disponível
                        retry_seconds = retry_delay * (attempt + 1)  # Backoff exponencial
                        if "retry_delay" in error_str or "retry in" in error_str.lower():
                            # Tenta extrair o tempo sugerido do erro
                            import re
                            match = re.search(r'retry in (\d+\.?\d*)s', error_str.lower())
                            if match:
                                retry_seconds = float(match.group(1)) + 1
                        
                        logger.warning(
                            f"Quota/Rate limit atingido. Aguardando {retry_seconds:.1f}s antes de tentar novamente... "
                            f"(tentativa {attempt + 1}/{max_retries})"
                        )
                        await asyncio.sleep(retry_seconds)
                        continue
                    else:
                        error_msg = (
                            f"Quota/Rate limit da API Gemini excedido após {max_retries} tentativas.\n"
                            f"Por favor, aguarde alguns minutos e tente novamente.\n"
                            f"Para mais informações: https://ai.google.dev/gemini-api/docs/rate-limits"
                        )
                        logger.error(error_msg)
                        raise PDFProcessingError(error_msg)
                else:
                    # Outro tipo de erro
                    logger.error(f"Erro na análise com IA: {error_str}")
                    raise PDFProcessingError(f"Falha na análise com IA: {error_str}")
    
    async def process_pdf(self, pdf_path: str) -> DadosExtraidosPDFSchema:
        """
        Pipeline completo de análise de PDF.
        
        Args:
            pdf_path: Caminho do arquivo PDF
            
        Returns:
            Schema com dados extraídos e validados
        """
        logger.info(f"Iniciando processamento completo do PDF: {pdf_path}")
        
        # 1. Extração de texto
        texto = await self.extract_text_from_pdf(pdf_path)
        
        # 2. Análise com IA
        dados_brutos = await self.analyze_with_ai(texto)
        
        # 3. Validação e conversão para schema
        dados_validados = self._validate_and_build_schema(dados_brutos)
        
        logger.info("PDF processado com sucesso")
        return dados_validados
    
    def _build_extraction_prompt(self, texto_pdf: str) -> str:
        """Constrói o prompt para a IA Gemini."""
        return f"""
Você é um especialista em análise de notas fiscais brasileiras.

Analise o texto abaixo extraído de uma nota fiscal e retorne APENAS um JSON válido com EXATAMENTE esta estrutura:

{{
  "numero_nota_fiscal": "número da NF-e ou null se não encontrar",
  "data_emissao": "data no formato DD/MM/AAAA",
  "descricao_produtos": "descrição dos produtos ou serviços",
  "valor_total": valor numérico sem R$,
  "fornecedor": {{
    "razao_social": "nome da empresa fornecedora",
    "nome_fantasia": "nome fantasia ou null",
    "cnpj": "CNPJ apenas números"
  }},
  "faturado": {{
    "nome_completo": "nome do cliente/destinatário",
    "cpf": "CPF apenas números"
  }},
  "parcelas": [
    {{
      "numero_parcela": 1,
      "valor_parcela": valor da parcela,
      "data_vencimento": "data no formato DD/MM/AAAA"
    }}
  ],
  "quantidade_parcelas": número total de parcelas,
  "classificacoes_despesa": [
    {{
      "categoria": "categoria da despesa (ex: Alimentação, Transporte, Energia, etc)",
      "descricao": "descrição específica da classificação",
      "percentual": 100.0,
      "confianca": 0.85
    }}
  ],
  "confianca_geral": 0.9,
  "observacoes_ia": "observações sobre a extração ou null"
}}

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS o JSON, sem texto adicional, sem markdown
2. Use null APENAS nos campos opcionais (numero_nota_fiscal, nome_fantasia, observacoes_ia)
3. TODOS os outros campos são OBRIGATÓRIOS
4. Valores numéricos SEM formatação (ex: 1500.50, não "R$ 1.500,50")
5. Datas SEMPRE no formato DD/MM/AAAA
6. CNPJ e CPF apenas números
7. Se houver múltiplas parcelas, liste todas
8. classificacoes_despesa: analise o conteúdo e sugira categorias apropriadas
9. confianca_geral: número entre 0 e 1 indicando sua confiança na extração

TEXTO DA NOTA FISCAL:
{texto_pdf}
"""
    
    def _parse_ai_response(self, resposta: str) -> Dict[str, Any]:
        """Parse da resposta JSON da IA."""
        import json
        
        try:
            # Remove markdown code blocks se existirem
            resposta_limpa = resposta.strip()
            if resposta_limpa.startswith("```json"):
                resposta_limpa = resposta_limpa[7:]
            if resposta_limpa.startswith("```"):
                resposta_limpa = resposta_limpa[3:]
            if resposta_limpa.endswith("```"):
                resposta_limpa = resposta_limpa[:-3]
            
            resposta_limpa = resposta_limpa.strip()
            
            dados = json.loads(resposta_limpa)
            return dados
            
        except json.JSONDecodeError as e:
            logger.error(f"Erro ao parsear JSON da IA: {str(e)}\nResposta: {resposta}")
            raise PDFProcessingError(f"Resposta da IA não é um JSON válido: {str(e)}")
    
    def _validate_and_build_schema(self, dados: Dict[str, Any]) -> DadosExtraidosPDFSchema:
        """
        Valida dados extraídos e constrói schema Pydantic.
        
        Args:
            dados: Dicionário com dados brutos
            
        Returns:
            Schema validado
        """
        try:
            # Conversão de datas
            if dados.get("data_emissao"):
                dados["data_emissao"] = self._parse_date(dados["data_emissao"])
            
            # Conversão de parcelas
            if dados.get("parcelas"):
                for parcela in dados["parcelas"]:
                    if parcela.get("data_vencimento"):
                        parcela["data_vencimento"] = self._parse_date(parcela["data_vencimento"])
            
            # Garantir que campos obrigatórios existem
            if "quantidade_parcelas" not in dados and dados.get("parcelas"):
                dados["quantidade_parcelas"] = len(dados["parcelas"])
            
            if "classificacoes_despesa" not in dados or not dados["classificacoes_despesa"]:
                # Classificação padrão se não fornecida
                dados["classificacoes_despesa"] = [{
                    "categoria": "Despesa Geral",
                    "descricao": "Classificação automática padrão",
                    "percentual": 100.0,
                    "confianca": 0.5
                }]
            
            if "confianca_geral" not in dados:
                dados["confianca_geral"] = 0.7
            
            if "descricao_produtos" not in dados:
                dados["descricao_produtos"] = "Produtos/Serviços da nota fiscal"
            
            # Construção do schema
            schema = DadosExtraidosPDFSchema(**dados)
            
            logger.info("Dados validados com sucesso")
            return schema
            
        except Exception as e:
            logger.error(f"Erro na validação dos dados: {str(e)}")
            raise PDFProcessingError(f"Dados extraídos inválidos: {str(e)}")
    
    def _parse_date(self, data_str: str) -> datetime:
        """
        Converte string de data para datetime.
        
        Aceita formatos: DD/MM/AAAA, DD-MM-AAAA, AAAA-MM-DD
        """
        if isinstance(data_str, datetime):
            return data_str
        
        # Tenta diferentes formatos
        formatos = ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y/%m/%d"]
        
        for formato in formatos:
            try:
                return datetime.strptime(data_str, formato)
            except ValueError:
                continue
        
        raise ValueError(f"Formato de data não reconhecido: {data_str}")
    
    def get_analysis_summary(self, dados: DadosExtraidosPDFSchema) -> Dict[str, Any]:
        """
        Retorna um resumo da análise do PDF.
        
        Args:
            dados: Schema com dados extraídos
            
        Returns:
            Dicionário com estatísticas da análise
        """
        return {
            "status": "success",
            "numero_nota_fiscal": dados.numero_nota_fiscal,
            "valor_total": float(dados.valor_total),
            "total_parcelas": len(dados.parcelas) if dados.parcelas else 0,
            "total_despesas": len(dados.classificacoes_despesa) if dados.classificacoes_despesa else 0,
            "fornecedor_cnpj": dados.fornecedor.cnpj if dados.fornecedor else None,
            "faturado_cpf": dados.faturado.cpf if dados.faturado else None,
            "data_processamento": datetime.now().isoformat()
        }
