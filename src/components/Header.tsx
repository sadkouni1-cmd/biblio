import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Search, Library, X, Sun, Moon, Info } from "lucide-react";
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchWrapRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isHome || !hasInlineSearch) return;
    const params = new URLSearchParams(location.search);
    if (params.get("focusSearch") !== "1") return;
    const t = setTimeout(() => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setDesktopSearchOpen(true);
      } else {
        setMobileSearchOpen(true);
      }
    }, 80);
    const cleaned = location.pathname + location.hash;
    navigate(cleaned, { replace: true });
    return () => clearTimeout(t);
  }, [isHome, hasInlineSearch, location.search, location.pathname, location.hash, navigate]);

  useEffect(() => {
    if (mobileSearchOpen) setTimeout(() => mobileInputRef.current?.focus(), 50);
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (desktopSearchOpen) setTimeout(() => inputRef.current?.focus(), 60);
  }, [desktopSearchOpen]);

  // Close desktop search on outside click / Escape
  useEffect(() => {
    if (!desktopSearchOpen) return;
    const onPointer = (e: PointerEvent) => {
      const el = desktopSearchWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setDesktopSearchOpen(false);
        setFocused(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDesktopSearchOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [desktopSearchOpen]);

  // Close mobile search on outside click / Escape
  useEffect(() => {
    if (!mobileSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileSearchOpen]);

  const isDark = theme === "dark";
  const ThemeIcon = isDark ? Sun : Moon;
  const themeLabel = isDark ? "وضع نهاري" : "وضع ليلي";

  const SearchPill = ({ inputRef: ref, autoFocus }: { inputRef: React.RefObject<HTMLInputElement>; autoFocus?: boolean }) => (
    <div
      className={[
        "relative flex items-center h-10 w-full rounded-full",
        "bg-card/80 backdrop-blur-sm border transition-all duration-300",
        focused
          ? "border-primary/60 shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
          : "border-border/60 hover:border-border",
      ].join(" ")}
    >
      <Search
        className={[
          "absolute right-3 h-[18px] w-[18px] transition-colors pointer-events-none",
          focused ? "text-primary" : "text-muted-foreground",
        ].join(" ")}
      />
      <input
        ref={ref}
        value={search ?? ""}
        onChange={(e) => onSearch!(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="ابحث عن أي كتاب أو مؤلف…"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        style={{ fontSize: "16px" }}
        className="w-full h-full bg-transparent rounded-full pr-10 pl-10 text-sm text-foreground placeholder:text-muted-foreground/80 outline-none"
      />
      {search && search.length > 0 && (
        <button
          type="button"
          onClick={() => {
            onSearch!("");
            ref.current?.focus();
          }}
          className="absolute left-2 h-7 w-7 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="مسح"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 sm:h-[72px] items-center gap-3 px-3 sm:px-6">
        {/* FAR RIGHT (RTL start): Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink-0"
          aria-label="Read With Bob — الصفحة الرئيسية"
        >
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-gold blur-md opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden />
            <div className="relative rounded-2xl bg-gradient-gold p-2 sm:p-2.5 shadow-soft ring-1 ring-primary/20 group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-300">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </div>
          <div className="flex flex-col leading-[1] min-w-0" dir="ltr">
            <span className="font-display text-[11px] sm:text-sm font-semibold text-primary tracking-wide">Read</span>
            <span className="font-display text-[11px] sm:text-sm font-semibold text-primary tracking-wide my-0.5">With</span>
            <span className="font-display text-[11px] sm:text-sm font-semibold text-accent tracking-wide">Bob</span>
          </div>
        </Link>

        {/* CENTER: Unified action bar */}
        <nav
          className="mx-auto flex items-center gap-1 rounded-full bg-card/70 border border-border/50 p-1 backdrop-blur-sm shrink-0 shadow-soft"
          aria-label="إجراءات سريعة"
        >

          {/* Search trigger (mobile + desktop) */}
          {hasInlineSearch ? (
            <Button
              variant="ghost"
              size="icon"
              className={[
                "h-9 w-9 rounded-full hover:bg-secondary transition-colors",
                desktopSearchOpen || mobileSearchOpen ? "bg-secondary text-primary" : "",
              ].join(" ")}
              onClick={() => {
                if (window.matchMedia("(min-width: 768px)").matches) {
                  setDesktopSearchOpen((v) => !v);
                } else {
                  setMobileSearchOpen((v) => !v);
                }
              }}
              aria-label="بحث"
              aria-expanded={desktopSearchOpen || mobileSearchOpen}
              title="بحث"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-secondary"
              onClick={() => navigate("/?focusSearch=1")}
              aria-label="بحث"
              title="بحث"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>
          )}

          <span className="h-5 w-px bg-border/60" aria-hidden />


          <Button
            variant="ghost"
            size="icon"
            onClick={() => (isDark ? setTheme("light") : setTheme("dark"))}
            className="h-9 w-9 rounded-full hover:bg-secondary"
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
                className="h-9 w-9 rounded-full hover:bg-secondary"
                aria-label="حول التطبيق"
                title="حول التطبيق"
              >
                <Info className="h-[18px] w-[18px]" />
              </Button>
            }
          />

          <span className="h-5 w-px bg-border/60" aria-hidden />

          {/* My Books — primary CTA inside the bar */}
          <Button
            asChild
            size="sm"
            className="h-9 rounded-full bg-gradient-gold text-primary hover:opacity-90 px-3 sm:px-4 ring-1 ring-primary/20"
          >
            <Link to="/my-books" className="flex items-center gap-1.5">
              <Library className="h-4 w-4" />
              <span className="font-display text-sm hidden sm:inline">كتبي</span>
            </Link>
          </Button>
        </nav>

        {/* FAR LEFT (RTL end): Search (desktop only when home) */}
        {hasInlineSearch && (
          <div className="hidden md:block w-64 lg:w-80 shrink-0">
            <SearchPill inputRef={inputRef} />
          </div>
        )}
      </div>


      {/* Mobile search drawer — slides down under header */}
      {hasInlineSearch && (
        <div
          className={[
            "md:hidden overflow-hidden border-t border-border/50 transition-[max-height,opacity] duration-300 ease-out",
            mobileSearchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          <div className="container px-3 py-2">
            <SearchPill inputRef={mobileInputRef} autoFocus />
          </div>
        </div>
      )}
    </header>
  );
};
