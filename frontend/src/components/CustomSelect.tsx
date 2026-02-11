import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  className = '',
  'aria-label': ariaLabel = 'Seleção',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: CustomSelectOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`
          w-full flex items-center justify-between gap-2
          px-4 py-3.5 md:px-5 md:py-4
          bg-white border-2 rounded-xl
          text-left font-medium text-sm md:text-base
          cursor-pointer outline-none
          transition-all duration-200
          shadow-sm
          hover:border-primary-300 hover:shadow
          focus:border-accent-500 focus:ring-4 focus:ring-accent-100/30
          ${!selectedOption ? 'text-slate-500' : 'text-dark-800 border-dark-200'}
          ${isOpen ? 'border-accent-500 ring-4 ring-accent-100/30 rounded-b-none' : ''}
        `}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="
            absolute z-50 left-0 right-0 top-full mt-0
            max-h-60 overflow-auto
            bg-white border-2 border-t-0 border-accent-500/30 border-dark-200
            rounded-b-xl shadow-lg
            py-1
          "
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option)}
                className={`
                  flex items-center justify-between gap-2
                  px-4 py-3 cursor-pointer
                  text-sm md:text-base font-medium
                  transition-colors duration-150
                  ${isSelected ? 'bg-accent-50 text-accent-700' : 'text-dark-800 hover:bg-primary-50'}
                `}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0 text-accent-600" />}
              </li>
            );
          })}
        </ul>
      )}

    </div>
  );
}
