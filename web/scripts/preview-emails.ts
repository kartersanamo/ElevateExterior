import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateAllEmailPreviews } from "../lib/email/previews";

const outputDir = join(process.cwd(), "email-previews");

mkdirSync(outputDir, { recursive: true });

const previews = generateAllEmailPreviews();

const cards = previews
  .map(
    (preview) => `<section class="card">
  <div class="meta">
    <span class="badge ${preview.audience}">${preview.audience}</span>
    <h2>${preview.name}</h2>
    <p class="id">${preview.id}</p>
  </div>
  <iframe src="./${preview.id}.html" title="${preview.name}"></iframe>
</section>`
  )
  .join("\n");

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Elevate Exterior — Email Previews</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; background: #f5f9fd; color: #1e293b; }
    header { background: #013c83; color: #fff; padding: 32px 24px; }
    header h1 { margin: 0 0 8px; font-size: 28px; }
    header p { margin: 0; opacity: 0.8; }
    main { padding: 24px; display: grid; gap: 24px; max-width: 1400px; margin: 0 auto; }
    .card { background: #fff; border: 1px solid #d9e8f5; border-radius: 16px; overflow: hidden; }
    .meta { padding: 16px 20px; border-bottom: 1px solid #d9e8f5; }
    .meta h2 { margin: 8px 0 4px; font-size: 18px; color: #013c83; }
    .id { margin: 0; font-size: 12px; color: #5a718a; font-family: monospace; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 999px; }
    .badge.customer { background: #e6f4fc; color: #013c83; }
    .badge.admin { background: #013c83; color: #fff; }
    iframe { width: 100%; height: 720px; border: 0; background: #f5f9fd; }
  </style>
</head>
<body>
  <header>
    <h1>Elevate Exterior — Email Previews</h1>
    <p>${previews.length} templates · Generated ${new Date().toLocaleString()}</p>
  </header>
  <main>${cards}</main>
</body>
</html>`;

writeFileSync(join(outputDir, "index.html"), indexHtml);

for (const preview of previews) {
  writeFileSync(join(outputDir, `${preview.id}.html`), preview.html);
}

console.log(`Generated ${previews.length} email previews in ${outputDir}/`);
console.log(`Open ${join(outputDir, "index.html")} in your browser.`);
