import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, useLanguage } from "@/i18n/LanguageProvider";

/**
 * Language picker. Lists languages by their native name so a Hindi speaker does
 * not have to read English to find Hindi.
 */
export const LanguageSwitcher = ({ compact = false }: { compact?: boolean }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Change language"
        className={`inline-flex items-center gap-1.5 h-9 rounded-[7px] text-muted-foreground hover:text-foreground hover:bg-surface transition-colors outline-none data-[state=open]:bg-surface ${
          compact ? "px-2" : "px-2.5"
        }`}
      >
        <Globe size={14} />
        <span className="font-['DM_Sans'] text-[12.5px]">{language.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] p-1.5 max-h-[320px] overflow-y-auto">
        <DropdownMenuLabel className="font-['DM_Sans'] text-[10.5px] tracking-[0.12em] uppercase text-muted-foreground px-2 py-1.5">
          Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => setLanguage(l.code)}
            className="flex items-center justify-between gap-3 font-['DM_Sans'] text-[13px] cursor-pointer"
          >
            <span>{l.label}</span>
            {l.code === language.code ? (
              <Check size={13} className="text-primary" />
            ) : (
              <span className="text-[11px] text-muted-foreground">{l.english}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
