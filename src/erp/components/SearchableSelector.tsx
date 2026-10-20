import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

export interface SearchOption {
  id: string;
  title: string;
  code?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  meta?: any;
}

interface SearchableSelectorProps {
  label?: string;
  placeholder?: string;
  options: SearchOption[];
  value: string;
  onChange: (selectedId: string, item?: SearchOption) => void;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  className?: string;
  emptyMessage?: string;
}

export const SearchableSelector: React.FC<SearchableSelectorProps> = ({
  label,
  placeholder = 'ابحث بالاسم أو الرمز...',
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  helpText,
  className = '',
  emptyMessage = 'لا توجد نتائج مطابقة لبحثك',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = options.find((opt) => opt.id === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((opt) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const titleMatch = opt.title.toLowerCase().includes(q);
    const codeMatch = opt.code ? opt.code.toLowerCase().includes(q) : false;
    const subMatch = opt.subtitle ? opt.subtitle.toLowerCase().includes(q) : false;
    return titleMatch || codeMatch || subMatch;
  });

  const handleSelect = (item: SearchOption) => {
    onChange(item.id, item);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearch('');
  };

  return (
    <div className={`relative space-y-1 text-right ${className}`} ref={containerRef} dir="rtl">
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Selector Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full min-h-[42px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 cursor-pointer transition-all ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-[#2563EB] ring-2 ring-[#2563EB]/15'
            : selectedItem
            ? 'bg-white border-slate-300 hover:border-slate-400'
            : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
        }`}
      >
        {selectedItem ? (
          <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 truncate">
              {selectedItem.code && (
                <span className="font-mono text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                  {selectedItem.code}
                </span>
              )}
              <span className="font-bold text-slate-900 truncate">{selectedItem.title}</span>
              {selectedItem.subtitle && (
                <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                  • {selectedItem.subtitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {selectedItem.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    selectedItem.badgeColor || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {selectedItem.badge}
                </span>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="إلغاء التحديد"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <span className="text-slate-400 font-normal">{placeholder}</span>
        )}

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-150">
          {/* Search Box Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:border-[#2563EB] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = item.id === value;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.code && (
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {item.code}
                        </span>
                      )}
                      <span className="font-medium text-slate-900 truncate">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[10px] text-slate-400 truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            item.badgeColor || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-[#2563EB]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {helpText && <p className="text-[10px] text-slate-500 font-normal">{helpText}</p>}
    </div>
  );
};
