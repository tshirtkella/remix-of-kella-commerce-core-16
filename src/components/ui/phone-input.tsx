import * as React from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type Country = {
  code: string;
  name: string;
  dial: string;
  flag: string;
};

export const COUNTRIES: Country[] = [
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  country?: Country;
  onCountryChange?: (country: Country) => void;
  label?: string;
  error?: string;
  helperTooltip?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  country,
  onCountryChange,
  label = "Phone",
  error,
  helperTooltip = "In case we need to contact you about your order",
  name = "phone",
  id,
  placeholder = " ",
  className,
}) => {
  const [internalCountry, setInternalCountry] = React.useState<Country>(COUNTRIES[0]);
  const selected = country ?? internalCountry;

  const handleSelect = (c: Country) => {
    if (onCountryChange) onCountryChange(c);
    else setInternalCountry(c);
  };

  const inputId = id || name;
  const hasValue = value && value.length > 0;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "group relative flex items-stretch rounded-lg border bg-background transition-all",
          "focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
          error ? "border-destructive ring-1 ring-destructive" : "border-input"
        )}
      >
        <div className="relative flex-1 min-w-0">
          <input
            id={inputId}
            name={name}
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "peer w-full h-14 bg-transparent px-3 pt-5 pb-1.5 text-sm outline-none",
              "placeholder:text-transparent"
            )}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute left-3 text-muted-foreground transition-all",
              hasValue
                ? "top-1.5 text-[11px]"
                : "top-1/2 -translate-y-1/2 text-sm peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px]"
            )}
          >
            {label}
          </label>
        </div>

        {helperTooltip && (
          <div className="flex items-center pr-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1.5 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground transition"
                    aria-label="Phone help"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[220px]">{helperTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 pr-3 pl-1 text-sm hover:bg-muted/40 rounded-r-lg transition"
              aria-label={`Select country, currently ${selected.name}`}
            >
              <span className="text-xl leading-none" aria-hidden="true">{selected.flag}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto w-64 z-50 bg-popover">
            {COUNTRIES.map((c) => (
              <DropdownMenuItem
                key={c.code}
                onClick={() => handleSelect(c)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className="text-lg" aria-hidden="true">{c.flag}</span>
                <span className="flex-1 text-sm">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.dial}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};
