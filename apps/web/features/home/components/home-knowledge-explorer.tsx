"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type HomeKnowledgeItem = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  filter: string;
  accent: "wine" | "sage";
  icon: string;
  meta: string;
};

type Labels = {
  searchPlaceholder: string;
  searchAria: string;
  searchClearAria: string;
  searchEmpty: string;
  filters: { id: string; label: string }[];
};

type Props = {
  items: HomeKnowledgeItem[];
  labels: Labels;
};

export function HomeKnowledgeExplorer({ items, labels }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = active === "all" || item.filter === active;
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.meta.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [active, items, query]);

  return (
    <div className="home-make-knowledge-inner">
      <div className="home-make-search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchAria}
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={labels.searchClearAria}
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="home-make-filters" role="toolbar" aria-label={labels.searchAria}>
        {labels.filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            data-active={active === filter.id}
            aria-pressed={active === filter.id}
            onClick={() => setActive(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="home-make-search-empty">{labels.searchEmpty}</p>
      ) : (
        <div className="home-make-section-grid">
          {filtered.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              prefetch
              className="home-make-knowledge-card"
            >
              <div
                className="card-icon"
                style={{
                  color: item.accent === "sage" ? "var(--home-sage)" : "var(--home-ink)",
                }}
                aria-hidden
              >
                {item.icon}
              </div>
              <p className="card-number">{String(index + 1).padStart(2, "0")}</p>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
              <footer>
                <span>{item.meta}</span>
                <span className="card-arrow" aria-hidden>
                  →
                </span>
              </footer>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
