/**
 * For now, editorial content comes only from trusted CMS authors,
 * so we return HTML as-is to preserve all formatting.
 *
 * If we later expose this to untrusted input, we can re-introduce
 * DOMPurify or another sanitizer here.
 */
export function sanitizeEditorialHtml(html: string): string {
  return html || "";
}

