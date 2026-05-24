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
      {#each archive as entry}
        <a class="archive-item" href={`${base}${entry.path}`}>
          <span>{formatDate(entry.date)}</span>
          <span>{entry.count} 則新聞</span>
        </a>
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
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text-strong);
    font-weight: 700;
    text-decoration: none;
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
  }
</style>
