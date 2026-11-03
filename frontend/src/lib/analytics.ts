import { inject } from "@vercel/analytics";

// Page views come from Vercel Web Analytics (free, no cookies); it only reports once enabled in the Vercel project.
// Custom events (chat questions) also go to Plausible, or a self-hosted compatible script such as Umami, when
// VITE_PLAUSIBLE_DOMAIN is set. Local development sends nothing.
declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  }
}

export function initAnalytics() {
  inject();
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  if (!domain) return;
  const s = document.createElement("script");
  s.defer = true;
  s.dataset.domain = domain;
  s.src = (import.meta.env.VITE_PLAUSIBLE_SRC as string | undefined) ?? "https://plausible.io/js/script.js";
  document.head.appendChild(s);
  window.plausible ??= (...args) => {
    ((window.plausible as unknown as { q?: unknown[] }).q ??= []).push(args);
  };
}

export function track(event: string, props?: Record<string, string>) {
  window.plausible?.(event, props ? { props } : undefined);
}
