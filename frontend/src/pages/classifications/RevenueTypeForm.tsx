import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt } from 'lucide-react';

export function RevenueTypeForm() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/tipos-receita')} className="btn-outline p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Receipt className="h-8 w-8 mr-3 text-green-600" />
            Novo Tipo de Receita
          </h1>
        </div>
      </div>
      <div className="card"><div className="card-body"><div className="text-center py-12">Em desenvolvimento</div></div></div>
    </div>
  );
}
