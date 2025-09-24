import { Link } from 'react-router-dom';
import { Plus, Receipt } from 'lucide-react';

export function RevenueTypes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Receipt className="h-8 w-8 mr-3 text-green-600" />
            Tipos de Receita
          </h1>
        </div>
        <Link to="/tipos-receita/novo" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Link>
      </div>
      <div className="card"><div className="card-body"><div className="text-center py-12">Em desenvolvimento</div></div></div>
    </div>
  );
}
