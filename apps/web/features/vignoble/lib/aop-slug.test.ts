import { describe, expect, it } from "vitest";

import {
  buildAopDetailHref,
  decodeRouteSlug,
  resolveAopSlugCandidates,
  slugifyAopSlug,
} from "./aop-slug";

describe("slugifyAopSlug", () => {
  it("turns DGC names with spaces and accents into kebab-case", () => {
    expect(slugifyAopSlug("Côtes-de-Provence Sainte-Victoire")).toBe(
      "cotes-de-provence-sainte-victoire",
    );
    expect(slugifyAopSlug("côtes-de-provence sainte-victoire")).toBe(
      "cotes-de-provence-sainte-victoire",
    );
    expect(slugifyAopSlug("Anjou Brissac")).toBe("anjou-brissac");
  });

  it("leaves already-safe slugs unchanged", () => {
    expect(slugifyAopSlug("cotes-de-provence")).toBe("cotes-de-provence");
  });
});

describe("decodeRouteSlug", () => {
  it("decodes percent-encoded DGC slugs from the route param", () => {
    expect(
      decodeRouteSlug("c%C3%B4tes-de-provence%20sainte-victoire"),
    ).toBe("côtes-de-provence sainte-victoire");
  });

  it("strips a query string accidentally glued onto the path segment", () => {
    expect(
      decodeRouteSlug(
        "c%C3%B4tes-de-provence%20sainte-victoire?from=list",
      ),
    ).toBe("côtes-de-provence sainte-victoire");
  });

  it("returns the raw value when it is not encoded", () => {
    expect(decodeRouteSlug("cotes-de-provence-sainte-victoire")).toBe(
      "cotes-de-provence-sainte-victoire",
    );
  });
});

describe("resolveAopSlugCandidates", () => {
  it("tries the decoded slug then the kebab-case form", () => {
    expect(
      resolveAopSlugCandidates("c%C3%B4tes-de-provence%20sainte-victoire"),
    ).toEqual([
      "côtes-de-provence sainte-victoire",
      "cotes-de-provence-sainte-victoire",
    ]);
  });
});

describe("buildAopDetailHref", () => {
  it("encodes unsafe slug characters in the path", () => {
    expect(
      buildAopDetailHref("provence", "côtes-de-provence sainte-victoire", {
        from: "list",
      }),
    ).toBe(
      "/vignoble/provence/c%C3%B4tes-de-provence%20sainte-victoire?from=list",
    );
  });

  it("keeps kebab-case slugs readable", () => {
    expect(
      buildAopDetailHref("provence", "cotes-de-provence-sainte-victoire", {
        from: "map",
        subregion: "cotes-de-provence",
      }),
    ).toBe(
      "/vignoble/provence/cotes-de-provence-sainte-victoire?from=map&subregion=cotes-de-provence",
    );
  });
});
