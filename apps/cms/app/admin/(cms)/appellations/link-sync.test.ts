import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAppellationSubregionLinkSyncPlan,
  normalizeSubregionIds,
  validatePublishedAppellationLinkState,
} from "./link-sync";

test("preserves existing links when subregion is absent from payload", () => {
  const plan = buildAppellationSubregionLinkSyncPlan(["subregion-1"], normalizeSubregionIds(undefined));

  assert.equal(plan.preserveExisting, true);
  assert.deepEqual(plan.finalSubregionIds, ["subregion-1"]);
  assert.deepEqual(plan.toInsert, []);
  assert.deepEqual(plan.toDelete, []);
});

test("keeps links unchanged when editing an appellation without changing its subregion", () => {
  const plan = buildAppellationSubregionLinkSyncPlan(["subregion-1"], normalizeSubregionIds("subregion-1"));

  assert.equal(plan.preserveExisting, false);
  assert.deepEqual(plan.finalSubregionIds, ["subregion-1"]);
  assert.deepEqual(plan.toInsert, []);
  assert.deepEqual(plan.toDelete, []);
});

test("editing soil links does not request any subregion link change", () => {
  const plan = buildAppellationSubregionLinkSyncPlan(
    ["subregion-1"],
    normalizeSubregionIds(undefined)
  );

  assert.deepEqual(plan.finalSubregionIds, ["subregion-1"]);
  assert.deepEqual(plan.toInsert, []);
  assert.deepEqual(plan.toDelete, []);
});

test("changing the subregion computes an upsert/delete diff instead of delete-all", () => {
  const plan = buildAppellationSubregionLinkSyncPlan(["subregion-1"], normalizeSubregionIds("subregion-2"));

  assert.deepEqual(plan.finalSubregionIds, ["subregion-2"]);
  assert.deepEqual(plan.toInsert, ["subregion-2"]);
  assert.deepEqual(plan.toDelete, ["subregion-1"]);
});

test("published appellation cannot be saved without a subregion link", () => {
  const error = validatePublishedAppellationLinkState("published", []);

  assert.equal(error, "Une AOP publiée doit être liée à au moins une sous-région.");
});

test("published appellation remains valid when payload omits subregion but existing link is preserved", () => {
  const plan = buildAppellationSubregionLinkSyncPlan(["subregion-1"], normalizeSubregionIds(undefined));
  const error = validatePublishedAppellationLinkState("published", plan.finalSubregionIds);

  assert.equal(error, null);
});
