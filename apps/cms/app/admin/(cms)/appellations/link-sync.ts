export type LinkSyncPlan = {
  desiredSubregionIds: string[];
  finalSubregionIds: string[];
  toInsert: string[];
  toDelete: string[];
  preserveExisting: boolean;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function normalizeSubregionIds(
  input: string | string[] | null | undefined
): string[] | undefined {
  if (input === undefined) return undefined;

  if (input === null) return [];

  const values = Array.isArray(input) ? input : [input];
  return unique(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0));
}

export function buildAppellationSubregionLinkSyncPlan(
  existingSubregionIds: string[],
  requestedSubregionIds: string[] | undefined
): LinkSyncPlan {
  const existing = unique(existingSubregionIds);

  if (requestedSubregionIds === undefined) {
    return {
      desiredSubregionIds: existing,
      finalSubregionIds: existing,
      toInsert: [],
      toDelete: [],
      preserveExisting: true,
    };
  }

  const desired = unique(requestedSubregionIds);
  const existingSet = new Set(existing);
  const desiredSet = new Set(desired);

  return {
    desiredSubregionIds: desired,
    finalSubregionIds: desired,
    toInsert: desired.filter((subregionId) => !existingSet.has(subregionId)),
    toDelete: existing.filter((subregionId) => !desiredSet.has(subregionId)),
    preserveExisting: false,
  };
}

export function validatePublishedAppellationLinkState(
  status: string,
  finalSubregionIds: string[]
): string | null {
  if (status !== "published") return null;
  if (finalSubregionIds.length > 0) return null;
  return "Une AOP publiée doit être liée à au moins une sous-région.";
}
