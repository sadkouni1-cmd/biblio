import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Search, Library, X, Sun, Moon, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { AboutDialog } from "@/components/AboutDialog";
import { ThemePicker } from "@/components/ThemePicker";

export const Header = ({ onSearch, search }: { onSearch?: (v: string) => void; search?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  // On non-home pages we still show a search icon — clicking it sends the user
  // to the home library and auto-opens the search bar there.
  const hasInlineSearch = typeof onSearch === "function";
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  // When opening the mobile search, bring the results into view then focus the input.
  useEffect(() => {
    if (!searchOpen) return;

    document.getElementById("library")?.scrollIntoView({ block: "start" });
    const t = setTimeout(() => inputRef.current?.focus(), 50);

    return () => clearTimeout(t);
  }, [searchOpen]);

  // Close on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  // Auto-open / focus the search when the user lands on home with ?focusSearch=1
  // (used when clicking the search icon from non-home pages).
  useEffect(() => {
    if (!isHome || !hasInlineSearch) return;
    const params = new URLSearchParams(location.search);
    if (params.get("focusSearch") !== "1") return;

    setSearchOpen(true);
    const t = setTimeout(() => {
      // Desktop: focus the always-visible input
      const desktopInput = document.querySelector<HTMLInputElement>(
        'header input[placeholder="ابحث عن كتاب أو مؤلف..."]'
      );
      desktopInput?.focus();
    }, 80);

    // Clean the query param so refresh doesn't re-trigger
    const cleaned = location.pathname + location.hash;
    navigate(cleaned, { replace: true });
    return () => clearTimeout(t);
  }, [isHome, hasInlineSearch, location.search, location.pathname, location.hash, navigate]);


  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-6">
          {/* Logo + name on the far LEFT (order-last in RTL pushes to visual left) */}
          <Link to="/" className="order-last me-auto flex items-center gap-2 group min-w-0">
            <div className="rounded-md bg-gradient-gold p-1.5 sm:p-2 shadow-soft group-hover:scale-110 transition-smooth shrink-0">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="flex flex-col leading-[1.05] min-w-0 items-start" dir="ltr">
              <span className="font-display text-sm sm:text-xl font-semibold text-primary">Read</span>
              <span className="font-display text-sm sm:text-xl font-semibold text-primary">With</span>
              <span className="font-display text-sm sm:text-xl font-semibold text-primary">Bob</span>
            </div>
          </Link>

          {/* Search field — always visible, searches any book */}
          {hasInlineSearch && (
            <div className="relative flex-1 max-w-md min-w-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search ?? ""}
                onChange={(e) => onSearch!(e.target.value)}
                placeholder="ابحث عن أي كتاب..."
                inputMode="search"
                enterKeyHint="search"
                style={{ fontSize: "16px" }}
                className="pr-9 h-9 sm:h-10 bg-card/60 border-border/70"
              />
            </div>
          )}

          {/* Mobile search shortcut on non-home pages */}
          {!isHome && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => navigate("/?focusSearch=1")}
              aria-label="بحث"
              title="بحث"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Icons cluster on the far RIGHT (start of RTL flex) */}
          {(() => {
            const isDark = theme === "dark";
            const Icon = isDark ? Sun : Moon;
            const label = isDark ? "وضع نهاري" : "وضع ليلي";
            return (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (isDark ? setTheme("light") : setTheme("dark"))}
                className="h-9 w-9 shrink-0"
                aria-label={label}
                title={label}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })()}

          <ThemePicker />

          <AboutDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label="حول التطبيق"
                title="حول التطبيق"
              >
                <Info className="h-5 w-5" />
              </Button>
            }
          />

          <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3 shrink-0">
            <Link to="/my-books" className="flex items-center gap-1.5 sm:gap-2">
              <Library className="h-4 w-4" />
              <span className="font-display text-sm sm:text-base hidden sm:inline">كتبي</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Mobile search bar — sits under the header, never covers the results */}
      {onSearch && searchOpen && (
        <div
          className="md:hidden sticky top-14 z-30 w-full border-b border-border/60 bg-background/95 backdrop-blur-md animate-fade-in"
          role="search"
        >
          <div className="container flex items-center gap-2 px-3 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                value={search ?? ""}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="ابحث عن كتاب أو مؤلف..."
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                style={{ fontSize: "16px" }}
                className="w-full h-10 rounded-md border border-border/70 bg-card pl-9 pr-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => {
                setSearchOpen(false);
                onSearch("");
              }}
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
