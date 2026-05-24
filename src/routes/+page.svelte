<script lang="ts">
  import { base } from "$app/paths";
  import { onMount } from "svelte";
  import ThemeToggle from "$lib/ThemeToggle.svelte";

  type NewsItem = {
    rank: number;
    source: string;
    originalTitle: string;
    translatedTitle: string;
    summaryZh: string;
    url: string;
    publishedAt: string;
    score: number;
    tags: string[];
  };

  type DailyData = {
    date: string;
    generatedAt: string;
    items: NewsItem[];
  };

  let data: DailyData | null = null;
  let error = "";

  onMount(async () => {
    try {
      const res = await fetch(`${base}/data/latest.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch {
      error = "目前無法載入今日新聞。";
    }
  });

  function formatDate(value: string): string {
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(`${value}T00:00:00+08:00`));
  }

  function formatTime(value: string): string {
    return new Intl.DateTimeFormat("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>tech-bento</title>
</svelte:head>

<main class="site-shell">
  <header class="masthead">
    <div>
      <h1>tech-bento</h1>
      <p class="subtitle">每日英文科技新聞中文摘要</p>
    </div>
    <nav class="header-actions" aria-label="頁面操作">
      <ThemeToggle />
      <a class="archive-link" href={`${base}/archive`}>Archive</a>
    </nav>
  </header>

  {#if data}
    <section class="date-row" aria-label="今日日期">
      <span>{formatDate(data.date)}</span>
      <span>Top {data.items.length}</span>
    </section>

    <section class="news-list" aria-label={`今日 Top ${data.items.length} 科技新聞`}>
      {#each data.items as item}
        <article class="news-card">
          <div class="rank">#{item.rank}</div>
          <div class="content">
            <h2>{item.translatedTitle}</h2>
            <p>{item.summaryZh}</p>

            <div class="tags" aria-label="Tags">
              {#each item.tags as tag}
                <span>{tag}</span>
              {/each}
            </div>

            <div class="meta">
              <span>來源：{item.source}</span>
              <span>發布時間：{formatTime(item.publishedAt)}</span>
            </div>

            <a class="read-link" href={item.url} target="_blank" rel="noopener noreferrer">
              閱讀原文
            </a>
          </div>
        </article>
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
    width: min(1040px, calc(100% - 32px));
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
    font-size: clamp(2.4rem, 7vw, 4.8rem);
    line-height: 0.95;
    letter-spacing: 0;
  }

  .subtitle {
    margin: 14px 0 0;
    color: var(--text);
    font-size: 1.15rem;
  }

  .archive-link,
  .read-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 16px;
    border: 1px solid var(--button-border);
    border-radius: 6px;
    background: var(--button-bg);
    color: var(--button-text);
    font-weight: 700;
    text-decoration: none;
  }

  .archive-link {
    background: var(--button-muted-bg);
    color: var(--text-strong);
  }

  .date-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin: 28px 0 18px;
    color: var(--muted);
    font-weight: 700;
  }

  .news-list {
    display: grid;
    gap: 14px;
  }

  .news-card {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 20px;
    padding: 22px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }

  .rank {
    color: var(--accent-strong);
    font-size: 1.8rem;
    font-weight: 800;
    line-height: 1;
  }

  .content {
    min-width: 0;
  }

  h2 {
    margin: 0;
    color: var(--text-strong);
    font-size: 1.35rem;
    line-height: 1.35;
    letter-spacing: 0;
  }

  .content p {
    margin: 14px 0 0;
    color: var(--text);
    font-size: 1rem;
    line-height: 1.75;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0 0;
  }

  .tags span {
    padding: 4px 9px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-size: 0.86rem;
    font-weight: 700;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    margin: 16px 0;
    color: var(--muted);
    font-size: 0.92rem;
  }

  .status {
    margin-top: 32px;
    color: var(--muted);
  }

  @media (max-width: 680px) {
    .site-shell {
      width: min(100% - 24px, 1040px);
      padding-top: 28px;
    }

    .masthead {
      display: grid;
    }

    .header-actions {
      flex-wrap: wrap;
    }

    .archive-link {
      width: fit-content;
    }

    .news-card {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 18px;
    }
  }
</style>
