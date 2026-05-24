<script lang="ts">
  import { onMount } from "svelte";
  import { initTheme, setTheme, theme } from "$lib/theme";

  onMount(() => {
    initTheme();
  });

  function toggleTheme(): void {
    setTheme($theme === "dark" ? "light" : "dark");
  }
</script>

<button
  class="theme-toggle"
  type="button"
  aria-label={$theme === "dark" ? "切換為 light mode" : "切換為 dark mode"}
  aria-pressed={$theme === "dark"}
  title={$theme === "dark" ? "Light mode" : "Dark mode"}
  on:click={toggleTheme}
>
  <span class="track" aria-hidden="true">
    <span class="thumb">{$theme === "dark" ? "D" : "L"}</span>
  </span>
  <span>{$theme === "dark" ? "Dark" : "Light"}</span>
</button>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 0 13px;
    border: 1px solid var(--button-border);
    border-radius: 6px;
    background: var(--button-muted-bg);
    color: var(--text-strong);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .theme-toggle:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }

  .track {
    position: relative;
    width: 42px;
    height: 24px;
    border-radius: 999px;
    background: var(--toggle-track);
  }

  .thumb {
    position: absolute;
    top: 3px;
    left: var(--toggle-thumb-left);
    display: grid;
    width: 18px;
    height: 18px;
    place-items: center;
    border-radius: 50%;
    background: var(--toggle-thumb);
    color: var(--toggle-thumb-text);
    font-size: 0.68rem;
    line-height: 1;
    transition: left 160ms ease;
  }
</style>
