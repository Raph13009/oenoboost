/**
 * URL-safe AOP slug. Keep in sync with `public.aop_fill_slug()`
 * and `apps/web/features/vignoble/lib/aop-slug.ts`.
 */
export function slugifyAopSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
