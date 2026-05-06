import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, AArrowDown, AArrowUp, Type, Settings2, Palette, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { getProgress, saveProgress } from "@/lib/library-storage";
import { TranslatePopover } from "@/components/TranslatePopover";
import { cn } from "@/lib/utils";

type FontSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type ReaderTheme = "paper" | "sepia" | "cream" | "night" | "gray";
type Margin = "narrow" | "normal" | "wide";

const FONT_KEY = "rwb-reader-font-size";
const THEME_KEY = "rwb-reader-theme";
const MARGIN_KEY = "rwb-reader-margin";

const FONT_ORDER: FontSize[] = ["xs", "sm", "md", "lg", "xl", "2xl"];
const FONT_LABEL: Record<FontSize, string> = {
  xs: "صغير جدًا", sm: "صغير", md: "متوسط", lg: "كبير", xl: "كبير جدًا", "2xl": "ضخم",
};
const FONT_CLASS: Record<FontSize, string> = {
  xs: "text-[11px] sm:text-xs leading-relaxed",
  sm: "text-[13px] sm:text-sm leading-relaxed",
  md: "text-[15px] sm:text-base leading-relaxed",
  lg: "text-[17px] sm:text-lg leading-loose",
  xl: "text-[19px] sm:text-xl leading-loose",
  "2xl": "text-[22px] sm:text-2xl leading-loose",
};

const MARGIN_CLASS: Record<Margin, string> = {
  narrow: "p-3 sm:p-5",
  normal: "p-5 sm:p-8 md:p-12",
  wide: "p-7 sm:p-12 md:p-20",
};
const MARGIN_LABEL: Record<Margin, string> = { narrow: "ضيقة", normal: "متوسطة", wide: "واسعة" };

const THEMES: { id: ReaderTheme; label: string; bg: string; fg: string; swatch: string }[] = [
  { id: "paper", label: "ورقي", bg: "bg-card", fg: "text-card-foreground", swatch: "bg-[hsl(38,40%,97%)]" },
  { id: "sepia", label: "سيبيا", bg: "bg-[hsl(36,45%,86%)]", fg: "text-[hsl(28,38%,18%)]", swatch: "bg-[hsl(36,45%,86%)]" },
  { id: "cream", label: "كريمي", bg: "bg-[hsl(45,55%,93%)]", fg: "text-[hsl(30,30%,18%)]", swatch: "bg-[hsl(45,55%,93%)]" },
  { id: "night", label: "ليلي", bg: "bg-[hsl(220,20%,10%)]", fg: "text-[hsl(40,30%,88%)]", swatch: "bg-[hsl(220,20%,10%)]" },
  { id: "gray", label: "رمادي", bg: "bg-[hsl(220,8%,18%)]", fg: "text-[hsl(0,0%,92%)]", swatch: "bg-[hsl(220,8%,18%)]" },
];

const loadFont = (): FontSize => {
  if (typeof window === "undefined") return "md";
  const v = localStorage.getItem(FONT_KEY) as FontSize | null;
  return v && FONT_ORDER.includes(v) ? v : "md";
};
const loadTheme = (): ReaderTheme => {
  if (typeof window === "undefined") return "paper";
  const v = localStorage.getItem(THEME_KEY) as ReaderTheme | null;
  return v && THEMES.some((t) => t.id === v) ? v : "paper";
};
const loadMargin = (): Margin => {
  if (typeof window === "undefined") return "normal";
  const v = localStorage.getItem(MARGIN_KEY) as Margin | null;
  return v && ["narrow", "normal", "wide"].includes(v) ? v : "normal";
};

