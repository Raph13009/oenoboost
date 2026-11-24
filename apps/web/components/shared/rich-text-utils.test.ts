import { describe, expect, it } from "vitest";
import { looksLikeHtml, stripHtmlToText } from "./rich-text-utils";

describe("looksLikeHtml", () => {
  it("detects common CMS tags", () => {
    expect(looksLikeHtml("<p>Hello</p>")).toBe(true);
    expect(looksLikeHtml("Text with <strong>bold</strong>")).toBe(true);
    expect(looksLikeHtml("<ul><li>a</li></ul>")).toBe(true);
  });

  it("treats plain text and newlines as plain", () => {
    expect(looksLikeHtml("Simple text")).toBe(false);
    expect(looksLikeHtml("Line one\nLine two")).toBe(false);
    expect(looksLikeHtml("2 < 3 and 4 > 1")).toBe(false);
  });
});

describe("stripHtmlToText", () => {
  it("strips tags for list previews", () => {
    expect(
      stripHtmlToText(
        "<p>Porté par le <strong>succès </strong>de la <strong>Bourgogne </strong></p>",
      ),
    ).toBe("Porté par le succès de la Bourgogne");
  });

  it("keeps plain text", () => {
    expect(stripHtmlToText("Bourgogne, Champagne")).toBe(
      "Bourgogne, Champagne",
    );
  });
});
