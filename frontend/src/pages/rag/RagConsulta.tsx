import React, { useState } from 'react';
import { Search, Brain, Loader2, Info } from 'lucide-react';
import ragService, { RagResponse, RagSource } from '@/services/ragService';
import toast from 'react-hot-toast';

type Strategy = 'simples' | 'embeddings';

export const RagConsulta: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [strategy, setStrategy] = useState<Strategy>('simples');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagResponse | null>(null);

  const handleAsk = async () => {
    if (!question || question.trim().length < 3) {
      toast.error('Digite uma pergunta com ao menos 3 caracteres');
      return;
    }
    try {
      setLoading(true);
      setResult(null);
      const response =
        strategy === 'simples'
          ? await ragService.askSimple(question)
          : await ragService.askEmbeddings(question);
      setResult(response);
    } catch (err) {
      // const error = err as AxiosError;
      toast.error('Falha ao consultar RAG');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" />
            Consulta Inteligente (RAG)
          </h1>
          <p className="text-gray-600 mt-1">
            Faça perguntas sobre o Banco de Dados e receba respostas elaboradas por LLM, apoiadas por busca contextual.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="strategy"
                value="simples"
                checked={strategy === 'simples'}
                onChange={() => setStrategy('simples')}
              />
              <span>RAG Simples</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="strategy"
                value="embeddings"
                checked={strategy === 'embeddings'}
                onChange={() => setStrategy('embeddings')}
              />
              <span>RAG Embeddings</span>
            </label>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <textarea
                className="w-full border rounded p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Ex.: Quais as parcelas pendentes do mês? Ou como funciona a geração de parcelas?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center gap-2 disabled:opacity-60"
              onClick={handleAsk}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Perguntar
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>
              Dica: use termos como "pessoas", "movimentos", "parcelas" ou "nota fiscal".
            </span>
          </div>
        </div>

        {result && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Resposta</h2>
                <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded">
                  {result.strategy}
                </span>
              </div>
              <div className="prose max-w-none whitespace-pre-wrap">
                {result.answer}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3">Fontes/Contexto</h2>
              {!result.sources || result.sources.length === 0 ? (
                <p className="text-gray-500">Sem fontes relacionadas.</p>
              ) : (
                <ul className="space-y-3">
                  {result.sources.map((s: RagSource, i: number) => (
                    <li key={i} className="border rounded p-3">
                      <div className="text-sm font-medium">{s.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{s.snippet}</div>
                      {typeof s.score === 'number' && (
                        <div className="text-[11px] text-gray-400 mt-1">score: {s.score.toFixed(3)}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};