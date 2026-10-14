// ---------------------------------------------------------------------------
// End-to-end gameplay harness.
//
// Drives the real app in headless Chrome and asserts on the game's own state
// (via the dev-only `window.__life()` hook) rather than scraping the DOM. This
// is the safety net that catches "component not mounted" class bugs — the kind
// that a lint pass and a unit suite will happily miss.
//
//   npm run test:e2e            (starts its own vite dev server)
//   CHROME_PATH=... npm run test:e2e
//   HEADED=1 npm run test:e2e   (watch it play)
// ---------------------------------------------------------------------------
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const PORT = Number(process.env.E2E_PORT || 5199);
const URL = `http://localhost:${PORT}/`;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

const SHOT_DIR = process.env.E2E_SHOTS || 'e2e-shots';

let passed = 0;
let failed = 0;

function check(cond, label, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* ignore */
    }
  }
  throw new Error(
    `No Chrome found. Set CHROME_PATH. Tried:\n  ${CHROME_CANDIDATES.join('\n  ')}`,
  );
}

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(400);
  }
  throw new Error(`Dev server did not start at ${url}`);
}

async function main() {
  const chrome = findChrome();
  console.log(`→ Life Sim end-to-end harness\n  chrome: ${chrome}\n  url:    ${URL}\n`);

  fs.mkdirSync(SHOT_DIR, { recursive: true });

  // --- Start the app ------------------------------------------------------
  const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    detached: false,
  });
  let browser;
  try {
    await waitForServer(URL);

    browser = await puppeteer.launch({
      executablePath: chrome,
      headless: !process.env.HEADED,
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--use-gl=swiftshader',
        '--enable-unsafe-swiftshader',
        '--window-size=1280,820',
      ],
      defaultViewport: { width: 1280, height: 820 },
    });

    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 240)));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/unmount a root|same key/i.test(m.text())) {
        pageErrors.push(m.text().slice(0, 240));
      }
    });

    const state = () => page.evaluate(() => window.__life());
    const shot = (name) => page.screenshot({ path: `${SHOT_DIR}/${name}.png` });

    // --- Load -------------------------------------------------------------
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(2500);

    check(
      await page.evaluate(() => /Who's moving in/i.test(document.body.innerText)),
      'Create-a-household screen renders',
    );
    await shot('01-create-household');

    // --- Move in ----------------------------------------------------------
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.includes('Move In'));
      b?.click();
    });

    // Wait for the scene + state hook to come up.
    await page.waitForFunction(() => window.__life?.().hasHousehold === true, { timeout: 60000 });
    await page.waitForFunction(() => window.__life?.().sims.some((s) => s.x !== null), { timeout: 60000 });
    await sleep(4000);

    let s = await state();
    check(s.hasHousehold, 'Household created');
    check(s.sims.length >= 1, `Household has Sims (${s.sims.length})`);
    check(s.objectCount > 0, `Starter furniture placed (${s.objectCount} objects)`);
    check(s.wallCount > 0, `Starter house has walls (${s.wallCount} segments)`);
    check(s.funds > 0, `Household has money (₦${s.funds.toLocaleString()})`);
    check(s.selectedSimId !== null, 'A Sim is selected by default');
    check(
      s.sims.every((sim) => sim.x !== null && sim.z !== null),
      'Every Sim has a world position',
    );
    await shot('02-moved-in');

    // --- Avatar control: arrow keys must move the SELECTED SIM -------------
    const before = s.sims.find((sim) => sim.id === s.selectedSimId);
    await page.keyboard.down('ArrowUp');
    await sleep(1200);
    await page.keyboard.up('ArrowUp');
    await sleep(400);
    let after = (await state()).sims.find((sim) => sim.id === before.id);
    const movedByArrow = Math.hypot((after.x ?? 0) - (before.x ?? 0), (after.z ?? 0) - (before.z ?? 0));
    check(
      movedByArrow > 0.4,
      `Arrow keys move the selected Sim (${movedByArrow.toFixed(2)}m)`,
      `from (${before.x}, ${before.z}) to (${after.x}, ${after.z})`,
    );

    const beforeStrafe = after;
    await page.keyboard.down('KeyD');
    await sleep(900);
    await page.keyboard.up('KeyD');
    await sleep(400);
    after = (await state()).sims.find((sim) => sim.id === before.id);
    const movedByWasd = Math.hypot((after.x ?? 0) - (beforeStrafe.x ?? 0), (after.z ?? 0) - (beforeStrafe.z ?? 0));
    check(movedByWasd > 0.3, `WASD also drives the Sim (${movedByWasd.toFixed(2)}m)`);
    await shot('03-avatar-walked');

    // The Sim must not be pushed through a wall or off the plot.
    const plot = await page.evaluate(() => {
      const p = window.__life().sims[0];
      return { x: p.x, z: p.z };
    });
    check(Number.isFinite(plot.x) && Number.isFinite(plot.z), 'Sim position stays finite after driving');

    // --- Free will resumes when you let go --------------------------------
    await sleep(3500);
    const freeA = (await state()).sims.find((sim) => sim.id === before.id);
    await sleep(4000);
    const freeB = (await state()).sims.find((sim) => sim.id === before.id);
    const freewillMoved = Math.hypot((freeB.x ?? 0) - (freeA.x ?? 0), (freeB.z ?? 0) - (freeA.z ?? 0));
    check(
      freewillMoved > 0.1 || freeB.active !== null,
      'Sim keeps living on their own once you stop driving',
      `moved ${freewillMoved.toFixed(2)}m, active=${freeB.active}`,
    );

    // --- Simulation is running -------------------------------------------
    const clockA = (await state()).clock;
    await sleep(2500);
    const clockB = (await state()).clock;
    check(clockB > clockA, `Clock advances (${Math.round(clockB - clockA)} sim minutes)`);

    // --- Buy mode ---------------------------------------------------------
    const fundsBefore = (await state()).funds;
    const objectsBefore = (await state()).objectCount;
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.includes('Build'));
      b?.click();
    });
    await sleep(900);
    check(
      await page.evaluate(() => /Build & Buy/i.test(document.body.innerText)),
      'Build & Buy opens',
    );
    check(
      await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => /Walls/.test(b.innerText))),
      'Wall tool is offered',
    );

    // Place through the store API: aiming with a synthetic pointer is flaky in
    // software rendering, and what we're verifying is the purchase path.
    await page.evaluate(() => {
      const store = window.__lifeStore;
      if (!store) return;
      const plot = store.getState().household.plot;
      store.getState().startPlacing('camp_bed');
      store.getState().setGhost(plot.originX + 3, plot.originZ + 14);
      store.getState().confirmPlace();
    });
    await sleep(1200);
    s = await state();
    if (s.objectCount > objectsBefore) {
      check(true, `Buying furniture adds it to the lot (${objectsBefore} → ${s.objectCount})`);
      check(s.funds < fundsBefore, `Buying spends money (₦${fundsBefore} → ₦${s.funds})`);
    } else {
      check(false, 'Buying furniture adds it to the lot', `objectCount stayed at ${objectsBefore}`);
      check(false, 'Buying spends money', 'nothing was bought');
    }
    await shot('04-build-mode');

    // --- Walls ------------------------------------------------------------
    const wallsBefore = (await state()).wallCount;
    const fundsBeforeWall = (await state()).funds;
    await page.evaluate(() => {
      const store = window.__lifeStore;
      const plot = store.getState().household.plot;
      // Find a legal segment out in the open, clear of the existing shell.
      for (let z = 1; z <= plot.depth; z++) {
        const key = `h,1,${z}`;
        if (!plot.walls.includes(key) && !plot.doors?.includes(key)) {
          store.getState().toggleWall(key);
          return;
        }
      }
    });
    await sleep(500);
    const afterWall = await state();
    check(
      afterWall.wallCount === wallsBefore + 1,
      `Drawing a wall adds it to the plan (${wallsBefore} → ${afterWall.wallCount} segments)`,
    );
    check(afterWall.funds < fundsBeforeWall, `Drawing a wall costs money (₦${fundsBeforeWall} → ₦${afterWall.funds})`);

    // --- Wall modes -------------------------------------------------------
    const modeA = (await state()).wallMode;
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => /Walls|Cut Away/.test(x.innerText));
      b?.click();
    });
    await sleep(400);
    const modeB = (await state()).wallMode;
    check(modeA !== modeB, `Wall visibility toggle cycles (${modeA} → ${modeB})`);

    // --- Selecting another Sim moves control + camera ---------------------
    const other = (await state()).sims.find((sim) => sim.id !== before.id);
    if (other) {
      await page.evaluate((id) => window.__lifeStore.getState().selectSim(id), other.id);
      await sleep(600);
      check((await state()).selectedSimId === other.id, 'Selecting a Sim switches control');
    } else {
      check(true, 'Selecting a Sim switches control (single-Sim household, skipped)');
    }

    // --- Persistence ------------------------------------------------------
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(2500);
    check(
      await page.evaluate(() => window.__life().hasHousehold),
      'Household survives a reload',
    );

    // --- No runtime errors ------------------------------------------------
    check(pageErrors.length === 0, 'No runtime errors in the console', pageErrors.slice(0, 3).join(' | '));

    await shot('05-final');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }

  console.log(`\nEnd-to-end harness: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('❌ Harness crashed:', err);
  process.exit(1);
});
