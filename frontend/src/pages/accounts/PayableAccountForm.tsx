import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingDown } from 'lucide-react';

export function PayableAccountForm() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/contas-pagar')} className="btn-outline p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingDown className="h-8 w-8 mr-3 text-red-600" />
            Nova Conta a Pagar
          </h1>
        </div>
      </div>
      <div className="card"><div className="card-body"><div className="text-center py-12">Em desenvolvimento</div></div></div>
    </div>
  );
}
