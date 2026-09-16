/**
 * URL-safe AOP slug helpers.
 * Keep the slugify rules in sync with `public.aop_fill_slug()`
 * (unaccent + non-alphanumerics → `-`).
 */

export function decodeRouteSlug(raw: string): string {
  let value = raw.trim();
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(value);
      if (next === value) break;
      value = next;
    } catch {
      break;
    }
  }
  const queryIndex = value.indexOf("?");
  return queryIndex >= 0 ? value.slice(0, queryIndex) : value;
}

export function slugifyAopSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveAopSlugCandidates(raw: string): string[] {
  const decoded = decodeRouteSlug(raw.trim());
  if (!decoded) return [];
  const normalized = slugifyAopSlug(decoded);
  if (!normalized || normalized === decoded) return [decoded];
  return [decoded, normalized];
}

export function buildAopDetailHref(
  regionSlug: string,
  aopSlug: string,
  query?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
  }
  const path = `/vignoble/${encodeURIComponent(regionSlug)}/${encodeURIComponent(aopSlug)}`;
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}
