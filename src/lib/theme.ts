import { browser } from "$app/environment";
import { writable } from "svelte/store";

export type Theme = "dark" | "light";

const storageKey = "tech-bento-theme";

function currentTheme(): Theme {
  if (!browser) return "dark";

  try {
    return globalThis.localStorage?.getItem(storageKey) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export const theme = writable<Theme>(currentTheme());

export function setTheme(nextTheme: Theme): void {
  theme.set(nextTheme);

  if (!browser) return;

  document.documentElement.dataset.theme = nextTheme;

  try {
    globalThis.localStorage?.setItem(storageKey, nextTheme);
  } catch {
    // Theme switching should still work in browsers with storage disabled.
  }
}

export function initTheme(): void {
  setTheme(currentTheme());
}
