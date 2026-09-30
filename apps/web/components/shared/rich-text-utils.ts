/** Detect CMS rich-text HTML vs legacy plain text. */

const HTML_TAG_RE = /<\/?[a-z][^>]*>/i;

export function looksLikeHtml(value: string): boolean {
  return HTML_TAG_RE.test(value);
}
