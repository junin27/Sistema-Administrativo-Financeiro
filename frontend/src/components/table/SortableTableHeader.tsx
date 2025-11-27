import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowUp, ArrowDown, List } from 'lucide-react';

export type SortOrder = 'asc' | 'desc' | 'default';

interface SortableTableHeaderProps {
  label: string;
  field: string;
  currentSort?: {
    field: string;
    order: SortOrder;
  };
  onSortChange: (field: string, order: SortOrder) => void;
  className?: string;
}

export const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  label,
  field,
  currentSort,
  onSortChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = currentSort?.field === field;
  const currentOrder = isActive ? (currentSort.order || 'default') : 'default';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSort = (order: SortOrder) => {
    onSortChange(field, order);
    setIsOpen(false);
  };

  const getIcon = () => {
    // Se não está ativo, mostra ChevronDown
    if (!isActive) {
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    // Se está ativo, mostra o ícone baseado na ordem atual
    switch (currentOrder) {
      case 'asc':
        return <ArrowUp className="h-4 w-4 text-blue-600" />;
      case 'desc':
        return <ArrowDown className="h-4 w-4 text-blue-600" />;
      case 'default':
        return <List className="h-4 w-4 text-blue-600" />;
      default:
        return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider relative ${className}`}
    >
      <div className="relative" ref={menuRef}>
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-blue-600 font-semibold border-b-2 border-dashed border-blue-500 pb-1">
            {label}
          </span>
          <div
            className={`flex items-center justify-center p-1 rounded hover:bg-blue-50 transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-400'
            }`}
            title="Ordenar coluna"
          >
            {getIcon()}
          </div>
        </div>

        {isOpen && (
          <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSort('asc');
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                  currentOrder === 'asc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <ArrowUp className="h-4 w-4" />
                Ordem Crescente
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSort('desc');
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                  currentOrder === 'desc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <ArrowDown className="h-4 w-4" />
                Ordem Decrescente
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSort('default');
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                  currentOrder === 'default' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
                Ordem de Armazenamento
              </button>
            </div>
          </div>
        )}
      </div>
    </th>
  );
};

