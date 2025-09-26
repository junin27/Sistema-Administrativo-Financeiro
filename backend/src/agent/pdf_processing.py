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

import google.generativeai as genai
import PyPDF2
from io import BytesIO

from ..config.settings import settings
from ..schemas.pdf_processing import (
    DadosExtraidosPDFSchema, 
    ProcessamentoPDFResponseSchema,
    FornecedorExtraidoSchema,
    FaturadoExtraidoSchema,
    ParcelaExtraidaSchema,
    ClassificacaoDespesaExtraidaSchema
)

# Configurar logging
logger = logging.getLogger(__name__)


class PDFProcessingService:
    """
    Service para processamento de PDF com IA Gemini.
    Aplica padrão de responsabilidade única para processamento de documentos.
    """
    
    def __init__(self):
        """Inicializa o service configurando a API do Gemini."""
        self._configure_gemini()
        self._setup_classification_rules()
    
    def _configure_gemini(self) -> None:
        """Configura a API do Google Gemini."""
        try:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
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
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
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
                tempo_processamento=tempo_processamento
            )
            
        except Exception as e:
            tempo_processamento = time.time() - start_time
            logger.error(f"Erro no processamento do PDF {filename}: {e}")
            
            return ProcessamentoPDFResponseSchema(
                sucesso=False,
                erro=str(e),
                tempo_processamento=tempo_processamento
            )
    
    async def _process_with_gemini(self, pdf_text: str) -> DadosExtraidosPDFSchema:
        """Processa texto com IA Gemini para extrair dados estruturados."""
        
        prompt = self._build_extraction_prompt(pdf_text)
        
        logger.info("ENVIANDO PROMPT PARA GEMINI:")
        logger.info("=" * 50)
        logger.info(prompt[:500] + "..." if len(prompt) > 500 else prompt)
        logger.info("=" * 50)
        
        try:
            response = self.model.generate_content(prompt)
            
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
                        parcela["valor_parcela"] = Decimal(str(parcela["valor_parcela"]))
            
            # Converter valor total
            if isinstance(data.get("valor_total"), str):
                logger.info(f"Convertendo valor_total: {data.get('valor_total')}")
                data["valor_total"] = Decimal(str(data["valor_total"]))
            
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
                    percentual=Decimal("100.00"),
                    confianca=confidence
                )
                classificacoes.append(classificacao)
        
        # Se nenhuma classificação encontrada, usar categoria genérica
        if not classificacoes:
            classificacoes.append(
                ClassificacaoDespesaExtraidaSchema(
                    categoria="ADMINISTRATIVAS",
                    descricao="Classificação automática - Revisar manualmente",
                    percentual=Decimal("100.00"),
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
