import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEmailDocument,
  detailCard,
  emailButton,
  escapeHtml,
  escapeHtmlWithBreaks,
  getBrandLogoUrl,
  wrapBrandedContent,
} from "./design";
import { generateAllEmailPreviews } from "./previews";

describe("email design", () => {
  it("escapes HTML special characters", () => {
    assert.equal(
      escapeHtml(`<script>"test" & 'value'</script>`),
      "&lt;script&gt;&quot;test&quot; &amp; &#39;value&#39;&lt;/script&gt;"
    );
  });

  it("escapes HTML and preserves line breaks", () => {
    assert.equal(escapeHtmlWithBreaks("line1\nline2"), "line1<br />line2");
    assert.equal(escapeHtmlWithBreaks("<b>x</b>"), "&lt;b&gt;x&lt;/b&gt;");
  });

  it("uses absolute brand logo URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://elevate.example.com";
    assert.equal(getBrandLogoUrl(), "https://elevate.example.com/logo.png");
  });

  it("builds a complete email document with required structure", () => {
    const html = buildEmailDocument({
      previewText: "Preview line",
      content: "<p>Hello</p>",
    });

    assert.match(html, /<!DOCTYPE html>/);
    assert.match(html, /Preview line/);
    assert.match(html, /#013c83/);
    assert.match(html, /#0098e3/);
    assert.match(html, /#f5f9fd/);
    assert.match(html, /Your home, elevated\./);
    assert.match(html, /logo\.png/);
  });

  it("escapes detail card values", () => {
    const html = detailCard("Test", [
      { label: "Name", value: "<script>alert(1)</script>" },
    ]);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>alert/);
  });

  it("renders primary and secondary buttons with safe hrefs", () => {
    const primary = emailButton("Pay now", "https://example.com/pay?id=1");
    const secondary = emailButton("Call", "tel:+18327794639", "secondary");

    assert.match(primary, /background-color:#0098e3/);
    assert.match(secondary, /background-color:#013c83/);
    assert.match(primary, /href="https:\/\/example.com\/pay\?id=1"/);
  });

  it("wraps branded content in document shell", () => {
    const html = wrapBrandedContent("<p>Body</p>", { title: "Test Email" });
    assert.match(html, /<title>Test Email<\/title>/);
    assert.match(html, /<p>Body<\/p>/);
  });

  it("generates previews for every email type", () => {
    const previews = generateAllEmailPreviews();
    assert.ok(previews.length >= 10);

    for (const preview of previews) {
      assert.ok(preview.id, `missing id for ${preview.name}`);
      assert.match(preview.html, /<!DOCTYPE html>/, `${preview.name} missing doctype`);
      assert.match(preview.html, /#013c83/, `${preview.name} missing brand color`);
      assert.match(preview.html, /Elevate Exterior/, `${preview.name} missing brand name`);
    }
  });
});
