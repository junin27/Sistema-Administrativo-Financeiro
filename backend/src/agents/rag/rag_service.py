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
        result: Dict[str, object] = {"question": question, "metrics": {}, "explanations": []}

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
        prompt = (
            "Você é um assistente técnico. Com base nas fontes abaixo, responda a pergunta de forma clara, "
            "objetiva e com linguagem de negócios. Se necessário, cite quais regras foram aplicadas.\n\n"
            f"FONTES:\n{context}\n\nPergunta: {question}\nResposta:"
        )
        answer = await self._elaborate_with_llm(prompt)
        return {
            "question": question,
            "sources": [{"id": d.id, "title": d.title} for d in top_docs],
            "answer": answer,
        }

    def _compose_summary(self, question: str, result: Dict[str, object]) -> str:
        metrics = result.get("metrics", {})
        lines = [
            f"Pergunta: {question}",
            "Resumo de métricas consultadas:",
        ]
        for k, v in metrics.items():
            lines.append(f"- {k}: {v}")
        lines.append("Explanações:")
        for e in result.get("explanations", []):
            lines.append(f"- {e}")
        return "\n".join(lines)

    async def _elaborate_with_llm(self, content: str) -> str:
        if GEMINI_AVAILABLE and genai is not None:
            try:
                from ..config.settings import settings
                api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or getattr(settings, "gemini_api_key", "")
                model_name = getattr(settings, "gemini_model", None) or os.getenv("GEMINI_MODEL") or "gemini-1.5-flash"
                if api_key:
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel(model_name)
                    resp = model.generate_content(content)
                    text = getattr(resp, "text", None)
                    if text:
                        return text
            except Exception:
                pass
        return self._conversational_fallback(content)

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
        for line in content.splitlines():
            if line.strip().lower().startswith("pergunta:"):
                return line.split(":", 1)[1].strip()
        return content.strip()

    def _extract_metrics(self, content: str) -> Dict[str, float]:
        capture = False
        metrics: Dict[str, float] = {}
        for line in content.splitlines():
            l = line.strip()
            if l.lower().startswith("resumo de métricas"):
                capture = True
                continue
            if capture:
                if not l or l.lower().startswith("explicações"):
                    break
                if l.startswith("-") and ":" in l:
                    k, v = l[1:].split(":", 1)
                    key = k.strip()
                    val = v.strip()
                    try:
                        metrics[key] = float(val)
                    except Exception:
                        metrics[key] = 0.0
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
        if any(x in ql for x in ["parcela", "parcelas"]):
            pend = int(metrics.get("parcelas_pendentes", 0))
            pagas = int(metrics.get("parcelas_pagas", 0))
            venc = int(metrics.get("parcelas_vencidas", 0))
            total = pend + pagas + venc
            if total > 0:
                parts.append(f"Sim, há {total} parcelas registradas.")
                if pend or pagas or venc:
                    det = []
                    if pend:
                        det.append(f"{pend} pendentes")
                    if pagas:
                        det.append(f"{pagas} pagas")
                    if venc:
                        det.append(f"{venc} vencidas")
                    parts.append("Detalhe: " + ", ".join(det) + ".")
            else:
                parts.append("Não encontrei parcelas registradas no momento.")
        if any(x in ql for x in ["pessoa", "pessoas"]):
            total = int(metrics.get("pessoas_total", 0))
            inativas = int(metrics.get("pessoas_inativas", 0))
            if total:
                parts.append(f"O cadastro possui {total} pessoas, com {inativas} inativas.")
            else:
                parts.append("Não há pessoas cadastradas.")
        if any(x in ql for x in ["movimento", "notas", "contas a pagar", "contas a receber"]):
            mov_total = int(metrics.get("movimentos_total", 0))
            mov_inativos = int(metrics.get("movimentos_inativos", 0))
            desp = metrics.get("total_despesa", None)
            rec = metrics.get("total_receita", None)
            if mov_total:
                parts.append(f"Existem {mov_total} movimentos ativos e {mov_inativos} inativos.")
            if isinstance(desp, float):
                parts.append(f"Total de despesas: R$ {desp:,.2f}.")
            if isinstance(rec, float):
                parts.append(f"Total de receitas: R$ {rec:,.2f}.")
        if not parts:
            parts.append("Entendi sua pergunta. Posso consultar e detalhar os dados conforme necessário.")
        parts.append("Se desejar, posso listar os itens específicos ou filtrar por período.")
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