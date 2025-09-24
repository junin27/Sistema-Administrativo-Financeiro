import { Link } from 'react-router-dom';
import { Plus, Tags } from 'lucide-react';

export function ExpenseTypes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Tags className="h-8 w-8 mr-3 text-red-600" />
            Tipos de Despesa
          </h1>
        </div>
        <Link to="/tipos-despesa/novo" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Link>
      </div>
      <div className="card"><div className="card-body"><div className="text-center py-12">Em desenvolvimento</div></div></div>
    </div>
  );
}
