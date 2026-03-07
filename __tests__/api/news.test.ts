import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

interface NewsArticle {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

interface NewsResponse {
  articles: NewsArticle[];
}

describe("Phase 8 — News API (/api/news)", () => {
  it("GET /api/news returns { articles: [...] } with up to 30 items", async () => {
    const res = await fetch(`${BASE}/api/news`);
    expect(res.status).toBe(200);

    const data: NewsResponse = await res.json();
    expect(data).toHaveProperty("articles");
    expect(Array.isArray(data.articles)).toBe(true);
    expect(data.articles.length).toBeGreaterThan(0);
    expect(data.articles.length).toBeLessThanOrEqual(30);
  });

  it("each article has required fields: headline, url, source, datetime", async () => {
    const res = await fetch(`${BASE}/api/news`);
    const data: NewsResponse = await res.json();

    for (const article of data.articles) {
      expect(article).toHaveProperty("headline");
      expect(typeof article.headline).toBe("string");
      expect(article.headline.length).toBeGreaterThan(0);

      expect(article).toHaveProperty("url");
      expect(typeof article.url).toBe("string");
      expect(article.url).toMatch(/^https?:\/\//);

      expect(article).toHaveProperty("source");
      expect(typeof article.source).toBe("string");

      expect(article).toHaveProperty("datetime");
      expect(typeof article.datetime).toBe("number");
      expect(article.datetime).toBeGreaterThan(0);
    }
  });

  it("?category=crypto returns crypto articles", async () => {
    const res = await fetch(`${BASE}/api/news?category=crypto`);
    expect(res.status).toBe(200);

    const data: NewsResponse = await res.json();
    expect(data.articles.length).toBeGreaterThan(0);
  });

  it("?category=forex returns articles", async () => {
    const res = await fetch(`${BASE}/api/news?category=forex`);
    expect(res.status).toBe(200);

    const data: NewsResponse = await res.json();
    expect(data).toHaveProperty("articles");
    expect(Array.isArray(data.articles)).toBe(true);
  });

  it("?category=merger returns articles", async () => {
    const res = await fetch(`${BASE}/api/news?category=merger`);
    expect(res.status).toBe(200);

    const data: NewsResponse = await res.json();
    expect(data).toHaveProperty("articles");
    expect(Array.isArray(data.articles)).toBe(true);
  });

  it("invalid category falls back to general (no error)", async () => {
    const res = await fetch(`${BASE}/api/news?category=INVALID`);
    expect(res.status).toBe(200);

    const data: NewsResponse = await res.json();
    expect(data).toHaveProperty("articles");
    expect(Array.isArray(data.articles)).toBe(true);
  });
});
