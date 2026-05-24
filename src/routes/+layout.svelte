<slot />

<style>
  :global(:root) {
    color-scheme: dark;
    --bg: #101418;
    --surface: #171d22;
    --surface-hover: #1d252c;
    --border: #303942;
    --text: #d8e0e8;
    --text-strong: #f4f7fb;
    --muted: #9ba8b4;
    --accent: #58c7b1;
    --accent-soft: #173832;
    --accent-strong: #8ce4d4;
    --button-bg: #f4f7fb;
    --button-text: #101418;
    --button-border: #f4f7fb;
    --button-muted-bg: transparent;
    --focus: #58c7b1;
    --toggle-track: #303942;
    --toggle-thumb: #f4f7fb;
    --toggle-thumb-text: #101418;
    --toggle-thumb-left: 21px;
  }

  :global(:root[data-theme="light"]) {
    color-scheme: light;
    --bg: #f7f8fa;
    --surface: #ffffff;
    --surface-hover: #f1f5f9;
    --border: #d9dee6;
    --text: #334155;
    --text-strong: #111827;
    --muted: #536471;
    --accent: #006d77;
    --accent-soft: #e8f3f1;
    --accent-strong: #006d77;
    --button-bg: #1f2933;
    --button-text: #ffffff;
    --button-border: #1f2933;
    --button-muted-bg: transparent;
    --focus: #006d77;
    --toggle-track: #d9dee6;
    --toggle-thumb: #1f2933;
    --toggle-thumb-text: #ffffff;
    --toggle-thumb-left: 3px;
  }

  :global(body) {
    margin: 0;
    color: var(--text);
    background: var(--bg);
    font-family:
      Inter, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif;
    transition:
      background 160ms ease,
      color 160ms ease;
  }

  :global(a) {
    color: inherit;
  }
</style>
