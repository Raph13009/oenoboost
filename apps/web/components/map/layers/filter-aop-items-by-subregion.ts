export type AopListFilterItem = {
  id: number;
};

/**
 * When a subregion is selected, keep only AOPs linked to that subregion.
 * No selection → full list. Missing link data → exclude (never show foreign AOPs).
 */
export function filterAopItemsBySubregion<T extends AopListFilterItem>(
  items: readonly T[],
  selectedSubregionId: string | null | undefined,
  linksByAopId: ReadonlyMap<number, readonly number[]>,
): T[] {
  if (!selectedSubregionId) return [...items];

  const subId = Number(selectedSubregionId);
  if (!Number.isFinite(subId)) return [...items];

  return items.filter((item) => {
    const links = linksByAopId.get(item.id);
    if (!links || links.length === 0) return false;
    return links.includes(subId);
  });
}
