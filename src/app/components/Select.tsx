import { useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  labelClassName?: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  onQueryChange?: (query: string) => void;
  valueLabel?: string;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
}

export function Select({
  value,
  options,
  onChange,
  onQueryChange,
  valueLabel,
  placeholder = "選択してください",
  searchable = false,
  className,
  inputClassName,
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const resolvedValueLabel = valueLabel ?? selectedOption?.label ?? "";

  const filtered =
    searchable && !onQueryChange && query.trim()
      ? options.filter((o) =>
          o.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
        )
      : options;

  const displayValue = open && searchable ? query : resolvedValueLabel;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onQueryChange?.(e.target.value);
    setOpen(true);
  };

  const handleInputFocus = () => {
    setOpen(true);
    if (!searchable) return;
    setQuery("");
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setOpen(false);
      setQuery("");
      onQueryChange?.("");
    }, 150);
  };

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery("");
    onQueryChange?.("");
  };

  const handleToggle = () => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  };

  return (
    <div className={`relative ${className ?? ""}`} ref={containerRef}>
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          readOnly={!searchable}
          value={displayValue}
          placeholder={placeholder}
          onChange={searchable ? handleInputChange : undefined}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={`w-full cursor-pointer pr-7 ${inputClassName ?? ""}`}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            handleToggle();
          }}
          className="absolute right-0 inset-y-0 flex items-center px-2 bg-transparent border-none text-white/50 hover:text-white/80"
          aria-label="選択肢を開く"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 12 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M1 1l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-0.5 bg-gray-900 border border-white/20 rounded-md max-h-[200px] overflow-y-auto z-10 shadow-lg">
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(option);
              }}
              className={`block w-full py-2 px-3 text-left bg-transparent border-none cursor-pointer hover:bg-white/10 ${
                option.value === value ? "text-sky-300" : "text-inherit"
              } ${option.labelClassName ?? ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {open && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-0.5 bg-gray-900 border border-white/20 rounded-md z-10 shadow-lg">
          <p className="py-2 px-3 text-sm text-white/40">候補がありません</p>
        </div>
      )}
    </div>
  );
}
