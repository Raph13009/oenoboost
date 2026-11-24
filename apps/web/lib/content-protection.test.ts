/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from "vitest";

import { isCopyAllowedTarget } from "./content-protection";

describe("isCopyAllowedTarget", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("allows copy inside input and textarea", () => {
    document.body.innerHTML = `
      <input id="i" />
      <textarea id="t"></textarea>
      <p id="p">CMS text</p>
    `;
    expect(isCopyAllowedTarget(document.getElementById("i"))).toBe(true);
    expect(isCopyAllowedTarget(document.getElementById("t"))).toBe(true);
    expect(isCopyAllowedTarget(document.getElementById("p"))).toBe(false);
  });

  it("allows copy inside [data-allow-copy]", () => {
    document.body.innerHTML = `
      <div data-allow-copy>
        <p id="note">My note</p>
      </div>
    `;
    expect(isCopyAllowedTarget(document.getElementById("note"))).toBe(true);
  });

  it("allows contenteditable regions", () => {
    document.body.innerHTML = `<div id="ed" contenteditable="true">edit</div>`;
    expect(isCopyAllowedTarget(document.getElementById("ed"))).toBe(true);
  });

  it("blocks plain educational text", () => {
    document.body.innerHTML = `<article id="a"><p id="p">Lesson</p></article>`;
    expect(isCopyAllowedTarget(document.getElementById("p"))).toBe(false);
    expect(isCopyAllowedTarget(null)).toBe(false);
  });
});
