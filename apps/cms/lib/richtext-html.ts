/**
 * Lightweight allowlist HTML sanitizer for CMS rich text.
 * Avoids isomorphic-dompurify / jsdom (breaks Next 14 bundling via ESM deps).
 *
 * Allowed tags: strong/b, em/i, u, p, br, ul, ol, li, a(href,target,rel)
 */

const ALLOWED_TAGS = new Set([
  "strong",
  "b",
  "em",
  "i",
  "u",
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "a",
]);

function sanitizeHref(raw: string): string | null {
  const href = raw.trim();
  if (!href) return null;
  const lower = href.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return null;
  }
  return href;
}

function sanitizeOpenTag(tagName: string, rawAttrs: string): string {
  if (tagName === "br") return "<br>";
  if (tagName !== "a") return `<${tagName}>`;

  const attrs: string[] = [];
  const hrefMatch = rawAttrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const hrefRaw = hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "";
  const href = sanitizeHref(hrefRaw);
  if (href) attrs.push(`href="${href.replace(/"/g, "&quot;")}"`);

  const targetMatch = rawAttrs.match(/\btarget\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const target = (targetMatch?.[2] ?? targetMatch?.[3] ?? targetMatch?.[4] ?? "").trim();
  if (target === "_blank" || target === "_self") {
    attrs.push(`target="${target}"`);
  }

  const relMatch = rawAttrs.match(/\brel\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const rel = (relMatch?.[2] ?? relMatch?.[3] ?? relMatch?.[4] ?? "").trim();
  if (rel) {
    const safe = rel
      .split(/\s+/)
      .filter((t) => /^(noopener|noreferrer|nofollow)$/i.test(t))
      .join(" ");
    if (safe) attrs.push(`rel="${safe}"`);
  } else if (target === "_blank") {
    attrs.push('rel="noopener"');
  }

  return attrs.length > 0 ? `<a ${attrs.join(" ")}>` : "<a>";
}

/** Limite le HTML éditeur au sous-ensemble autorisé pour les champs CMS. */
export function sanitizeRichTextHtml(html: string): string {
  if (!html) return "";

  let out = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?(script|style|iframe|object|embed|noscript)\b[^>]*>/gi, "");

  out = out.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (match, rawTag: string, rawAttrs = "") => {
    const tagName = rawTag.toLowerCase();
    const isClosing = match.startsWith("</");
    if (!ALLOWED_TAGS.has(tagName)) {
      return "";
    }
    if (isClosing) {
      if (tagName === "br") return "";
      return `</${tagName === "b" ? "strong" : tagName === "i" ? "em" : tagName}>`;
    }
    const normalized =
      tagName === "b" ? "strong" : tagName === "i" ? "em" : tagName;
    return sanitizeOpenTag(normalized, rawAttrs ?? "");
  });

  return out;
}

/** Considère vide un éditeur TipTap (ex. `<p></p>`, espaces, `<br>` seul). */
export function isRichTextHtmlEmpty(html: string | null | undefined): boolean {
  if (!html?.trim()) return true;
  const stripped = sanitizeRichTextHtml(html)
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<\/?p>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .trim();
  return stripped === "";
}

/** Valeur à persister : `null` si vide après assainissement. */
export function normalizeRichTextForStorage(
  html: string | null | undefined,
): string | null {
  if (!html) return null;
  const sanitized = sanitizeRichTextHtml(html);
  return isRichTextHtmlEmpty(sanitized) ? null : sanitized;
}
