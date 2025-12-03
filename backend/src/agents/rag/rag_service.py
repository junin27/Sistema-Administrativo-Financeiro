from __future__ import annotations

import os
import math
import re
from typing import Dict, List, Optional
from dataclasses import dataclass

try:
    import google.generativeai as genai  # type: ignore
    GEMINI_AVAILABLE = True
except Exception:
    genai = None  # type: ignore
    GEMINI_AVAILABLE = False


def _normalize_text(text: str) -> List[str]:
    text = text.lower()
    tokens = re.findall(r"[a-záéíóúãõâêôç0-9]+", text)
    return tokens


def _vectorize(tokens: List[str]) -> Dict[str, float]:
    counts: Dict[str, float] = {}
    for t in tokens:
        counts[t] = counts.get(t, 0.0) + 1.0
    norm = math.sqrt(sum(v * v for v in counts.values())) or 1.0
    return {k: v / norm for k, v in counts.items()}


def _cosine(a: Dict[str, float], b: Dict[str, float]) -> float:
    keys = set(a.keys()) & set(b.keys())
    return sum(a[k] * b[k] for k in keys)


@dataclass
class EmbeddingDoc:
    id: str
    title: str
    content: str
    vec: Dict[str, float]


class EmbeddingsIndex:
    def __init__(self) -> None:
        self.docs: List[EmbeddingDoc] = []
        self._built = False

    def add_document(self, doc_id: str, title: str, content: str) -> None:
        tokens = _normalize_text(content)
        vec = _vectorize(tokens)
        self.docs.append(EmbeddingDoc(id=doc_id, title=title, content=content, vec=vec))

    def build_from_workspace(self, root_path: str) -> None:
        if self._built:
            return
        parcela_path = os.path.join(root_path, "parcela.txt")
        if os.path.exists(parcela_path):
            with open(parcela_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            self.add_document("parcela.txt", "Especificação de Regras (parcela.txt)", content)

        candidates = [
            os.path.join(root_path, "src", "models", "ddl_models.py"),
            os.path.join(root_path, "src", "models", "parcelas_models.py"),
            os.path.join(root_path, "src", "schemas", "ddl_schemas.py"),
            os.path.join(root_path, "src", "schemas", "parcelas_schemas.py"),
            os.path.join(root_path, "src", "routers", "ddl_routers.py"),
            os.path.join(root_path, "src", "routers", "parcelas_routers.py"),
        ]
        for p in candidates:
            if os.path.exists(p):
                try:
                    with open(p, "r", encoding="utf-8", errors="ignore") as f:
                        c = f.read()
                    self.add_document(p, f"Código: {os.path.basename(p)}", c)
                except Exception:
                    pass

        self._built = True

    def query(self, question: str, top_k: int = 3) -> List[EmbeddingDoc]:
        q_vec = _vectorize(_normalize_text(question))
        scored = [(doc, _cosine(q_vec, doc.vec)) for doc in self.docs]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [d for d, _ in scored[:top_k]]


class RAGService:
    def __init__(self, root_path: Optional[str] = None) -> None:
        self.root_path = root_path or os.getcwd()
        self.index = EmbeddingsIndex()
        self.index.build_from_workspace(self.root_path)

    async def rag_simples(self, question: str, db) -> Dict[str, object]:
        from ...repositories.ddl_repositories import PessoasRepository, MovimentoContasRepository
        from ...repositories.parcelas_repository import ParcelasContasRepository

        pessoas_repo = PessoasRepository(db)
        movimentos_repo = MovimentoContasRepository(db)
        parcelas_repo = ParcelasContasRepository(db)

        q = question.lower()
        result: Dict[str, object] = {"question": question, "metrics": {}, "explanations": [], "context": {}}

        # Detectar perguntas sobre estrutura do banco de dados
        db_structure_keywords = ["banco de dados", "tabela", "tabelas", "estrutura", "schema", "campos", "colunas", 
                                "relacionamento", "relacionamentos", "modelo", "entidade", "entidades"]
        is_db_structure_question = any(k in q for k in db_structure_keywords)
        
        if is_db_structure_question:
            # Adicionar informações sobre a estrutura do banco
            result["context"]["database_structure"] = {
                "tabelas_principais": [
                    {
                        "nome": "pessoas",
                        "descricao": "Cadastro de pessoas físicas e jurídicas (fornecedores, clientes, etc.)",
                        "campos_principais": ["idPessoas", "nome", "tipo", "cpf_cnpj", "ativo"]
                    },
                    {
                        "nome": "movimento_contas",
                        "descricao": "Registro de movimentos financeiros (receitas e despesas)",
                        "campos_principais": ["idMovimentoContas", "descricao", "tipo", "valor", "data", "ativo"]
                    },
                    {
                        "nome": "parcelas_contas",
                        "descricao": "Parcelas vinculadas aos movimentos financeiros",
                        "campos_principais": ["idParcelasContas", "identificacao", "numero_parcela", "valorparcela", 
                                             "valorpago", "valorsaldo", "datavencimento", "datapagamento", "statusparcela"]
                    },
                    {
                        "nome": "classificacao",
                        "descricao": "Classificação de despesas e receitas",
                        "campos_principais": ["idClassificacao", "nome", "tipo", "ativo"]
                    }
                ],
                "relacionamentos": [
                    "parcelas_contas -> movimento_contas (MovimentoContas_idMovimentoContas)",
                    "movimento_contas -> pessoas (Pessoas_idPessoas)",
                    "movimento_contas -> classificacao (via movimento_contas_has_classificacao)"
                ]
            }

        if any(k in q for k in ["quantidade de pessoas", "total de pessoas", "contar pessoas", "pessoas", "pessoa"]):
            pessoas = pessoas_repo.get_all(include_deleted=True)
            inativas = pessoas_repo.find_inactive()
            result["metrics"] = {**(result.get("metrics", {}) or {}), "pessoas_total": len(pessoas), "pessoas_inativas": len(inativas)}

        if any(k in q for k in ["movimento", "movimentos", "nota", "notas", "contas a pagar", "contas a receber"]):
            movs = movimentos_repo.get_all(include_deleted=True)
            inativos = movimentos_repo.find_inactive()
            metrics = {"movimentos_total": len(movs), "movimentos_inativos": len(inativos)}
            try:
                metrics["total_despesa"] = movimentos_repo.get_total_by_tipo("DESPESA")
                metrics["total_receita"] = movimentos_repo.get_total_by_tipo("RECEITA")
            except Exception:
                pass
            result["metrics"] = {**(result.get("metrics", {}) or {}), **metrics}

        if any(k in q for k in ["parcela", "parcelas", "vencimento", "pendente", "paga", "vencidas"]):
            pendentes = parcelas_repo.find_by_status("PENDENTE")
            pagas = parcelas_repo.find_by_status("PAGA")
            vencidas = parcelas_repo.find_vencidas()
            m = {"parcelas_pendentes": len(pendentes), "parcelas_pagas": len(pagas), "parcelas_vencidas": len(vencidas)}
            result["metrics"] = {**(result.get("metrics", {}) or {}), **m}

        summary = self._compose_summary(question, result)
        explanation = await self._elaborate_with_llm(summary)
        result["answer"] = explanation
        return result

    async def rag_embeddings(self, question: str) -> Dict[str, object]:
        top_docs = self.index.query(question, top_k=3)
        context = "\n\n".join([f"[Fonte: {d.title}]\n{self._shorten(d.content)}" for d in top_docs])
        
        prompt = f"""Você é um assistente especializado em sistemas financeiros e administrativos.

O usuário fez a seguinte pergunta:
"{question}"

DOCUMENTAÇÃO E CÓDIGO RELEVANTE:
{context}

INSTRUÇÕES:
1. Analise a pergunta e a documentação fornecida
2. Gere uma resposta completa, clara e técnica quando necessário
3. Explique conceitos, regras de negócio e estruturas de dados quando relevante
4. Se a pergunta for sobre o banco de dados, explique as tabelas, relacionamentos e campos
5. Use linguagem técnica mas acessível
6. Cite as fontes quando apropriado
7. Se não encontrar informação suficiente, indique isso e sugira onde buscar mais informações

Responda de forma completa e útil:"""
        
        answer = await self._elaborate_with_llm(prompt)
        return {
            "question": question,
            "sources": [{"title": d.title, "snippet": self._shorten(d.content, 200)} for d in top_docs],
            "answer": answer,
        }

    def _compose_summary(self, question: str, result: Dict[str, object]) -> str:
        metrics = result.get("metrics", {})
        
        # Criar um prompt mais rico e contextualizado para a IA
        prompt = f"""Você é um assistente especializado em gestão financeira e administrativa.

O usuário fez a seguinte pergunta sobre o sistema financeiro:
"{question}"

"""
        
        # Adicionar informações sobre estrutura do banco se disponível
        context = result.get("context", {})
        if "database_structure" in context:
            db_info = context["database_structure"]
            prompt += "ESTRUTURA DO BANCO DE DADOS:\n"
            for tabela in db_info.get("tabelas_principais", []):
                prompt += f"\n📋 Tabela: {tabela['nome']}\n"
                prompt += f"   Descrição: {tabela['descricao']}\n"
                prompt += f"   Campos principais: {', '.join(tabela['campos_principais'])}\n"
            
            if db_info.get("relacionamentos"):
                prompt += "\n🔗 Relacionamentos:\n"
                for rel in db_info["relacionamentos"]:
                    prompt += f"   - {rel}\n"
            
            prompt += "\n"
        
        prompt += "Dados consultados do banco de dados:\n"
        
        # Adicionar métricas de forma estruturada
        if metrics:
            if "pessoas_total" in metrics:
                prompt += f"\n📊 PESSOAS:\n"
                prompt += f"  - Total de pessoas cadastradas: {metrics.get('pessoas_total', 0)}\n"
                prompt += f"  - Pessoas inativas: {metrics.get('pessoas_inativas', 0)}\n"
            
            if "movimentos_total" in metrics:
                prompt += f"\n💰 MOVIMENTOS FINANCEIROS:\n"
                prompt += f"  - Total de movimentos: {metrics.get('movimentos_total', 0)}\n"
                prompt += f"  - Movimentos inativos: {metrics.get('movimentos_inativos', 0)}\n"
                if "total_despesa" in metrics:
                    prompt += f"  - Total de despesas: R$ {metrics.get('total_despesa', 0):,.2f}\n"
                if "total_receita" in metrics:
                    prompt += f"  - Total de receitas: R$ {metrics.get('total_receita', 0):,.2f}\n"
            
            if "parcelas_pendentes" in metrics or "parcelas_pagas" in metrics:
                prompt += f"\n📅 PARCELAS:\n"
                prompt += f"  - Parcelas pendentes: {metrics.get('parcelas_pendentes', 0)}\n"
                prompt += f"  - Parcelas pagas: {metrics.get('parcelas_pagas', 0)}\n"
                prompt += f"  - Parcelas vencidas: {metrics.get('parcelas_vencidas', 0)}\n"
        
        prompt += f"""
INSTRUÇÕES:
1. Analise a pergunta do usuário e os dados fornecidos
2. Gere uma resposta clara, natural e contextualizada em português brasileiro
3. Use os dados do banco para fundamentar sua resposta
4. Seja específico e forneça números quando disponíveis
5. Se não houver dados suficientes, explique o que foi encontrado e sugira próximos passos
6. Use linguagem profissional mas acessível
7. Se a pergunta for sobre estrutura do banco, explique as tabelas e relacionamentos

Responda de forma completa e útil:"""
        
        return prompt

    async def _elaborate_with_llm(self, content: str) -> str:
        if GEMINI_AVAILABLE and genai is not None:
            import asyncio
            import logging
            logger = logging.getLogger(__name__)
            
            try:
                from ...config.settings import settings
                
                from ...config.gemini_config import get_gemini_api_key
                api_key = get_gemini_api_key() or ""
                model_name = getattr(settings, "gemini_model", None) or os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"
                
                if api_key:
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel(model_name)
                    
                    # Configurar parâmetros para respostas mais criativas e completas
                    generation_config = {
                        "temperature": 0.7,  # Mais criativo (0.0-1.0)
                        "top_p": 0.95,
                        "top_k": 40,
                        "max_output_tokens": 2048,  # Respostas mais longas
                    }
                    
                    # Retry logic com exponential backoff
                    retries = 0
                    max_retries = 3
                    base_delay = 3  # segundos
                    
                    while retries < max_retries:
                        try:
                            logger.info(f"Enviando prompt para Gemini AI (modelo: {model_name}, tentativa {retries + 1}/{max_retries})...")
                            resp = model.generate_content(content, generation_config=generation_config)
                            text = getattr(resp, "text", None)
                            if text:
                                logger.info("Resposta recebida do Gemini AI")
                                return text.strip()
                            else:
                                logger.warning("Resposta do Gemini AI vazia")
                                break
                        except Exception as e:
                            error_str = str(e)
                            logger.error(f"Erro na análise com IA (tentativa {retries + 1}/{max_retries}): {error_str}")
                            
                            # Verificar se é erro de quota
                            if "quota" in error_str.lower() or "429" in error_str:
                                # Verificar se é quota diária (não adianta esperar) ou quota por minuto (pode esperar)
                                is_daily_quota = "perday" in error_str.lower() or "daily" in error_str.lower()
                                
                                if is_daily_quota:
                                    # Quota diária excedida - não adianta esperar, usar fallback imediatamente
                                    logger.warning("Quota diária excedida. Usando fallback imediatamente.")
                                    break
                                else:
                                    # Quota por minuto - pode tentar novamente após esperar
                                    retry_after = self._extract_retry_delay(error_str)
                                    # Limitar o delay máximo a 10 segundos para não causar timeout
                                    delay = min(retry_after if retry_after > 0 else base_delay * (2 ** retries), 10)
                                    
                                    if retries < max_retries - 1:
                                        logger.warning(f"Quota por minuto excedida. Aguardando {delay:.2f} segundos antes de tentar novamente...")
                                        await asyncio.sleep(delay)
                                        retries += 1
                                    else:
                                        logger.warning("Quota excedida após todas as tentativas. Usando fallback.")
                                        break
                            else:
                                # Outros erros, não tentar novamente
                                logger.error(f"Erro não relacionado a quota: {error_str}")
                                break
            except Exception as e:
                logger.error(f"Erro ao configurar Gemini AI: {str(e)}")
        
        # Fallback se a IA não estiver disponível ou quota excedida
        logger.info("Usando fallback para gerar resposta baseada nos dados consultados")
        return self._conversational_fallback(content)
    
    def _extract_retry_delay(self, error_str: str) -> float:
        """Extrai o delay de retry da mensagem de erro do Gemini"""
        import re
        # Procura por "retry_delay { seconds: X }" ou "Please retry in Xs"
        match = re.search(r'retry_delay.*?seconds[:\s]+(\d+(?:\.\d+)?)', error_str, re.IGNORECASE)
        if match:
            return float(match.group(1))
        match = re.search(r'retry in ([\d.]+)s', error_str, re.IGNORECASE)
        if match:
            return float(match.group(1))
        return 0

    def _conversational_fallback(self, content: str) -> str:
        if "Pergunta:" in content:
            q = self._extract_question(content)
            m = self._extract_metrics(content)
            return self._answer_from_metrics(q, m)
        if "FONTES:" in content:
            q = self._extract_question_from_prompt(content)
            sources = self._extract_sources(content)
            return self._answer_from_sources(q, sources)
        return self._default_conversational(content)

    def _extract_question(self, content: str) -> str:
        # Tenta extrair a pergunta de diferentes formatos
        for line in content.splitlines():
            line_lower = line.strip().lower()
            if line_lower.startswith("pergunta:") or line_lower.startswith("o usuário fez a seguinte pergunta"):
                if ":" in line:
                    return line.split(":", 1)[1].strip().strip('"')
                elif '"' in line:
                    # Extrai texto entre aspas
                    import re
                    match = re.search(r'"([^"]+)"', line)
                    if match:
                        return match.group(1)
        # Se não encontrou, tenta pegar a primeira linha que parece uma pergunta
        for line in content.splitlines():
            if "?" in line and len(line.strip()) > 10:
                return line.strip()
        return content.strip()

    def _extract_metrics(self, content: str) -> Dict[str, float]:
        metrics: Dict[str, float] = {}
        
        # Procura por diferentes formatos de métricas
        capture = False
        for line in content.splitlines():
            l = line.strip()
            
            # Detecta início da seção de dados
            if any(keyword in l.lower() for keyword in ["dados consultados", "resumo de métricas", "📊", "💰", "📅"]):
                capture = True
                continue
            
            if capture:
                # Para quando encontra nova seção
                if l.lower().startswith("instruções") or l.lower().startswith("explicações"):
                    break
                
                # Extrai métricas de diferentes formatos
                if ":" in l:
                    # Formato: "  - Total de pessoas: 10"
                    if l.startswith("-"):
                        parts = l[1:].split(":", 1)
                    else:
                        parts = l.split(":", 1)
                    
                    if len(parts) == 2:
                        key = parts[0].strip().replace("📊", "").replace("💰", "").replace("📅", "").strip()
                        val_str = parts[1].strip()
                        
                        # Tenta extrair número (pode ter formatação)
                        import re
                        # Remove formatação de moeda e espaços
                        val_str = re.sub(r'[R$\s,\.]', '', val_str)
                        # Procura por número
                        num_match = re.search(r'(\d+(?:\.\d+)?)', val_str)
                        if num_match:
                            try:
                                metrics[key] = float(num_match.group(1))
                            except Exception:
                                pass
        
        return metrics

    def _extract_question_from_prompt(self, content: str) -> str:
        for line in content.splitlines():
            if line.strip().lower().startswith("pergunta:"):
                return line.split(":", 1)[1].strip()
        return content.strip()

    def _extract_sources(self, content: str) -> List[str]:
        titles: List[str] = []
        for line in content.splitlines():
            l = line.strip()
            if l.startswith("[Fonte:"):
                try:
                    t = l.split("]", 1)[0]
                    t = t.replace("[Fonte:", "").strip()
                    titles.append(t)
                except Exception:
                    pass
        return titles

    def _answer_from_metrics(self, question: str, metrics: Dict[str, float]) -> str:
        ql = question.lower()
        parts: List[str] = []
        
        # Melhor detecção de perguntas sobre parcelas
        if any(x in ql for x in ["parcela", "parcelas", "pendente", "pendentes", "paga", "pagas", "vencida", "vencidas"]):
            # Procura por diferentes nomes de métricas
            pend = int(metrics.get("parcelas_pendentes", 0) or 
                      metrics.get("Parcelas pendentes", 0) or
                      metrics.get("PARCELAS", 0) or 0)
            pagas = int(metrics.get("parcelas_pagas", 0) or 
                       metrics.get("Parcelas pagas", 0) or 0)
            venc = int(metrics.get("parcelas_vencidas", 0) or 
                      metrics.get("Parcelas vencidas", 0) or 0)
            
            total = pend + pagas + venc
            
            # Resposta específica para perguntas sobre pendentes
            if "pendente" in ql or "pendentes" in ql:
                if pend > 0:
                    parts.append(f"Sim, existem {pend} parcela(s) pendente(s) no sistema.")
                    if venc > 0:
                        parts.append(f"Além disso, há {venc} parcela(s) vencida(s) que precisam de atenção.")
                else:
                    parts.append("Não há parcelas pendentes no momento. Todas as parcelas foram pagas ou não há parcelas cadastradas.")
            elif total > 0:
                parts.append(f"Sim, há {total} parcela(s) registrada(s) no sistema.")
                det = []
                if pend:
                    det.append(f"{pend} pendente(s)")
                if pagas:
                    det.append(f"{pagas} paga(s)")
                if venc:
                    det.append(f"{venc} vencida(s)")
                if det:
                    parts.append("Detalhamento: " + ", ".join(det) + ".")
            else:
                parts.append("Não encontrei parcelas registradas no sistema no momento.")
        
        if any(x in ql for x in ["pessoa", "pessoas", "fornecedor", "fornecedores", "cliente", "clientes"]):
            total = int(metrics.get("pessoas_total", 0) or 
                       metrics.get("Total de pessoas cadastradas", 0) or 0)
            inativas = int(metrics.get("pessoas_inativas", 0) or 
                          metrics.get("Pessoas inativas", 0) or 0)
            if total:
                parts.append(f"O cadastro possui {total} pessoa(s) cadastrada(s).")
                if inativas > 0:
                    parts.append(f"Dessas, {inativas} estão inativas.")
            else:
                parts.append("Não há pessoas cadastradas no sistema.")
        
        if any(x in ql for x in ["movimento", "movimentos", "nota", "notas", "contas a pagar", "contas a receber", "despesa", "receita"]):
            mov_total = int(metrics.get("movimentos_total", 0) or 
                           metrics.get("Total de movimentos", 0) or 0)
            mov_inativos = int(metrics.get("movimentos_inativos", 0) or 
                              metrics.get("Movimentos inativos", 0) or 0)
            desp = metrics.get("total_despesa", None) or metrics.get("Total de despesas", None)
            rec = metrics.get("total_receita", None) or metrics.get("Total de receitas", None)
            
            if mov_total:
                parts.append(f"Existem {mov_total} movimento(s) financeiro(s) registrado(s).")
                if mov_inativos > 0:
                    parts.append(f"Desses, {mov_inativos} estão inativos.")
            if isinstance(desp, (int, float)) and desp > 0:
                parts.append(f"Total de despesas: R$ {desp:,.2f}.")
            if isinstance(rec, (int, float)) and rec > 0:
                parts.append(f"Total de receitas: R$ {rec:,.2f}.")
        
        if not parts:
            # Tenta usar os dados disponíveis mesmo sem match exato
            if metrics:
                parts.append("Com base nos dados consultados:")
                for key, value in list(metrics.items())[:3]:  # Limita a 3 métricas
                    if isinstance(value, (int, float)) and value > 0:
                        parts.append(f"- {key}: {value}")
                if not parts:
                    parts.append("Os dados foram consultados, mas não encontrei informações específicas para sua pergunta.")
            else:
                parts.append("Entendi sua pergunta. Consultei o banco de dados, mas não encontrei dados específicos para responder.")
        
        return " ".join(parts)

    def _answer_from_sources(self, question: str, sources: List[str]) -> str:
        base = "Com base nas fontes fornecidas, entendi sua intenção."
        if sources:
            src = ", ".join(sources)
            base = f"Com base nas fontes ({src}), posso orientar sua consulta."
        ql = question.lower()
        if any(x in ql for x in ["parcela", "parcelas"]):
            guide = "As parcelas são vinculadas a movimentos financeiros e podem ser consultadas por status ou por movimento. Posso verificar se há parcelas pendentes, pagas ou vencidas e trazer um resumo."
            return f"{base} {guide} Deseja que eu cheque agora e apresente os números?"
        if any(x in ql for x in ["pessoa", "pessoas"]):
            guide = "O sistema de pessoas permite filtrar por status e buscar por nome. Posso verificar quantas pessoas estão cadastradas e se há registros inativos."
            return f"{base} {guide} Quer que eu retorne um resumo?"
        return f"{base} Posso elaborar uma resposta objetiva e sugerir próximos passos com base nos endpoints disponíveis."

    def _default_conversational(self, content: str) -> str:
        return "Posso ajudar com uma resposta objetiva e contextualizada. Deseja que eu detalhe ou execute uma consulta agora?"

    def _shorten(self, text: str, max_chars: int = 1200) -> str:
        if len(text) <= max_chars:
            return text
        return text[:max_chars] + "\n... (conteúdo truncado)"