import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Handles the Android hardware back button inside a Capacitor native shell.
 * - On any non-home route → navigate back in history (or to "/" as fallback).
 * - On the home route → exit the app.
 *
 * In a regular browser/PWA Capacitor isn't present so this is a no-op.
 */
export function useAndroidBack() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only attempt when running inside a Capacitor native shell.
    const cap = (window as any)?.Capacitor;
    if (!cap?.isNativePlatform?.()) return;

    let removeListener: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const moduleName = "@capacitor/app";
        const mod: any = await import(/* @vite-ignore */ moduleName).catch(() => null);
        if (cancelled || !mod?.App) return;

        const sub = await mod.App.addListener("backButton", () => {
          const isHome = location.pathname === "/";
          if (!isHome) {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/", { replace: true });
            }
          } else {
            mod.App.exitApp?.();
          }
        });
        removeListener = () => sub.remove?.();
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [location.pathname, navigate]);
}
