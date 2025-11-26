"""
Service para processamento de PDF usando Google Gemini AI.
Implementa extração de dados de notas fiscais e classificação automática.
"""

import time
import logging
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime, date
import re

try:
    import google.generativeai as genai  # type: ignore
    import PyPDF2  # type: ignore
    PDF_LIBS_AVAILABLE = True
    print(f"[PDF_PROCESSING] Bibliotecas PDF carregadas com sucesso! PDF_LIBS_AVAILABLE={PDF_LIBS_AVAILABLE}")
except ImportError as e:
    PDF_LIBS_AVAILABLE = False
    genai = None  # type: ignore
    PyPDF2 = None  # type: ignore
    print(f"[PDF_PROCESSING] Erro ao carregar bibliotecas PDF: {e}. PDF_LIBS_AVAILABLE={PDF_LIBS_AVAILABLE}")

from io import BytesIO
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException

from ..config.settings import settings
from ..schemas.pdf_processing import (
    DadosExtraidosPDFSchema, 
    ProcessamentoPDFResponseSchema,
    FornecedorExtraidoSchema,
    FaturadoExtraidoSchema,
    ParcelaExtraidaSchema,
    ClassificacaoDespesaExtraidaSchema
)
from ..schemas.post_processing_schemas import (
    PostProcessingResult,
    FornecedorExistenceCheck,
    FaturadoExistenceCheck,
    DespesaExistenceCheck,
    EntityExistenceStatus,
    TransactionLog
)
from ..repositories.ddl_repositories import PessoasRepository, MovimentoContasRepository
from ..models.ddl_models import Pessoas, MovimentoContas
from ..core.exceptions import DuplicateInvoiceError

# Configurar logging
logger = logging.getLogger(__name__)


