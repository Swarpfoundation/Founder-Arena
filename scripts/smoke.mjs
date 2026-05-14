#!/usr/bin/env node

/**
 * Smoke Test Script
 *
 * Verifies HTTP routes against a running Founder Arena instance.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/smoke.mjs
 *   node scripts/smoke.mjs   # defaults to http://localhost:3000
 */

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const FAILURES = [];

const ROUTES = [
  { path: "/", expectStatus: 200, label: "Landing page" },
  { path: "/login", expectStatus: 200, label: "Login page" },
  { path: "/market", expectStatus: 200, label: "Market page" },
  { path: "/leaderboard", expectStatus: 200, label: "Leaderboard" },
  { path: "/graveyard", expectStatus: 200, label: "Graveyard" },
  { path: "/api/health", expectStatus: 200, label: "Health endpoint" },
  { path: "/api/cron/market-snapshot", expectStatus: 200, label: "Cron health endpoint" },
  { path: "/api/cron/generate-market-snapshot", expectStatus: 401, label: "Vercel cron endpoint (unauth)", acceptError: true },
  { path: "/register", expectStatus: 307, label: "Register redirect", acceptRedirect: true },
  { path: "/dashboard", expectStatus: 302, label: "Dashboard redirect (unauth)", acceptRedirect: true },
  { path: "/s/nonexistent-startup", expectStatus: 404, label: "Missing share page" },
];

async function checkRoute({ path, expectStatus, label, acceptRedirect, acceptError }) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, { redirect: acceptRedirect ? "manual" : "follow" });
    const ok = acceptRedirect
      ? res.status >= 300 && res.status < 400
      : acceptError
      ? res.status >= 400 && res.status < 600
      : res.status === expectStatus;

    if (ok) {
      console.log(`  ✅ ${label}: ${res.status}`);
    } else {
      console.log(`  ❌ ${label}: expected ${expectStatus}, got ${res.status}`);
      FAILURES.push({ path, expected: expectStatus, actual: res.status, label });
    }
  } catch (err) {
    console.log(`  ❌ ${label}: fetch error — ${err.message}`);
    FAILURES.push({ path, expected: expectStatus, actual: "error", label, error: err.message });
  }
}

async function checkHealthBody() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const body = await res.json();
    const checks = [
      ["status field", typeof body.status === "string"],
      ["version field", typeof body.version === "string"],
      ["environment field", ["production", "development"].includes(body.environment)],
      ["database field", ["ok", "error"].includes(body.database)],
      ["authConfigured field", typeof body.authConfigured === "boolean"],
      ["timestamp field", typeof body.timestamp === "string"],
      ["no secrets leaked", !JSON.stringify(body).includes("SECRET") && !JSON.stringify(body).includes("KEY")],
    ];
    for (const [name, ok] of checks) {
      if (ok) {
        console.log(`  ✅ Health body: ${name}`);
      } else {
        console.log(`  ❌ Health body: ${name}`);
        FAILURES.push({ path: "/api/health", label: `Health body: ${name}` });
      }
    }
  } catch (err) {
    console.log(`  ❌ Health body: parse error — ${err.message}`);
    FAILURES.push({ path: "/api/health", label: "Health body parse error" });
  }
}

async function main() {
  console.log(`\n🔥 Founder Arena Smoke Tests`);
  console.log(`   Target: ${BASE_URL}\n`);

  // Quick connectivity check
  try {
    await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) });
  } catch {
    console.log(`❌ Cannot connect to ${BASE_URL}`);
    console.log(`   Is the server running? Try: npm run dev\n`);
    process.exit(1);
  }

  for (const route of ROUTES) {
    await checkRoute(route);
  }

  await checkHealthBody();

  console.log("");
  if (FAILURES.length === 0) {
    console.log(`✅ All smoke tests passed (${ROUTES.length + 1} checks)\n`);
    process.exit(0);
  } else {
    console.log(`❌ ${FAILURES.length} smoke test(s) failed:\n`);
    for (const f of FAILURES) {
      console.log(`   • ${f.label}${f.actual ? ` (expected ${f.expected}, got ${f.actual})` : ""}`);
    }
    console.log("");
    process.exit(1);
  }
}

main();
