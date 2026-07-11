#!/usr/bin/env node
/**
 * Add elevateexterior.org to Mailgun and create an inbound route that forwards
 * all replies (replies@, noreply@, etc.) to the owner's Gmail.
 *
 * Usage (from web/):
 *   node scripts/setup-mailgun-domain.mjs
 *
 * Requires MAILGUN_API_KEY, MAILGUN_DOMAIN, and CONTACT_TO_EMAIL in .env.
 * After running, add the printed DNS records at your domain registrar.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

function loadEnv() {
  try {
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key]) continue;
      process.env[key] = raw.replace(/^["']|["']$/g, "");
    }
  } catch {
    console.warn("No .env file found; using environment variables only.");
  }
}

loadEnv();

const API_KEY = process.env.MAILGUN_API_KEY?.trim();
const DOMAIN = process.env.MAILGUN_DOMAIN?.trim();
const FORWARD_TO =
  process.env.CONTACT_TO_EMAIL?.split(",")[0]?.trim() ?? "kylelesso@gmail.com";

if (!API_KEY || !DOMAIN) {
  console.error("Set MAILGUN_API_KEY and MAILGUN_DOMAIN in .env first.");
  process.exit(1);
}

const auth = Buffer.from(`api:${API_KEY}`).toString("base64");

async function mgFetch(path, options = {}) {
  const res = await fetch(`https://api.mailgun.net/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...options.headers,
    },
  });
  const body = await res.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    json = body;
  }
  if (!res.ok) {
    throw new Error(`Mailgun ${path} failed (${res.status}): ${body}`);
  }
  return json;
}

async function addDomain() {
  try {
    await mgFetch("/domains", {
      method: "POST",
      body: new URLSearchParams({ name: DOMAIN }),
    });
    console.log(`Added domain: ${DOMAIN}`);
  } catch (err) {
    if (String(err.message).includes("already exists")) {
      console.log(`Domain ${DOMAIN} already exists in Mailgun.`);
    } else {
      throw err;
    }
  }
}

async function showDnsRecords() {
  const data = await mgFetch(`/domains/${DOMAIN}`);
  const records = data.sending_dns_records ?? [];
  const receiving = data.receiving_dns_records ?? [];

  console.log("\n=== DNS records to add at your registrar ===\n");
  for (const r of [...records, ...receiving]) {
    const host = r.name ?? DOMAIN;
    console.log(`${r.record_type}\t${host}\t${r.value}\t(priority: ${r.priority ?? "—"})`);
  }
}

async function createForwardRoute() {
  const routes = await mgFetch("/routes");
  const existing = (routes.items ?? []).find(
    (r) => r.description === `Forward all ${DOMAIN} mail to owner`
  );
  if (existing) {
    console.log(`Forward route already exists: ${existing.id}`);
    return;
  }

  const data = await mgFetch("/routes", {
    method: "POST",
    body: new URLSearchParams({
      priority: "0",
      description: `Forward all ${DOMAIN} mail to owner`,
      expression: `match_recipient(".*@${DOMAIN.replace(/\./g, "\\.")}")`,
      action: `forward("${FORWARD_TO}")`,
    }),
  });
  console.log(`Created forward route → ${FORWARD_TO} (route id: ${data.route?.id ?? "ok"})`);
}

async function main() {
  console.log(`Setting up Mailgun for ${DOMAIN} → forwards to ${FORWARD_TO}\n`);
  await addDomain();
  await showDnsRecords();
  await createForwardRoute();
  console.log("\nDone. Add the DNS records above, then verify the domain in Mailgun.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