export const BookReader = ({
  pages,
  isRTL,
  bookId,
  language,
}: {
  pages: string[];
  isRTL: boolean;
  bookId?: string;
  language?: string;
}) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const translateLang = language && language !== "ar" ? language : null;
  const pagesPerSpread = isMobile ? 1 : 2;
  const totalSpreads = Math.max(1, Math.ceil(pages.length / pagesPerSpread));

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toolsVisible, setToolsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setToolsVisible(false), 2800);
  }, []);

  const showTools = useCallback(() => {
    setToolsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    scheduleHide();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [scheduleHide]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // fallback: just toggle local state
      setIsFullscreen((v) => !v);
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
    } catch {}
    setIsFullscreen(false);
  }, []);

  // Double-tap anywhere to exit fullscreen (mobile-friendly)
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback(() => {
    if (!isFullscreen) return;
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      exitFullscreen();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [isFullscreen, exitFullscreen]);

  // Android hardware back button → exit fullscreen first instead of leaving page
  useEffect(() => {
    if (!isFullscreen) return;
    window.history.pushState({ rwbFullscreen: true }, "");
    const onPop = () => { exitFullscreen(); };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (window.history.state?.rwbFullscreen) {
        try { window.history.back(); } catch {}
      }
    };
  }, [isFullscreen, exitFullscreen]);


  const [spread, setSpread] = useState(() => {
    if (!bookId) return 0;
    const saved = getProgress(bookId);
    if (!saved) return 0;
    const savedPageIndex = saved.spread * 2;
    return Math.min(Math.floor(savedPageIndex / (isMobile ? 1 : 2)), totalSpreads - 1);
  });

  const [fontSize, setFontSize] = useState<FontSize>(loadFont);
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(loadTheme);
  const [margin, setMargin] = useState<Margin>(loadMargin);
  const [flip, setFlip] = useState<"next" | "prev" | null>(null);

  useEffect(() => { try { localStorage.setItem(FONT_KEY, fontSize); } catch {} }, [fontSize]);
  useEffect(() => { try { localStorage.setItem(THEME_KEY, readerTheme); } catch {} }, [readerTheme]);
  useEffect(() => { try { localStorage.setItem(MARGIN_KEY, margin); } catch {} }, [margin]);

  useEffect(() => { setSpread((s) => Math.min(s, totalSpreads - 1)); }, [totalSpreads]);

  useEffect(() => {
    if (!bookId) return;
    const pageIndex = spread * pagesPerSpread;
    const normalizedSpread = Math.floor(pageIndex / 2);
    const normalizedTotal = Math.max(1, Math.ceil(pages.length / 2));
    saveProgress(bookId, normalizedSpread, normalizedTotal);
  }, [bookId, spread, pagesPerSpread, pages.length]);

  const go = (dir: "next" | "prev") => {
    setSpread((s) => {
      const next = dir === "next" ? Math.min(s + 1, totalSpreads - 1) : Math.max(s - 1, 0);
      if (next !== s) {
        setFlip(dir);
        window.setTimeout(() => setFlip(null), 450);
      }
      return next;
    });
  };

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(isRTL ? "next" : "prev");
      else if (e.key === "ArrowLeft") go(isRTL ? "prev" : "next");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRTL, totalSpreads]);

  const adjustFont = (dir: "inc" | "dec") => {
    setFontSize((cur) => {
      const idx = FONT_ORDER.indexOf(cur);
      return dir === "inc"
        ? FONT_ORDER[Math.min(idx + 1, FONT_ORDER.length - 1)]
        : FONT_ORDER[Math.max(idx - 1, 0)];
    });
  };

  const left = pages[spread * pagesPerSpread];
  const right = !isMobile ? pages[spread * pagesPerSpread + 1] : undefined;
  const themeDef = THEMES.find((t) => t.id === readerTheme)!;

  const Page = ({ text, pageNumber }: { text?: string; pageNumber: number }) => (
    <div className={cn("relative flex-1 paper-texture page-shadow overflow-hidden transition-colors duration-300", themeDef.bg, MARGIN_CLASS[margin])}>
      <div
        className={cn(
          "h-full w-full overflow-y-auto whitespace-pre-line pb-8 transition-all duration-300",
          isRTL ? "text-right font-arabic" : "text-left",
          themeDef.fg,
          FONT_CLASS[fontSize],
        )}
      >
        {text}
      </div>
      <div className={cn("absolute bottom-2 left-0 right-0 text-center text-[10px] sm:text-xs opacity-60", themeDef.fg)}>
        {pageNumber}
      </div>
    </div>
  );

  const fontIdx = FONT_ORDER.indexOf(fontSize);

  return (
    <div
      ref={containerRef}
      onMouseMove={showTools}
      onTouchStart={showTools}
      className={cn(
        "flex flex-col items-center gap-4 sm:gap-6 transition-colors",
        isFullscreen && "fixed inset-0 z-50 bg-background p-2 sm:p-4 overflow-auto justify-center",
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center bg-card/90 backdrop-blur border border-border/60 rounded-full px-2 py-1 shadow-soft transition-all duration-300",
          isFullscreen && "fixed top-3 left-1/2 -translate-x-1/2 z-[60]",
          toolsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <Type className="h-4 w-4 text-muted-foreground mx-1 hidden sm:inline-block" />
        <Button variant="ghost" size="icon" onClick={() => adjustFont("dec")} disabled={fontIdx === 0} className="h-8 w-8 rounded-full" aria-label="تصغير الخط">
          <AArrowDown className="h-4 w-4" />
        </Button>
        <span className="text-xs sm:text-sm text-muted-foreground tabular-nums min-w-[3.5rem] sm:min-w-[4rem] text-center font-display">
          {FONT_LABEL[fontSize]}
        </span>
        <Button variant="ghost" size="icon" onClick={() => adjustFont("inc")} disabled={fontIdx === FONT_ORDER.length - 1} className="h-8 w-8 rounded-full" aria-label="تكبير الخط">
          <AArrowUp className="h-4 w-4" />
        </Button>

        <span className="w-px h-5 bg-border mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="لون الصفحة" title="لون الصفحة">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="end">
            <p className="text-xs font-display text-muted-foreground mb-2">لون الصفحة</p>
            <div className="grid grid-cols-5 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setReaderTheme(t.id)}
                  className={cn(
                    "h-9 w-9 rounded-full border-2 transition-transform hover:scale-110",
                    t.swatch,
                    readerTheme === t.id ? "border-primary ring-2 ring-primary/30" : "border-border/60",
                  )}
                  title={t.label}
                  aria-label={t.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="الهوامش" title="الهوامش">
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2" align="end">
            <p className="text-xs font-display text-muted-foreground mb-2 px-1">الهوامش</p>
            <div className="flex flex-col gap-1">
              {(["narrow", "normal", "wide"] as Margin[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMargin(m)}
                  className={cn(
                    "text-sm text-right px-3 py-1.5 rounded-md transition-colors",
                    margin === m ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                  )}
                >
                  {MARGIN_LABEL[m]}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <span className="w-px h-5 bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="h-8 w-8 rounded-full"
          aria-label={isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
          title={isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      <div
        ref={spreadRef}
        onClick={showTools}
        className={cn(
          "relative w-full max-w-5xl",
          isFullscreen
            ? "h-[100dvh] sm:h-[calc(100dvh-2rem)]"
            : "h-[calc(100vh-13rem)] sm:h-auto sm:aspect-[16/10]",
        )}
        dir="ltr"
      >
        <div
          key={spread}
          className={cn(
            "absolute inset-0 flex shadow-book rounded-lg overflow-hidden bg-gradient-page",
            flip === "next" && "animate-flip-next",
            flip === "prev" && "animate-flip-prev",
          )}
        >
          <Page text={left} pageNumber={spread * pagesPerSpread + 1} />
          {!isMobile && (
            <>
              <div className="w-px bg-border/40" />
              <Page text={right} pageNumber={spread * pagesPerSpread + 2} />
              <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-4 sm:w-6 bg-gradient-to-r from-foreground/15 via-foreground/30 to-foreground/15 pointer-events-none" />
            </>
          )}
        </div>

        {/* Mobile tap zones for paging */}
        {isMobile && (
          <>
            <button
              type="button"
              aria-label="الصفحة السابقة"
              onClick={(e) => { e.stopPropagation(); go(isRTL ? "next" : "prev"); }}
              className="absolute inset-y-0 left-0 w-1/3 bg-transparent"
            />
            <button
              type="button"
              aria-label="الصفحة التالية"
              onClick={(e) => { e.stopPropagation(); go(isRTL ? "prev" : "next"); }}
              className="absolute inset-y-0 right-0 w-1/3 bg-transparent"
            />
          </>
        )}

        {translateLang && <TranslatePopover sourceLang={translateLang} containerRef={spreadRef} />}
      </div>

      {translateLang && !isFullscreen && (
        <p className="text-[11px] sm:text-xs text-muted-foreground text-center -mt-2">
          💡 انقر على أي كلمة لترجمتها فورًا، أو حدّد جملة لترجمتها كاملة
        </p>
      )}

      <div
        className={cn(
          "flex items-center gap-3 sm:gap-6 w-full justify-center transition-all duration-300",
          isFullscreen && "fixed bottom-3 left-1/2 -translate-x-1/2 w-auto bg-card/90 backdrop-blur border border-border/60 rounded-full px-4 py-1.5 shadow-soft z-[60]",
          isFullscreen && (toolsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"),
        )}
      >
        <Button variant="outline" size="icon" onClick={() => go("prev")} disabled={spread === 0} className="rounded-full h-10 w-10 sm:h-12 sm:w-12" aria-label="السابق">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-display text-base sm:text-lg text-muted-foreground tabular-nums">
          {spread + 1} / {totalSpreads}
        </span>
        <Button variant="outline" size="icon" onClick={() => go("next")} disabled={spread + 1 >= totalSpreads} className="rounded-full h-10 w-10 sm:h-12 sm:w-12" aria-label="التالي">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
