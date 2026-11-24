/** Detect CMS rich-text HTML vs legacy plain text. */

const HTML_TAG_RE = /<\/?[a-z][^>]*>/i;

export function looksLikeHtml(value: string): boolean {
  return HTML_TAG_RE.test(value);
}

/** Plain-text preview from CMS rich-text (list cards, filters). */
export function stripHtmlToText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
