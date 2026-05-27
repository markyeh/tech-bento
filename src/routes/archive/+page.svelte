<script lang="ts">
  import { base } from "$app/paths";
  import { onMount } from "svelte";
  import ThemeToggle from "$lib/ThemeToggle.svelte";

  type ArchiveEntry = {
    date: string;
    generatedAt: string;
    path: string;
    count: number;
  };

  let archive: ArchiveEntry[] = [];
  let error = "";
  let expandedDate: string | null = null;
  let htmlContent: Record<string, string> = {};
  let loading: Record<string, boolean> = {};

  onMount(async () => {
    try {
      const res = await fetch(`${base}/data/archive.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      archive = await res.json();
    } catch {
      error = "目前無法載入封存資料。";
    }
  });

  function formatDate(value: string): string {
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(`${value}T00:00:00+08:00`));
  }

  async function toggleExpand(date: string): Promise<void> {
    if (expandedDate === date) {
      expandedDate = null;
      return;
    }

    expandedDate = date;

    if (htmlContent[date]) {
      return;
    }

    loading[date] = true;
    try {
      const res = await fetch(`${base}/data/${date}.html`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      htmlContent[date] = await res.text();
    } catch (err) {
      console.error(err);
      htmlContent[date] = "<p>無法載入此日期的內容</p>";
    } finally {
      loading[date] = false;
    }
  }
</script>

<svelte:head>
  <title>Archive | tech-bento</title>
</svelte:head>

<main class="site-shell">
  <header class="masthead">
    <div>
      <p class="kicker">Archive</p>
      <h1>tech-bento</h1>
    </div>
    <nav class="header-actions" aria-label="頁面操作">
      <ThemeToggle />
      <a class="home-link" href={`${base}/`}>Today</a>
    </nav>
  </header>

  {#if archive.length}
    <section class="archive-list" aria-label="每日封存">
      {#each archive as entry (entry.date)}
        <div class="archive-item">
          <button
            class="archive-button"
            on:click={() => toggleExpand(entry.date)}
            aria-expanded={expandedDate === entry.date}
            aria-controls={`content-${entry.date}`}
          >
            <span>{formatDate(entry.date)}</span>
            <span>{entry.count} 則新聞</span>
            <span class="toggle-icon">{expandedDate === entry.date ? "▼" : "▶"}</span>
          </button>

          {#if expandedDate === entry.date}
            <div id={`content-${entry.date}`} class="archive-content">
              {#if loading[entry.date]}
                <div class="loading">載入中...</div>
              {:else if htmlContent[entry.date]}
                <iframe
                  srcDoc={htmlContent[entry.date]}
                  title={`${formatDate(entry.date)} 的新聞內容`}
                  class="content-frame"
                ></iframe>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </section>
  {:else if error}
    <p class="status">{error}</p>
  {:else}
    <p class="status">載入中...</p>
  {/if}
</main>

<style>
  .site-shell {
    width: min(920px, calc(100% - 32px));
    margin: 0 auto;
    padding: 48px 0 64px;
  }

  .masthead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .kicker {
    margin: 0 0 8px;
    color: var(--muted);
    font-size: 0.95rem;
  }

  h1 {
    margin: 0;
    color: var(--text-strong);
    font-size: clamp(2.2rem, 7vw, 4.2rem);
    line-height: 0.95;
    letter-spacing: 0;
  }

  .home-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 16px;
    border: 1px solid var(--button-border);
    border-radius: 6px;
    background: var(--button-muted-bg);
    color: var(--text-strong);
    font-weight: 700;
    text-decoration: none;
  }

  .archive-list {
    display: grid;
    gap: 10px;
    margin-top: 28px;
  }

  .archive-item {
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    overflow: hidden;
  }

  .archive-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 16px 18px;
    border: none;
    background: transparent;
    color: var(--text-strong);
    font-weight: 700;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s ease;
  }

  .archive-button:hover {
    background-color: var(--button-muted-bg);
  }

  .toggle-icon {
    display: inline-block;
    font-size: 0.8rem;
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .archive-content {
    border-top: 1px solid var(--border);
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 2000px;
    }
  }

  .loading {
    padding: 40px 18px;
    text-align: center;
    color: var(--muted);
  }

  .content-frame {
    width: 100%;
    min-height: 600px;
    border: none;
    display: block;
  }

  .status {
    margin-top: 32px;
    color: var(--muted);
  }

  @media (max-width: 560px) {
    .site-shell {
      width: min(100% - 24px, 920px);
      padding-top: 28px;
    }

    .masthead {
      display: grid;
    }

    .header-actions {
      flex-wrap: wrap;
    }

    .home-link {
      width: fit-content;
    }

    .archive-button {
      flex-wrap: wrap;
    }

    .content-frame {
      min-height: 800px;
    }
  }
</style>