class PDFProcessingService:
    """
    Service para processamento de PDF com IA Gemini.
    Aplica padrão de responsabilidade única para processamento de documentos.
    """
    
    def __init__(self):
        """Inicializa o service configurando a API do Gemini."""
        if not PDF_LIBS_AVAILABLE:
            logger.warning("Bibliotecas PDF/IA não disponíveis. Funcionalidade de processamento de PDF desabilitada.")
            self.gemini_configured = False
        else:
            self._configure_gemini()
            self._setup_classification_rules()
    
    def _configure_gemini(self) -> None:
        """Configura a API do Google Gemini."""
        if not PDF_LIBS_AVAILABLE:
            self.gemini_configured = False
            return
            
        try:
            genai.configure(api_key=settings.gemini_api_key)  # type: ignore
            self.model = genai.GenerativeModel('gemini-2.5-flash')  # type: ignore
            logger.info("Google Gemini AI configurado com sucesso")
        except Exception as e:
            logger.error(f"Erro ao configurar Gemini AI: {e}")
            raise
    
    def _setup_classification_rules(self) -> None:
        """Define regras de classificação automática de despesas baseadas nas categorias especificadas."""
        self.classification_rules = {
            "INSUMOS AGRÍCOLAS": {
                "keywords": [
                    # Sementes
                    "semente", "sementes", "milho", "soja", "feijão", "arroz", "trigo",
                    # Fertilizantes
                    "fertilizante", "adubo", "ureia", "npk", "superfosfato", "cloreto de potássio",
                    "sulfato de amônio", "fosfato", "nitrato",
                    # Defensivos Agrícolas
                    "defensivo", "herbicida", "inseticida", "fungicida", "pesticida", "agrotóxico",
                    "roundup", "glifosato", "atrazina",
                    # Corretivos
                    "corretivo", "calcário", "cal", "gesso", "micronutriente", "inoculante"
                ],
                "confidence_boost": 0.95
            },
            "MANUTENÇÃO E OPERAÇÃO": {
                "keywords": [
                    # Combustíveis e Lubrificantes
                    "combustível", "diesel", "gasolina", "álcool", "etanol", "óleo", "lubrificante",
                    "graxa", "fluido hidráulico", "s10", "aditivado", "b s10",
                    # Peças e Componentes
                    "peça", "peças", "parafuso", "porca", "arruela", "rolamento", "vedação",
                    "componente", "reparo", "reposição", "tubo", "cabo", "kit", "fixação", "fixacoes",
                    "din", "parafuso", "porca", "arruela", "bucha", "anel", "junta",
                    # Manutenção
                    "manutenção", "conserto", "oficina", "mecânico", "soldagem",
                    # Pneus, Filtros, Correias
                    "pneu", "pneus", "filtro", "correia", "mangueira", "vela", "bateria"
                ],
                "confidence_boost": 0.9
            },
            "RECURSOS HUMANOS": {
                "keywords": [
                    # Mão de Obra
                    "mão de obra", "trabalhador", "funcionário", "operário", "diarista",
                    "temporário", "safrista",
                    # Salários e Encargos
                    "salário", "ordenado", "pagamento", "encargo", "fgts", "inss", 
                    "vale transporte", "vale refeição", "cesta básica", "13º salário",
                    "férias", "rescisão"
                ],
                "confidence_boost": 0.95
            },
            "SERVIÇOS OPERACIONAIS": {
                "keywords": [
                    # Frete e Transporte
                    "frete", "transporte", "carreto", "mudança", "logística",
                    # Colheita Terceirizada
                    "colheita", "terceirizada", "colheitadeira", "prestação de serviço",
                    # Secagem e Armazenagem
                    "secagem", "armazenagem", "silo", "estocagem", "beneficiamento",
                    # Pulverização e Aplicação
                    "pulverização", "aplicação", "plantio", "semeadura", "cultivo"
                ],
                "confidence_boost": 0.9
            },
            "INFRAESTRUTURA E UTILIDADES": {
                "keywords": [
                    # Energia Elétrica
                    "energia", "elétrica", "eletricidade", "luz", "força",
                    # Arrendamento
                    "arrendamento", "aluguel", "terra", "propriedade", "hectare",
                    # Construções e Reformas
                    "construção", "reforma", "obra", "edificação", "ampliação",
                    # Materiais de Construção
                    "material", "concreto", "cimento", "ferro", "madeira", "tijolo",
                    "telha", "tinta", "hidráulico", "elétrico"
                ],
                "confidence_boost": 0.85
            },
            "ADMINISTRATIVAS": {
                "keywords": [
                    # Honorários
                    "honorário", "contábil", "advocatício", "agronômico", "consultoria",
                    "assessoria", "auditoria", "perícia",
                    # Despesas Bancárias
                    "despesa bancária", "financeira", "juros", "tarifa", "anuidade",
                    "cartão", "conta corrente", "empréstimo"
                ],
                "confidence_boost": 0.9
            },
            "SEGUROS E PROTEÇÃO": {
                "keywords": [
                    # Seguros
                    "seguro", "agrícola", "rural", "safra", "produtividade",
                    "ativo", "máquina", "veículo", "equipamento",
                    "prestamista", "vida", "proteção", "cobertura", "sinistro"
                ],
                "confidence_boost": 0.95
            },
            "IMPOSTOS E TAXAS": {
                "keywords": [
                    # Impostos específicos
                    "itr", "iptu", "ipva", "incra", "ccir", "imposto", "taxa",
                    "contribuição", "tributo", "icms", "ipi", "pis", "cofins",
                    "ir", "csll", "simples"
                ],
                "confidence_boost": 0.98
            },
            "INVESTIMENTOS": {
                "keywords": [
                    # Aquisições
                    "aquisição", "compra", "investimento", "ativo",
                    # Máquinas e Implementos
                    "máquina", "implemento", "trator", "colheitadeira", "plantadeira",
                    "pulverizador", "grade", "arado", "equipamento",
                    # Veículos
                    "veículo", "caminhão", "caminhonete", "carro", "motocicleta",
                    # Imóveis e Infraestrutura
                    "imóvel", "propriedade", "fazenda", "sítio", "infraestrutura",
                    "benfeitorias", "instalações"
                ],
                "confidence_boost": 0.85
            }
        }
    
    async def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """Extrai texto do arquivo PDF."""
        try:
            pdf_file = BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)  # type: ignore
            
            text = ""
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                text += page_text + "\n"
                logger.info(f"Página {page_num + 1}: {len(page_text)} caracteres extraídos")
            
            if not text.strip():
                raise ValueError("Não foi possível extrair texto do PDF")
            
            logger.info(f"TEXTO COMPLETO EXTRAÍDO ({len(text)} caracteres):")
            logger.info("=" * 50)
            logger.info(text[:1000] + "..." if len(text) > 1000 else text)
            logger.info("=" * 50)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Erro ao extrair texto do PDF: {e}")
            raise
    
    async def process_pdf(self, pdf_content: bytes, filename: str) -> ProcessamentoPDFResponseSchema:
        """
        Processa PDF completo extraindo dados da nota fiscal.
        Retorna dados estruturados e classificações automáticas.
        """
        start_time = time.time()
        
        logger.info("=" * 80)
        logger.info(f"INICIANDO PROCESSAMENTO DE PDF: {filename}")
        logger.info(f"Tamanho do arquivo: {len(pdf_content)} bytes")
        logger.info(f"API Key Gemini configurada: {'Sim' if settings.gemini_api_key and settings.gemini_api_key != 'fake_key_for_development' else 'Não'}")
        logger.info("=" * 80)
        
        try:
            # Extrair texto do PDF
            pdf_text = await self.extract_text_from_pdf(pdf_content)
            
            # Processar com IA Gemini
            dados_extraidos = await self._process_with_gemini(pdf_text)
            
            # Aplicar classificação automática
            dados_extraidos = self._apply_automatic_classification(dados_extraidos, pdf_text)
            
            tempo_processamento = time.time() - start_time
            
            return ProcessamentoPDFResponseSchema(
                sucesso=True,
                dados_extraidos=dados_extraidos,
                tempo_processamento=tempo_processamento,
                erro=None
            )
            
        except Exception as e:
            tempo_processamento = time.time() - start_time
            logger.error(f"Erro no processamento do PDF {filename}: {e}")
            
            return ProcessamentoPDFResponseSchema(
                sucesso=False,
                erro=str(e),
                tempo_processamento=tempo_processamento,
                dados_extraidos=None
            )
    
    async def _process_with_gemini(self, pdf_text: str) -> DadosExtraidosPDFSchema:
        """Processa texto com IA Gemini para extrair dados estruturados."""
        
        prompt = self._build_extraction_prompt(pdf_text)
        
        logger.info("ENVIANDO PROMPT PARA GEMINI:")
        logger.info("=" * 50)
        logger.info(prompt[:500] + "..." if len(prompt) > 500 else prompt)
        logger.info("=" * 50)
        
        try:
            # Configurar timeout para a chamada do Gemini
            import asyncio
            import concurrent.futures
            
            # Timeout de 60 segundos para processamento da IA
            timeout_seconds = 60
            
            # Executar a chamada do Gemini com timeout
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(self.model.generate_content, prompt)
                try:
                    response = future.result(timeout=timeout_seconds)
                except concurrent.futures.TimeoutError:
                    logger.error(f"Timeout na chamada do Gemini AI após {timeout_seconds} segundos")
                    raise TimeoutError(f"Processamento da IA excedeu o tempo limite de {timeout_seconds} segundos")
            
            if not response.text:
                raise ValueError("Resposta vazia da IA Gemini")
            
            logger.info("RESPOSTA RECEBIDA DO GEMINI:")
            logger.info("=" * 50)
            logger.info(response.text)
            logger.info("=" * 50)
            
            # Parse da resposta JSON
            extracted_data = self._parse_gemini_response(response.text)
            
            logger.info("DADOS APÓS PARSE JSON:")
            logger.info("=" * 50)
            logger.info(f"Tipo: {type(extracted_data)}")
            logger.info(f"Conteúdo: {extracted_data}")
            logger.info("=" * 50)
            
            # Validar e estruturar dados
            validated_data = self._validate_and_structure_data(extracted_data)
            
            logger.info("DADOS APÓS VALIDAÇÃO:")
            logger.info("=" * 50)
            logger.info(f"Fornecedor: {validated_data.fornecedor}")
            logger.info(f"Número NF: {validated_data.numero_nota_fiscal}")
            logger.info(f"Valor Total: {validated_data.valor_total}")
            logger.info("=" * 50)
            
            return validated_data
            
        except TimeoutError as e:
            logger.error(f"Timeout na IA Gemini: {e}")
            raise HTTPException(
                status_code=408,
                detail="Processamento da IA excedeu o tempo limite. Tente novamente."
            )
        except Exception as e:
            logger.error(f"Erro ao processar com Gemini: {e}")
            logger.error(f"Tipo do erro: {type(e)}")
            import traceback
            logger.error(f"Traceback completo: {traceback.format_exc()}")
            raise
    
    def _build_extraction_prompt(self, pdf_text: str) -> str:
        """Constrói prompt para extração de dados com IA."""
        
        return f"""
        Você é um especialista em análise de notas fiscais para sistema administrativo financeiro agrícola.
        Analise a seguinte nota fiscal e extraia OBRIGATORIAMENTE todas as informações solicitadas.

        TEXTO DA NOTA FISCAL:
        {pdf_text}

        CAMPOS OBRIGATÓRIOS PARA EXTRAÇÃO:

        FORNECEDOR (OBRIGATÓRIO):
        - Razão Social (campo obrigatório)
        - Nome Fantasia (opcional)
        - CNPJ (campo obrigatório, formato XX.XXX.XXX/XXXX-XX)

        FATURADO (OBRIGATÓRIO se existir na nota):
        - Nome Completo da pessoa física
        - CPF (formato XXX.XXX.XXX-XX)

        DADOS DA NOTA FISCAL (OBRIGATÓRIOS):
        - Número da Nota Fiscal
        - Data de Emissão (formato YYYY-MM-DD)
        - Descrição detalhada dos produtos/serviços
        - Valor Total (decimal com 2 casas)

        PARCELAS (OBRIGATÓRIO):
        - Quantidade de Parcelas (mínimo 1)
        - Data de Vencimento de cada parcela
        - Valor de cada parcela

        ESTRUTURA JSON OBRIGATÓRIA:
        {{
            "numero_nota_fiscal": "string - OBRIGATÓRIO",
            "data_emissao": "YYYY-MM-DD - OBRIGATÓRIO",
            "descricao_produtos": "string detalhada - OBRIGATÓRIO",
            "valor_total": "decimal - OBRIGATÓRIO",
            "fornecedor": {{
                "razao_social": "string - OBRIGATÓRIO",
                "nome_fantasia": "string ou null",
                "cnpj": "XX.XXX.XXX/XXXX-XX - OBRIGATÓRIO"
            }},
            "faturado": {{
                "nome_completo": "string - OBRIGATÓRIO se pessoa física",
                "cpf": "XXX.XXX.XXX-XX - OBRIGATÓRIO se pessoa física"
            }} ou null,
            "parcelas": [
                {{
                    "numero_parcela": 1,
                    "data_vencimento": "YYYY-MM-DD - OBRIGATÓRIO",
                    "valor_parcela": "decimal - OBRIGATÓRIO"
                }}
            ],
            "quantidade_parcelas": "número inteiro - OBRIGATÓRIO",
            "confianca_geral": 0.85,
            "observacoes_ia": "observações detalhadas sobre a extração"
        }}

        INSTRUÇÕES CRÍTICAS:
        1. TODOS os campos marcados como OBRIGATÓRIO devem ser preenchidos
        2. Se não encontrar um campo obrigatório, indique "NÃO ENCONTRADO" no campo observacoes_ia
        3. Formate datas rigorosamente como YYYY-MM-DD
        4. Formate CNPJ como XX.XXX.XXX/XXXX-XX (com pontos, barra e hífen)
        5. Formate CPF como XXX.XXX.XXX-XX (com pontos e hífen)
        6. Valores decimais sempre com 2 casas decimais
        7. Se múltiplas parcelas existirem, liste TODAS
        8. Se apenas uma parcela, use data_vencimento da própria nota
        9. Seja extremamente detalhado na descrição dos produtos
        10. Confiança de 0 a 1 baseada na clareza e completude dos dados encontrados

        CONTEXTO: Esta nota fiscal será usada em sistema financeiro agrícola para classificação automática de despesas.
        
        Retorne APENAS o JSON válido, sem texto adicional antes ou depois.
        """
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Parse da resposta JSON do Gemini."""
        try:
            import json
            
            logger.info("INICIANDO PARSE DA RESPOSTA GEMINI:")
            logger.info(f"Resposta original (primeiros 500 chars): {response_text[:500]}")
            
            # Limpar resposta removendo markdown e texto extra
            json_text = response_text.strip()
            
            logger.info(f"Após strip: {json_text[:200]}")
            
            # Procurar por JSON válido na resposta
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0]
                logger.info("Encontrou markdown ```json, extraindo...")
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0]
                logger.info("Encontrou markdown ```, extraindo...")
            
            # Remover possíveis caracteres extras no início e fim
            json_text = json_text.strip()
            
            logger.info(f"JSON final para parse: {json_text[:300]}")
            
            parsed_data = json.loads(json_text)
            
            logger.info("PARSE JSON REALIZADO COM SUCESSO!")
            logger.info(f"Chaves encontradas: {list(parsed_data.keys()) if isinstance(parsed_data, dict) else 'Não é dict'}")
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            logger.error(f"ERRO JSON DECODE: {e}")
            logger.error(f"Posição do erro: linha {e.lineno}, coluna {e.colno}")
            logger.error(f"Texto que causou erro: {json_text[max(0, e.pos-50):e.pos+50] if hasattr(e, 'pos') else 'N/A'}")
            logger.error(f"Resposta completa original: {response_text}")
            raise ValueError(f"Resposta da IA não está em formato JSON válido: {e}")
        except Exception as e:
            logger.error(f"Erro geral ao fazer parse da resposta Gemini: {e}")
            logger.error(f"Resposta original completa: {response_text}")
            raise ValueError(f"Erro inesperado no parse JSON: {e}")
    
    def _validate_and_structure_data(self, data: Dict[str, Any]) -> DadosExtraidosPDFSchema:
        """Valida e estrutura os dados extraídos."""
        try:
            logger.info("INICIANDO VALIDAÇÃO E ESTRUTURAÇÃO DOS DADOS:")
            logger.info(f"Dados recebidos: {data}")
            
            # Converter data strings para objetos date
            if isinstance(data.get("data_emissao"), str):
                logger.info(f"Convertendo data_emissao: {data.get('data_emissao')}")
                data["data_emissao"] = datetime.strptime(data["data_emissao"], "%Y-%m-%d").date()
            
            # Converter parcelas
            if "parcelas" in data:
                logger.info(f"Processando {len(data['parcelas'])} parcelas")
                for parcela in data["parcelas"]:
                    if isinstance(parcela.get("data_vencimento"), str):
                        parcela["data_vencimento"] = datetime.strptime(
                            parcela["data_vencimento"], "%Y-%m-%d"
                        ).date()
                    
                    if isinstance(parcela.get("valor_parcela"), str):
                        parcela["valor_parcela"] = float(parcela["valor_parcela"])
            
            # Converter valor total
            if isinstance(data.get("valor_total"), str):
                logger.info(f"Convertendo valor_total: {data.get('valor_total')}")
                data["valor_total"] = float(data["valor_total"])
            
            # Inicializar classificações vazias (serão preenchidas depois)
            # Adicionar classificação temporária para passar na validação
            data["classificacoes_despesa"] = [
                {
                    "categoria": "MANUTENÇÃO E OPERAÇÃO",
                    "descricao": "Óleo diesel - Combustível",
                    "percentual": 100.00,
                    "confianca": 0.9
                }
            ]
            
            logger.info("CRIANDO SCHEMA COM OS DADOS:")
            logger.info(f"Fornecedor: {data.get('fornecedor')}")
            logger.info(f"Número NF: {data.get('numero_nota_fiscal')}")
            logger.info(f"Data emissão: {data.get('data_emissao')}")
            logger.info(f"Valor total: {data.get('valor_total')}")
            
            schema_result = DadosExtraidosPDFSchema(**data)
            
            logger.info("SCHEMA CRIADO COM SUCESSO!")
            logger.info(f"Schema fornecedor: {schema_result.fornecedor}")
            
            return schema_result
            
        except Exception as e:
            logger.error(f"ERRO AO VALIDAR DADOS EXTRAÍDOS: {e}")
            logger.error(f"Dados que causaram erro: {data}")
            import traceback
            logger.error(f"Traceback completo: {traceback.format_exc()}")
            raise ValueError(f"Dados extraídos inválidos: {e}")
    
    def _apply_automatic_classification(
        self, 
        dados: DadosExtraidosPDFSchema, 
        texto_original: str
    ) -> DadosExtraidosPDFSchema:
        """Aplica classificação automática de despesas baseada em keywords."""
        
        texto_lower = texto_original.lower()
        descricao_lower = dados.descricao_produtos.lower()
        
        classificacoes = []
        
        logger.info("INICIANDO CLASSIFICAÇÃO AUTOMÁTICA:")
        logger.info(f"Descrição dos produtos: {descricao_lower[:200]}...")
        logger.info("=" * 50)
        
        for categoria, rules in self.classification_rules.items():
            confidence = self._calculate_classification_confidence(
                texto_lower, descricao_lower, rules["keywords"]
            )
            
            logger.info(f"Categoria: {categoria} - Confiança: {confidence:.3f}")
            
            # Log detalhado para debug
            if confidence > 0.1:  # Mostrar detalhes para confiança > 10%
                logger.info(f"  -> Keywords na descrição: {self._get_found_keywords_in_text(descricao_lower, rules['keywords'])}")
                logger.info(f"  -> Keywords no texto: {self._get_found_keywords_in_text(texto_lower, rules['keywords'])}")
            
            if confidence > 0.15:  # Limiar ajustado para 15%
                # Gerar descrição específica baseada nas keywords encontradas
                descricao_especifica = self._generate_specific_description(
                    categoria, texto_lower, descricao_lower, rules["keywords"]
                )
                
                classificacao = ClassificacaoDespesaExtraidaSchema(
                    categoria=categoria,
                    descricao=descricao_especifica,
                    percentual=100.00,
                    confianca=confidence
                )
                classificacoes.append(classificacao)
        
        # Se nenhuma classificação encontrada, usar categoria genérica
        if not classificacoes:
            classificacoes.append(
                ClassificacaoDespesaExtraidaSchema(
                    categoria="ADMINISTRATIVAS",
                    descricao="Classificação automática - Revisar manualmente",
                    percentual=100.00,
                    confianca=0.2
                )
            )
        
        # Ordenar por confiança e pegar as melhores
        classificacoes.sort(key=lambda x: x.confianca, reverse=True)
        dados.classificacoes_despesa = classificacoes[:3]  # Máximo 3 classificações
        
        return dados
    
    def _calculate_classification_confidence(
        self, 
        texto: str, 
        descricao: str, 
        keywords: List[str]
    ) -> float:
        """Calcula confiança da classificação baseada em keywords."""
        
        total_keywords = len(keywords)
        found_keywords_descricao = 0
        found_keywords_texto = 0
        
        # Separar keywords encontradas na descrição vs texto completo
        keywords_encontradas_desc = []
        keywords_encontradas_texto = []
        
        for keyword in keywords:
            if keyword in descricao:
                found_keywords_descricao += 1
                keywords_encontradas_desc.append(keyword)
            elif keyword in texto:
                found_keywords_texto += 1
                keywords_encontradas_texto.append(keyword)
        
        # Priorizar keywords encontradas na descrição dos produtos (peso 3x)
        weighted_keywords = (found_keywords_descricao * 3) + found_keywords_texto
        total_found = found_keywords_descricao + found_keywords_texto
        
        if total_found == 0:
            return 0.0
        
        # Confiança básica - usar apenas keywords encontradas vs total de keywords
        base_confidence = total_found / total_keywords
        
        # Boost adicional se múltiplas keywords foram encontradas
        if total_found > 1:
            base_confidence *= 1.2
        
        # Boost extra se encontrou keywords na descrição (mais relevante)
        if found_keywords_descricao > 0:
            base_confidence *= 1.5
        
        # Penalizar categorias fiscais se não houver match na descrição
        fiscal_keywords = ["imposto", "taxa", "icms", "ipi", "pis", "cofins", "itr", "iptu"]
        is_fiscal_category = any(kw in keywords for kw in fiscal_keywords)
        
        # Detectar se a descrição é claramente sobre produtos (não impostos)
        product_indicators = ["litros", "unidade", "pc", "kg", "ton", "m", "cm", "mm", 
                            "quantidade", "valor unitário", "código", "ncm", "l de", 
                            "granel", "tubo", "kit", "cabo", "parafuso", "din"]
        has_product_description = any(indicator in descricao for indicator in product_indicators)
        
        if is_fiscal_category:
            if found_keywords_descricao == 0:
                logger.info(f"  -> PENALIZAÇÃO FISCAL: Categoria fiscal sem match na descrição (×0.1)")
                base_confidence *= 0.1  # Reduz drasticamente se só achou no texto fiscal
            elif has_product_description:
                logger.info(f"  -> PENALIZAÇÃO FISCAL: Descrição é sobre produtos, não impostos (×0.2)")
                base_confidence *= 0.2  # Penaliza ainda mais se descrição é claramente de produtos
        
        return min(base_confidence, 1.0)
    
    def _get_found_keywords_in_text(self, texto: str, keywords: List[str]) -> List[str]:
        """Retorna lista de keywords encontradas no texto."""
        return [kw for kw in keywords if kw in texto]
    
    def _generate_specific_description(
        self, 
        categoria: str, 
        texto: str, 
        descricao: str, 
        keywords: List[str]
    ) -> str:
        """Gera descrição específica baseada nas keywords encontradas."""
        
        found_keywords = [kw for kw in keywords if kw in texto or kw in descricao]
        
        if found_keywords:
            return f"{categoria} - {', '.join(found_keywords[:3])}"
        else:
            return f"{categoria} - Classificação automática"
    
    async def process_post_extraction(
        self, 
        pdf_content: bytes,
        filename: str,
        db: Session
    ) -> PostProcessingResult:
        """
        Processa PDF completo: extração + pós-processamento.
        Implementa o fluxo completo com verificação de existência e criação de entidades.
        """
        import uuid
        transaction_id = str(uuid.uuid4())
        start_time = time.time()
        logs = []
        errors = []
        
        logger.info(f"INICIANDO PROCESSAMENTO COMPLETO - Transaction ID: {transaction_id}")
        logs.append(f"Iniciando processamento completo - Transaction ID: {transaction_id}")
        
        try:
            # Primeiro, extrair dados do PDF
            logs.append("Extraindo dados do PDF...")
            extraction_result = await self.process_pdf(pdf_content, filename)
            
            if not extraction_result.sucesso or not extraction_result.dados_extraidos:
                error_msg = extraction_result.erro or "Falha na extração de dados do PDF"
                return PostProcessingResult(
                    success=False,
                    fornecedor=FornecedorExistenceCheck(
                        documento="",
                        razao_social="",
                        status=EntityExistenceStatus(exists=False, entity_id=None, entity_data=None, created=False)
                    ),
                    faturado=FaturadoExistenceCheck(
                        documento="",
                        razao_social="",
                        status=EntityExistenceStatus(exists=False, entity_id=None, entity_data=None, created=False)
                    ),
                    despesas=[],
                    extracted_data=None,
                    movimento_criado=False,
                    movimento_id=None,
                    transaction_id=transaction_id,
                    processing_time=time.time() - start_time,
                    error_message=error_msg,
                    logs=logs + [f"Erro na extração: {error_msg}"],
                    errors=[error_msg]
                )
            
            dados_extraidos = extraction_result.dados_extraidos
            logs.append(f"Dados extraídos com sucesso: {dados_extraidos.numero_nota_fiscal or 'N/A'}")
            
            # Agora fazer o pós-processamento
            return await self._execute_post_processing(dados_extraidos, db, transaction_id, start_time, logs)
            
        except DuplicateInvoiceError:
            raise
        except Exception as e:
            error_msg = f"Erro no processamento completo: {str(e)}"
            logger.error(error_msg)
            return PostProcessingResult(
                success=False,
                fornecedor=FornecedorExistenceCheck(
                    documento="",
                    razao_social="",
                    status=EntityExistenceStatus(exists=False, entity_id=None, entity_data=None, created=False)
                ),
                faturado=FaturadoExistenceCheck(
                    documento="",
                    razao_social="",
                    status=EntityExistenceStatus(exists=False, entity_id=None, entity_data=None, created=False)
                ),
                despesas=[],
                extracted_data=None,
                movimento_criado=False,
                movimento_id=None,
                transaction_id=transaction_id,
                processing_time=time.time() - start_time,
                error_message=error_msg,
                logs=logs + [error_msg],
                errors=[error_msg]
            )
    
    async def _execute_post_processing(
        self, 
        dados_extraidos: DadosExtraidosPDFSchema, 
        db: Session,
        transaction_id: str,
        start_time: float,
        logs: List[str]
    ) -> PostProcessingResult:
        """
        Executa o pós-processamento dos dados extraídos.
        Verifica existência e cria entidades conforme necessário.
        """
        errors = []
        
        logger.info(f"EXECUTANDO PÓS-PROCESSAMENTO - Transaction ID: {transaction_id}")
        logs.append(f"Executando pós-processamento - Transaction ID: {transaction_id}")
        
        try:
            # Inicializar repositórios
            pessoas_repo = PessoasRepository(db)
            movimento_repo = MovimentoContasRepository(db)
            
            # Verificar se é nota fiscal duplicada ANTES de fazer outras verificações
            existing_movimento = await self._check_duplicate_invoice(dados_extraidos, movimento_repo, logs)
            
            # Verificar existência do fornecedor
            fornecedor_check = await self._check_fornecedor_existence(
                dados_extraidos.fornecedor, pessoas_repo, logs
            )
            
            # Verificar existência do faturado
            faturado_check = await self._check_faturado_existence(
                dados_extraidos.faturado if dados_extraidos.faturado else FaturadoExtraidoSchema(
                    cpf="", nome_completo="Não informado"
                ),
                pessoas_repo,
                logs
            )
            
            # Despesas serão tratadas via Classificacao, não ExpenseType
            despesas_check = []
            
            # Se é nota fiscal duplicada, retornar informações sem criar movimento
            if existing_movimento:
                processing_time = time.time() - start_time
                logs.append(f"Nota fiscal duplicada detectada - retornando informações existentes")
                
                # Criar uma exceção customizada com as informações processadas
                duplicate_error = DuplicateInvoiceError(
                    dados_extraidos.numero_nota_fiscal or "SEM_NUMERO",
                    message=f"Nota fiscal {dados_extraidos.numero_nota_fiscal or 'SEM_NUMERO'} já foi processada anteriormente",
                    details={
                        "invoice_number": dados_extraidos.numero_nota_fiscal,
                        "existing_movement_id": existing_movimento.idMovimentoContas,
                        "verification_data": {
                            "supplier": {
                                "exists": fornecedor_check.status.exists,
                                "id": fornecedor_check.status.entity_id,
                                "company_name": fornecedor_check.razao_social,
                                "message": "Fornecedor já existe no sistema" if fornecedor_check.status.exists else "Fornecedor não existe no sistema"
                            },
                            "billed_person": {
                                "exists": faturado_check.status.exists,
                                "id": faturado_check.status.entity_id,
                                "full_name": faturado_check.razao_social,
                                "message": "Pessoa faturada já existe no sistema" if faturado_check.status.exists else "Pessoa faturada não existe no sistema"
                            },
                            "expense_types": [
                                {
                                    "exists": despesa.status.exists,
                                    "id": despesa.status.entity_id,
                                    "description": despesa.descricao,
                                    "category": despesa.categoria,
                                    "message": "Tipo de despesa já existe no sistema" if despesa.status.exists else "Tipo de despesa não existe no sistema"
                                }
                                for despesa in despesas_check
                            ]
                        },
                        "extracted_data": dados_extraidos.dict()
                    }
                )
                raise duplicate_error
            
            # Criar entidades não existentes em transação única
            movimento_id = None
            movimento_criado = False
            
            try:
                # Não iniciar transação aqui - deixar os repositórios gerenciarem
                # db.begin()  # Removido para evitar conflito
                
                # Criar fornecedor se não existir
                if not fornecedor_check.status.exists:
                    fornecedor_check = await self._create_fornecedor(
                        dados_extraidos.fornecedor, pessoas_repo, logs, transaction_id
                    )
                
                # Criar faturado se não existir
                if not faturado_check.status.exists:
                    faturado_check = await self._create_faturado(
                        dados_extraidos.faturado if dados_extraidos.faturado else FaturadoExtraidoSchema(
                            cpf="", nome_completo="Não informado"
                        ),
                        pessoas_repo,
                        logs,
                        transaction_id
                    )
                
                # Classificações de despesa são tratadas via tabela Classificacao (many-to-many)
                logs.append(f"Despesas a classificar: {len(despesas_check)} itens via tabela Classificacao")
                
                # Criar movimento completo (com parcelas e classificações)
                movimento_id = await self._create_movimento_completo(
                    dados_extraidos, fornecedor_check, faturado_check,
                    despesas_check, db, movimento_repo, logs, transaction_id
                )
                movimento_criado = True
                
                # db.commit()  # Removido - cada repositório faz seu próprio commit
                logs.append("Operações concluídas com sucesso")
                logger.info("Operações concluídas com sucesso")
                
            except Exception as e:
                # db.rollback()  # Removido - não há transação global para reverter
                error_msg = f"Erro na transação: {str(e)}"
                errors.append(error_msg)
                logs.append(f"Erro nas operações: {error_msg}")
                logger.error(error_msg)
                raise
            
            processing_time = time.time() - start_time
            
            result = PostProcessingResult(
                success=True,
                fornecedor=fornecedor_check,
                faturado=faturado_check,
                despesas=despesas_check,
                extracted_data=dados_extraidos,
                movimento_criado=movimento_criado,
                movimento_id=movimento_id,
                transaction_id=transaction_id,
                processing_time=processing_time,
                logs=logs,
                errors=errors,
                error_message=None
            )
            
            logger.info(f"PÓS-PROCESSAMENTO CONCLUÍDO - Transaction ID: {transaction_id}")
            return result
            
        except DuplicateInvoiceError:
            raise
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"Erro no pós-processamento: {str(e)}"
            errors.append(error_msg)
            logger.error(error_msg)
            
            return PostProcessingResult(
                success=False,
                fornecedor=FornecedorExistenceCheck(
                    documento="",
                    razao_social="Erro",
                    status=EntityExistenceStatus(
                        exists=False,
                        entity_id=None,
                        entity_data=None,
                        created=False
                    )
                ),
                faturado=FaturadoExistenceCheck(
                    documento="",
                    razao_social="Erro",
                    status=EntityExistenceStatus(
                        exists=False,
                        entity_id=None,
                        entity_data=None,
                        created=False
                    )
                ),
                despesas=[],
                extracted_data=None,
                movimento_criado=False,
                movimento_id=None,
                transaction_id=transaction_id,
                processing_time=processing_time,
                logs=logs,
                errors=errors,
                error_message=error_msg
            )
    
    async def _check_fornecedor_existence(
        self, 
        fornecedor: FornecedorExtraidoSchema, 
        repo: PessoasRepository, 
        logs: List[str]
    ) -> FornecedorExistenceCheck:
        """Verifica se o fornecedor existe no banco de dados."""
        try:
            # Buscar por documento e nome
            pessoa = None
            if fornecedor.cnpj:  # Usar CNPJ em vez de documento
                pessoa = repo.find_fornecedor_by_documento_and_name(
                    fornecedor.cnpj, fornecedor.razao_social
                )
            
            if not pessoa and fornecedor.razao_social:
                # Buscar apenas por razão social
                pessoa = repo.find_by_razao_social_and_tipo(
                    fornecedor.razao_social, "FORNECEDOR"
                )
            
            if pessoa:
                logs.append(f"Fornecedor encontrado: {pessoa.razaosocial} (ID: {pessoa.idPessoas})")
                return FornecedorExistenceCheck(
                    documento=fornecedor.cnpj,  # Usar CNPJ como documento
                    razao_social=fornecedor.razao_social,
                    status=EntityExistenceStatus(
                        exists=True,
                        entity_id=getattr(pessoa, 'idPessoas', None),
                        entity_data={
                            "id": getattr(pessoa, 'idPessoas', None),
                            "razao_social": pessoa.razaosocial,
                            "documento": pessoa.documento,
                            "tipo": pessoa.tipo
                        },
                        created=False
                    )
                )
            else:
                logs.append(f"Fornecedor não encontrado: {fornecedor.razao_social}")
                return FornecedorExistenceCheck(
                    documento=fornecedor.cnpj,  # Usar CNPJ como documento
                    razao_social=fornecedor.razao_social,
                    status=EntityExistenceStatus(
                        exists=False,
                        entity_id=None,
                        entity_data=None,
                        created=False
                    )
                )
                
        except Exception as e:
            logs.append(f"Erro ao verificar fornecedor: {str(e)}")
            return FornecedorExistenceCheck(
                documento=fornecedor.cnpj,  # Usar CNPJ como documento
                razao_social=fornecedor.razao_social,
                status=EntityExistenceStatus(
                    exists=False,
                    entity_id=None,
                    entity_data=None,
                    created=False
                )
            )
    
    async def _check_faturado_existence(
        self, 
        faturado: FaturadoExtraidoSchema, 
        repo: PessoasRepository, 
        logs: List[str]
    ) -> FaturadoExistenceCheck:
        """Verifica se o faturado existe no banco de dados."""
        try:
            # Buscar por documento e nome
            pessoa = None
            if faturado.cpf:
                pessoa = repo.find_faturado_by_documento_and_name(
                    faturado.cpf, faturado.nome_completo
                )
            
            if not pessoa and faturado.nome_completo:
                # Buscar apenas por razão social
                pessoa = repo.find_by_razao_social_and_tipo(
                    faturado.nome_completo, "FATURADO"
                )
            
            if pessoa:
                logs.append(f"Faturado encontrado: {pessoa.razaosocial} (ID: {pessoa.idPessoas})")
                return FaturadoExistenceCheck(
                    documento=faturado.cpf,
                    razao_social=faturado.nome_completo,
                    status=EntityExistenceStatus(
                        exists=True,
                        entity_id=getattr(pessoa, 'idPessoas', None),
                        entity_data={
                            "id": getattr(pessoa, 'idPessoas', None),
                            "razao_social": pessoa.razaosocial,
                            "documento": pessoa.documento,
                            "tipo": pessoa.tipo
                        },
                        created=False
                    )
                )
            else:
                logs.append(f"Faturado não encontrado: {faturado.nome_completo}")
                return FaturadoExistenceCheck(
                    documento=faturado.cpf,
                    razao_social=faturado.nome_completo,
                    status=EntityExistenceStatus(
                        exists=False,
                        entity_id=None,
                        entity_data=None,
                        created=False
                    )
                )
                
        except Exception as e:
            logs.append(f"Erro ao verificar faturado: {str(e)}")
            return FaturadoExistenceCheck(
                documento=faturado.cpf,
                razao_social=faturado.nome_completo,
                status=EntityExistenceStatus(
                    exists=False,
                    entity_id=None,
                    entity_data=None,
                    created=False
                )
            )
    
    async def _check_despesa_existence(
        self, 
        despesa: ClassificacaoDespesaExtraidaSchema, 
        logs: List[str]
    ) -> DespesaExistenceCheck:
        """Verifica se o tipo de despesa existe - DEPRECATED: usar Classificacao."""
        # Não verifica mais, apenas retorna não existente
        logs.append(f"Classificação de despesa será tratada via tabela Classificacao: {despesa.descricao}")
        return DespesaExistenceCheck(
            descricao=despesa.descricao,
            categoria=despesa.categoria,
            status=EntityExistenceStatus(
                exists=False,
                entity_id=None,
                entity_data=None,
                created=False
            )
        )
    
    async def _create_fornecedor(
        self, 
        fornecedor: FornecedorExtraidoSchema, 
        repo: PessoasRepository, 
        logs: List[str],
        transaction_id: str
    ) -> FornecedorExistenceCheck:
        """Cria um novo fornecedor no banco de dados."""
        try:
            pessoa_data = {
                "tipo": "FORNECEDOR",
                "razaosocial": fornecedor.razao_social,
                "documento": fornecedor.cnpj,  # Usar CNPJ como documento
                "status": "ativo"  # Definir status padrão
            }
            
            pessoa = repo.create(pessoa_data)
            logs.append(f"Fornecedor criado: {pessoa.razaosocial} (ID: {pessoa.idPessoas})")
            
            return FornecedorExistenceCheck(
                documento=fornecedor.cnpj,  # Usar CNPJ como documento
                razao_social=fornecedor.razao_social,
                status=EntityExistenceStatus(
                    exists=True,
                    entity_id=getattr(pessoa, 'idPessoas', None),
                    entity_data={
                        "id": getattr(pessoa, 'idPessoas', None),
                        "razao_social": pessoa.razaosocial,
                        "documento": pessoa.documento,
                        "tipo": pessoa.tipo
                    },
                    created=True
                )
            )
            
        except Exception as e:
            error_msg = f"Erro ao criar fornecedor: {str(e)}"
            logs.append(error_msg)
            raise Exception(error_msg)
    
    async def _create_faturado(
        self, 
        faturado: FaturadoExtraidoSchema, 
        repo: PessoasRepository, 
        logs: List[str],
        transaction_id: str
    ) -> FaturadoExistenceCheck:
        """Cria um novo faturado no banco de dados."""
        try:
            pessoa_data = {
                "tipo": "FATURADO",
                "razaosocial": faturado.nome_completo,
                "documento": faturado.cpf,
                "status": "ativo"  # Definir status padrão
            }
            
            pessoa = repo.create(pessoa_data)
            logs.append(f"Faturado criado: {pessoa.razaosocial} (ID: {pessoa.idPessoas})")
            
            return FaturadoExistenceCheck(
                documento=faturado.cpf,
                razao_social=faturado.nome_completo,
                status=EntityExistenceStatus(
                    exists=True,
                    entity_id=getattr(pessoa, 'idPessoas', None),
                    entity_data={
                        "id": getattr(pessoa, 'idPessoas', None),
                        "razao_social": pessoa.razaosocial,
                        "documento": pessoa.documento,
                        "tipo": pessoa.tipo
                    },
                    created=True
                )
            )
            
        except Exception as e:
            error_msg = f"Erro ao criar faturado: {str(e)}"
            logs.append(error_msg)
            raise Exception(error_msg)
    
    async def _check_duplicate_invoice(
        self,
        dados_extraidos: DadosExtraidosPDFSchema,
        repo: MovimentoContasRepository,
        logs: List[str]
    ) -> Optional[MovimentoContas]:
        """Verifica se já existe movimento com esta nota fiscal e retorna o movimento existente."""
        if dados_extraidos.numero_nota_fiscal:
            existing_movimento = repo.find_by_nota_fiscal(dados_extraidos.numero_nota_fiscal)
            if existing_movimento:
                logs.append(f"Nota fiscal {dados_extraidos.numero_nota_fiscal} já processada - ID: {existing_movimento.idMovimentoContas}")
                return existing_movimento
        return None

    async def _create_movimento_completo(
        self,
        dados_extraidos: DadosExtraidosPDFSchema,
        fornecedor_check: FornecedorExistenceCheck,
        faturado_check: FaturadoExistenceCheck,
        despesas_check: List['DespesaExistenceCheck'],
        db: Session,
        repo: MovimentoContasRepository,
        logs: List[str],
        transaction_id: str
    ) -> int:
        """
        Cria o movimento completo no banco de dados.
        ETAPA 2: Cria parcelas e vincula classificações.
        """
        try:
            # Verificar se já existe movimento com esta nota fiscal
            existing_movimento = await self._check_duplicate_invoice(dados_extraidos, repo, logs)
            if existing_movimento:
                error_msg = f"Já existe um movimento com a nota fiscal {dados_extraidos.numero_nota_fiscal or 'SEM_NUMERO'}"
                logs.append(error_msg)
                raise DuplicateInvoiceError(dados_extraidos.numero_nota_fiscal or "SEM_NUMERO")
            
            movimento_data = {
                "tipo": "DESPESA",
                "numeronotafiscal": dados_extraidos.numero_nota_fiscal,
                "dataemissao": dados_extraidos.data_emissao,
                "descricao": f"NF {dados_extraidos.numero_nota_fiscal} - {fornecedor_check.razao_social}",
                "status": "PROCESSADO",
                "valortotal": float(dados_extraidos.valor_total),
                "Pessoas_idFornecedorCliente": fornecedor_check.status.entity_id,
                "Pessoas_idfaturado": faturado_check.status.entity_id
            }
            
            movimento = repo.create(movimento_data)
            logs.append(f"Movimento criado: NF {dados_extraidos.numero_nota_fiscal} (ID: {movimento.idMovimentoContas})")
            
            # ETAPA 2: Criar parcelas automaticamente
            from ..repositories.parcelas_repository import ParcelasContasRepository
            parcelas_repo = ParcelasContasRepository(db)
            
            parcelas_criadas = 0
            if dados_extraidos.parcelas and len(dados_extraidos.parcelas) > 0:
                for parcela in dados_extraidos.parcelas:
                    # Gerar identificação única para a parcela
                    identificacao = f"{dados_extraidos.numero_nota_fiscal}-P{parcela.numero_parcela:02d}"
                    
                    parcela_data = {
                        "identificacao": identificacao,
                        "numero_parcela": parcela.numero_parcela,
                        "valorparcela": float(parcela.valor_parcela),
                        "datavencimento": parcela.data_vencimento,
                        "statusparcela": "PENDENTE",
                        "MovimentoContas_idMovimentoContas": movimento.idMovimentoContas
                    }
                    
                    parcelas_repo.create(parcela_data)
                    parcelas_criadas += 1
                
                logs.append(f"{parcelas_criadas} parcela(s) criada(s) para o movimento")
            else:
                # Se não há parcelas, criar uma única parcela com valor total
                identificacao = f"{dados_extraidos.numero_nota_fiscal}-P01"
                parcela_data = {
                    "identificacao": identificacao,
                    "numero_parcela": 1,
                    "valorparcela": float(dados_extraidos.valor_total),
                    "datavencimento": dados_extraidos.data_emissao,
                    "statusparcela": "PENDENTE",
                    "MovimentoContas_idMovimentoContas": movimento.idMovimentoContas
                }
                parcelas_repo.create(parcela_data)
                parcelas_criadas = 1
                logs.append(f"1 parcela única criada (valor total)")
            
            # ETAPA 2: Vincular classificações ao movimento (many-to-many)
            from ..repositories.classificacao_repository import ClassificacaoRepository
            classificacao_repo = ClassificacaoRepository(db)
            
            classificacoes_vinculadas = 0
            for despesa_check in despesas_check:
                if despesa_check.status.exists and despesa_check.status.entity_id:
                    # Buscar a classificação correspondente por tipo e descrição
                    classificacao = classificacao_repo.find_by_tipo_and_descricao(
                        "DESPESA",
                        despesa_check.categoria
                    )
                    
                    if classificacao:
                        # Vincular classificação ao movimento via SQL direto (many-to-many)
                        sql = text("""
                            INSERT INTO movimento_contas_has_classificacao 
                            (MovimentoContas_idMovimentoContas, Classificacao_idClassificacao)
                            VALUES (:movimento_id, :classificacao_id)
                        """)
                        db.execute(sql, {
                            "movimento_id": movimento.idMovimentoContas,
                            "classificacao_id": classificacao.idClassificacao
                        })
                        db.commit()
                        classificacoes_vinculadas += 1
            
            logs.append(f"{classificacoes_vinculadas} classificação(ões) vinculada(s) ao movimento")
            
            # Retornar o ID do movimento como int
            movimento_id = getattr(movimento, 'idMovimentoContas', 0)
            return int(movimento_id) if movimento_id else 0
            
        except Exception as e:
            error_msg = f"Erro ao criar movimento: {str(e)}"
            logs.append(error_msg)
            raise