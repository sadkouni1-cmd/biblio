import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Search, Library, X, Sun, Moon, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { AboutDialog } from "@/components/AboutDialog";
import { ThemePicker } from "@/components/ThemePicker";

export const Header = ({ onSearch, search }: { onSearch?: (v: string) => void; search?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const hasInlineSearch = typeof onSearch === "function";
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  // Auto-focus the search bar when arriving from another page via the search shortcut.
  useEffect(() => {
    if (!isHome || !hasInlineSearch) return;
    const params = new URLSearchParams(location.search);
    if (params.get("focusSearch") !== "1") return;

    const t = setTimeout(() => inputRef.current?.focus(), 80);
    const cleaned = location.pathname + location.hash;
    navigate(cleaned, { replace: true });
    return () => clearTimeout(t);
  }, [isHome, hasInlineSearch, location.search, location.pathname, location.hash, navigate]);

  const isDark = theme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;
  const themeLabel = isDark ? "وضع نهاري" : "وضع ليلي";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 sm:h-[72px] items-center gap-2 sm:gap-4 px-3 sm:px-6">
        {/* ── LEFT: Logo + stacked name ───────────────────────────── */}
        <Link
          to="/"
          className="order-last me-auto flex items-center gap-2 sm:gap-3 group min-w-0 shrink-0"
          aria-label="Read With Bob — الصفحة الرئيسية"
        >
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-gold blur-md opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden />
            <div className="relative rounded-2xl bg-gradient-gold p-2 sm:p-2.5 shadow-soft ring-1 ring-primary/20 group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-300">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </div>
          <div className="hidden xs:flex sm:flex flex-col leading-[1] min-w-0" dir="ltr">
            <span className="font-display text-[11px] sm:text-sm font-semibold text-primary tracking-wide">Read</span>
            <span className="font-display text-[11px] sm:text-sm font-semibold text-primary tracking-wide my-0.5">With</span>
            <span className="font-display text-[11px] sm:text-sm font-semibold text-accent tracking-wide">Bob</span>
          </div>
        </Link>

        {/* ── CENTER: Search pill (always visible on home; shortcut elsewhere) ── */}
        {hasInlineSearch ? (
          <div className="relative flex-1 min-w-0 max-w-xl">
            <div
              className={[
                "group/search relative flex items-center h-10 sm:h-11 rounded-full",
                "bg-card/70 backdrop-blur-sm border transition-all duration-300",
                focused
                  ? "border-primary/60 shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
                  : "border-border/60 hover:border-border",
              ].join(" ")}
            >
              <Search
                className={[
                  "absolute right-3 sm:right-4 h-4 w-4 sm:h-[18px] sm:w-[18px] transition-colors pointer-events-none",
                  focused ? "text-primary" : "text-muted-foreground",
                ].join(" ")}
              />
              <input
                ref={inputRef}
                value={search ?? ""}
                onChange={(e) => onSearch!(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="ابحث عن أي كتاب أو مؤلف…"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                style={{ fontSize: "16px" }}
                className="w-full h-full bg-transparent rounded-full pr-10 sm:pr-12 pl-10 sm:pl-12 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/80 outline-none"
              />
              {search && search.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onSearch!("");
                    inputRef.current?.focus();
                  }}
                  className="absolute left-2 sm:left-2.5 h-7 w-7 sm:h-8 sm:w-8 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="مسح"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {!search && (
                <Sparkles className="hidden sm:block absolute left-4 h-4 w-4 text-accent/70 animate-pulse" aria-hidden />
              )}
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => navigate("/?focusSearch=1")}
            aria-label="بحث"
            title="بحث"
          >
            <Search className="h-5 w-5" />
          </Button>
        )}

        {/* ── RIGHT: Icon cluster in a connected pill ───────────────── */}
        <div className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-card/60 border border-border/50 p-1 backdrop-blur-sm shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (isDark ? setTheme("light") : setTheme("dark"))}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-secondary"
            aria-label={themeLabel}
            title={themeLabel}
          >
            <ThemeIcon className="h-[18px] w-[18px] transition-transform duration-300 hover:rotate-45" />
          </Button>

          <ThemePicker />

          <AboutDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-secondary"
                aria-label="حول التطبيق"
                title="حول التطبيق"
              >
                <Info className="h-[18px] w-[18px]" />
              </Button>
            }
          />
        </div>

        {/* My Books — promoted as primary action */}
        <Button
          asChild
          size="sm"
          className="h-9 sm:h-10 rounded-full bg-gradient-gold text-primary hover:opacity-90 shadow-soft px-3 sm:px-4 shrink-0 ring-1 ring-primary/20"
        >
          <Link to="/my-books" className="flex items-center gap-1.5 sm:gap-2">
            <Library className="h-4 w-4" />
            <span className="font-display text-sm hidden sm:inline">كتبي</span>
          </Link>
        </Button>
      </div>
    </header>
  );
};
