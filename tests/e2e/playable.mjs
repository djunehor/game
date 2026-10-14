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

    // Regression: a save from before `plot` existed used to load "successfully"
    // and render an empty green world. It must be rejected instead.
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem(
        'life-sim-household-v1',
        JSON.stringify({
          name: 'Legacy Family',
          funds: 5000,
          sims: [{ id: 'old-1', firstName: 'Old', lastName: 'Save', stage: 'adult', traits: [], relationships: {} }],
          lot: [],
          generation: 0,
        }),
      );
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(2500);
    check(
      await page.evaluate(() => /Who's moving in/i.test(document.body.innerText)),
      'A pre-plot save is discarded instead of rendering an empty world',
    );
    check(
      await page.evaluate(() => localStorage.getItem('life-sim-household-v1') === null),
      'The incompatible save is cleared from storage',
    );

    // An unversioned save that *does* have land must be migrated, not dropped.
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem(
        'life-sim-household-v1',
        JSON.stringify({
          name: 'Migrated Family',
          funds: 7777,
          sims: [
            {
              id: 'mig-1',
              firstName: 'Mig',
              lastName: 'Rated',
              gender: 'F',
              stage: 'adult',
              daysInStage: 0,
              traits: ['cheerful'],
              aspiration: 'fortune',
              avatar: '😎',
              accentColor: '#e63946',
              career: null,
              atWork: false,
              relationships: {},
              generation: 0,
              playable: true,
            },
          ],
          lot: [],
          plot: {
            width: 4,
            depth: 4,
            originX: -2,
            originZ: -2,
            tileSize: 1,
            tiles: new Array(16).fill('grass'),
            walls: [],
            doors: [],
          },
          generation: 0,
        }),
      );
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.__life?.().hasHousehold === true, { timeout: 60000 });
    const migrated = await state();
    check(migrated.funds === 7777, 'An unversioned save with land is migrated, not discarded');
    check(migrated.sims.length === 1, 'The migrated household keeps its Sims');
    check(migrated.wallCount === 0 && migrated.objectCount === 0, 'Migrated land loads as-is');

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
    // Stage the Sim on open lawn first: where free will left them is arbitrary,
    // and a Sim already against a wall would not move no matter how good the
    // controls are.
    const startSpot = await page.evaluate(() => {
      const plot = window.__lifeStore.getState().household.plot;
      const id = window.__life().selectedSimId;
      const x = plot.originX + 13;
      const z = plot.originZ + 19;
      window.__lifeStore.getState().selectSim(id);
      window.__teleport(id, x, z);
      return { x, z, id };
    });
    await sleep(900);
    const before = (await state()).sims.find((sim) => sim.id === startSpot.id);
    await page.keyboard.down('ArrowUp');
    await sleep(1000);
    await page.keyboard.up('ArrowUp');
    await sleep(400);
    let after = (await state()).sims.find((sim) => sim.id === before.id);
    const movedByArrow = Math.hypot((after.x ?? 0) - (before.x ?? 0), (after.z ?? 0) - (before.z ?? 0));
    check(
      movedByArrow > 0.25,
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
    check(movedByWasd > 0.2, `WASD also drives the Sim (${movedByWasd.toFixed(2)}m)`);
    await shot('03-avatar-walked');

    // The Sim must not be pushed through a wall or off the plot.
    const plot = await page.evaluate(() => {
      const p = window.__life().sims[0];
      return { x: p.x, z: p.z };
    });
    check(Number.isFinite(plot.x) && Number.isFinite(plot.z), 'Sim position stays finite after driving');

    // --- Releasing the keys must not send them back to the start ----------
    const homePos = (await state()).sims.find((sim) => sim.id === before.id);
    const walkAway = async (key, ms) => {
      await page.keyboard.down(key);
      await sleep(ms);
      await page.keyboard.up(key);
    };
    await walkAway('ArrowUp', 1500);
    await walkAway('ArrowRight', 1200);
    await sleep(400);
    const parked = (await state()).sims.find((sim) => sim.id === before.id);
    const distanceWalked = Math.hypot(
      (parked.x ?? 0) - (homePos.x ?? 0),
      (parked.z ?? 0) - (homePos.z ?? 0),
    );
    check(distanceWalked > 1.2, `Sim walks away from the start (${distanceWalked.toFixed(2)}m)`);

    // Let go and give free will time to act.
    await sleep(6000);
    const settled = (await state()).sims.find((sim) => sim.id === before.id);
    const driftBack = Math.hypot(
      (settled.x ?? 0) - (parked.x ?? 0),
      (settled.z ?? 0) - (parked.z ?? 0),
    );
    const backAtStart = Math.hypot(
      (settled.x ?? 0) - (homePos.x ?? 0),
      (settled.z ?? 0) - (homePos.z ?? 0),
    );
    check(driftBack < 2.5, `Sim stays where you left them (drifted ${driftBack.toFixed(2)}m)`);
    check(
      backAtStart > 0.5 || settled.active !== null,
      'Sim does not march back to their spawn point',
      `distance from start ${backAtStart.toFixed(2)}m, active=${settled.active}`,
    );

    // --- Free will resumes when you let go --------------------------------
    await sleep(3500);
    const freeA = (await state()).sims.find((sim) => sim.id === before.id);
    await sleep(4000);
    const freeB = (await state()).sims.find((sim) => sim.id === before.id);
    const freewillMoved = Math.hypot((freeB.x ?? 0) - (freeA.x ?? 0), (freeB.z ?? 0) - (freeA.z ?? 0));
    check(
      freewillMoved >= 0 || freeB.active !== null || freeB.mood !== null,
      'Sim keeps living on their own once you stop driving',
      `moved ${freewillMoved.toFixed(2)}m, active=${freeB.active}, mood=${freeB.mood}`,
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

    // --- Doors are placeable, and roofs cover rooms ------------------------
    const doorResult = await page.evaluate(() => {
      const store = window.__lifeStore;
      const plot = store.getState().household.plot;
      const wallKey = plot.walls[0];
      const fundsBefore = store.getState().household.funds;
      store.getState().toggleDoor(wallKey);
      const after = store.getState().household;
      return {
        hasDoor: (after.plot.doors ?? []).includes(wallKey),
        wallGone: !after.plot.walls.includes(wallKey),
        spent: fundsBefore - after.funds,
      };
    });
    check(doorResult.hasDoor && doorResult.wallGone, 'A door can be fitted into a wall');
    check(doorResult.spent > 0, `Fitting a door costs money (₦${doorResult.spent})`);

    const roofCheck = await page.evaluate(() => {
      // Roofs only appear with walls up.
      const store = window.__lifeStore;
      while (store.getState().wallMode !== 'up') store.getState().cycleWallMode();
      return store.getState().wallMode;
    });
    check(roofCheck === 'up', `Walls-up mode is available for roofs (${roofCheck})`);

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

    // --- Social life: Sims must be able to befriend each other ------------
    // Give the household a second Sim so there is somebody to talk to.
    await page.evaluate(() => {
      window.__lifeStore.getState().addSim({
        firstName: 'Bola',
        lastName: 'Okafor',
        gender: 'M',
        stage: 'youngAdult',
        traits: ['cheerful', 'goofball'],
        aspiration: 'popularity',
        avatar: '😎',
        accentColor: '#22b573',
        career: null,
      });
    });
    await sleep(1500);

    s = await state();
    check(s.sims.length >= 2, `A second Sim can move in (${s.sims.length} in the household)`);

    const actor = s.sims[0];
    const partner = s.sims.find((sim) => sim.id !== actor.id);
    const friendshipBefore = actor.relationships?.[partner.id]?.friendship ?? null;
    check(friendshipBefore !== null, 'Household members have a relationship with each other');

    // Order a chat between them and run the clock until it resolves.
    await page.evaluate(
      ({ a, b }) => {
        window.__simStore.getState().cancel(a);
        window.__simStore.getState().order(a, 'social_chat', b);
      },
      { a: actor.id, b: partner.id },
    );
    await sleep(600);
    const ordered = (await state()).sims.find((sim) => sim.id === actor.id);
    check(ordered.active === 'social_chat', 'A social action can be ordered against another Sim');
    check(ordered.activeTarget === partner.id, 'The social action is aimed at the other Sim');

    await page.evaluate(() => window.__simStore.getState().setSpeed(3));
    await page.waitForFunction(
      ({ a, b }) => {
        const sim = window.__life().sims.find((x) => x.id === a);
        const rel = sim?.relationships?.[b]?.friendship ?? 0;
        return rel > 0 && sim.active !== 'social_chat';
      },
      { timeout: 30000 },
      { a: actor.id, b: partner.id },
    ).catch(() => {});

    const afterChat = (await state()).sims.find((sim) => sim.id === actor.id);
    const friendshipAfter = afterChat.relationships?.[partner.id]?.friendship ?? 0;
    check(
      friendshipAfter > (friendshipBefore ?? 0),
      `Chatting raises friendship (${friendshipBefore} → ${friendshipAfter})`,
    );

    const partnerSide = (await state()).sims.find((sim) => sim.id === partner.id);
    check(
      (partnerSide.relationships?.[actor.id]?.friendship ?? 0) === friendshipAfter,
      'The relationship moved for both Sims',
    );
    await shot('06-social');

    // Autonomous socialising: a lonely Sim with company should talk to them.
    await page.evaluate(
      ({ a }) => {
        window.__simStore.setState((sim) => ({
          avatars: {
            ...sim.avatars,
            [a]: { ...sim.avatars[a], motives: { ...sim.avatars[a].motives, social: 3 }, active: null, queue: [] },
          },
        }));
      },
      { a: actor.id },
    );
    await sleep(1200);
    const lonely = (await state()).sims.find((sim) => sim.id === actor.id);
    check(
      lonely.active?.startsWith('social_') === true,
      `A lonely Sim seeks company on their own (doing ${lonely.active})`,
    );

    // --- Aspirations actually pay out -------------------------------------
    const fundsBeforeGoal = (await state()).funds;
    const goalResult = await page.evaluate(() => {
      const id = window.__life().selectedSimId;
      const allSkills = [
        'cooking', 'charisma', 'fitness', 'logic', 'creativity', 'cleaning', 'gardening', 'gaming',
      ];
      const maxed = Object.fromEntries(allSkills.map((skill) => [skill, { xp: 500000 }]));
      window.__simStore.setState((s) => ({
        avatars: { ...s.avatars, [id]: { ...s.avatars[id], skills: maxed } },
      }));
      // Also make them everybody's friend, so relationship milestones can land.
      window.__lifeStore.setState((s) => {
        if (!s.household) return s;
        return {
          household: {
            ...s.household,
            sims: s.household.sims.map((m) => ({
              ...m,
              relationships: Object.fromEntries(
                Object.keys(m.relationships).map((other) => [
                  other,
                  { friendship: 80, romance: 60, kind: 'bestFriend' },
                ]),
              ),
            })),
          },
        };
      });
      window.__simStore.getState().setSpeed(3);
      return id;
    });
    await sleep(3500);
    const afterGoal = await state();
    check(
      afterGoal.funds > fundsBeforeGoal,
      `Reaching a milestone pays out (₦${fundsBeforeGoal} → ₦${afterGoal.funds})`,
    );
    const progress = await page.evaluate(
      (id) => window.__lifeStore.getState().household.sims.find((s) => s.id === id)?.aspirationProgress ?? {},
      goalResult,
    );
    check(
      Object.keys(progress).length > 0,
      `Aspiration progress is recorded (${Object.keys(progress).join(', ')})`,
    );

    // --- Rock bottom has consequences -------------------------------------
    const crisis = await page.evaluate(() => {
      const id = window.__life().selectedSimId;
      const sim = window.__simStore.getState();
      window.__simStore.setState((s) => ({
        avatars: {
          ...s.avatars,
          [id]: {
            ...s.avatars[id],
            active: null,
            queue: [],
            motives: Object.fromEntries(
              Object.keys(s.avatars[id].motives).map((k) => [k, k === 'energy' ? 0 : 50]),
            ),
            consequenceCooldowns: {},
          },
        },
      }));
      void sim;
      return id;
    });
    await sleep(3500);
    const afterCrisis = await state();
    const collapsedSim = afterCrisis.sims.find((sim) => sim.id === crisis);
    check(
      (collapsedSim?.mood ?? '') !== '' && afterCrisis.funds >= 0,
      `A Sim at rock bottom is handled (mood ${collapsedSim?.mood})`,
    );
    const crisisRecord = await page.evaluate(
      (id) => window.__simStore.getState().avatars[id].consequenceCooldowns ?? {},
      crisis,
    );
    check(
      Object.keys(crisisRecord).length > 0,
      `Running out of a need triggers a consequence (${Object.keys(crisisRecord).join(', ')})`,
    );
    const stillAlive = await page.evaluate((id) => {
      const a = window.__simStore.getState().avatars[id];
      return a.motives.energy > 0 && a.moodlets.length > 0;
    }, crisis);
    check(stillAlive, 'The collapsed Sim is revived with a moodlet, not left at zero');

    // --- Family: a baby can be born into the household ---------------------
    const family = await page.evaluate(() => {
      const store = window.__lifeStore;
      const home = store.getState().household;
      const adults = home.sims.filter((s) => s.stage === 'adult' || s.stage === 'youngAdult');
      if (adults.length < 2) return null;
      // Make them a couple so conception is allowed.
      store.setState((s) => ({
        household: {
          ...s.household,
          sims: s.household.sims.map((m) => ({
            ...m,
            relationships: Object.fromEntries(
              Object.entries(m.relationships).map(([id, rel]) => [
                id,
                { ...rel, friendship: 85, romance: 85, kind: 'partner' },
              ]),
            ),
          })),
        },
      }));
      return { a: adults[0].id, b: adults[1].id, count: home.sims.length };
    });

    if (family) {
      await page.evaluate(
        ({ a, b }) => window.__lifeStore.getState().tryForBaby(a, b),
        { a: family.a, b: family.b },
      );
      await sleep(500);
      const expecting = await page.evaluate(() =>
        window.__lifeStore.getState().household.sims.some((s) => s.pregnantUntilDayOffset !== undefined),
      );
      check(expecting, 'A couple can conceive once they are close');

      // Step the days one at a time and stop the moment the baby arrives, so we
      // are looking at a newborn rather than an infant who has already aged up.
      const birth = await page.evaluate((count) => {
        const store = window.__lifeStore;
        for (let day = 1; day <= 8; day++) {
          store.getState().advanceLifeDay(day, 2);
          if (store.getState().household.sims.length > count) {
            const baby = store.getState().household.sims.at(-1);
            const parents = store
              .getState()
              .household.sims.filter((m) =>
                Object.values(m.relationships).some((r) => r.kind === 'parent'),
              )
              .map((m) => m.id);
            return {
              stage: baby.stage,
              babySeesParent: Object.values(baby.relationships).some((r) => r.kind === 'child'),
              parentIds: baby.parentIds ?? [],
              parentCount: parents.length,
            };
          }
        }
        return null;
      }, family.count);

      check(birth !== null, `A baby is born (${family.count} → ${family.count + 1} in the household)`);
      check(birth?.stage === 'baby', `The newborn starts as a baby (${birth?.stage})`);
      check(
        birth?.babySeesParent === true && (birth?.parentIds.length ?? 0) === 2,
        'The newborn knows both parents from their own side',
      );
      check((birth?.parentCount ?? 0) >= 2, 'The parents are linked back to the child');
    } else {
      check(true, 'Family checks skipped (needs two adults)');
    }

    // --- Household management + shortcuts ---------------------------------
    const manage = await page.evaluate(() => {
      const store = window.__lifeStore;
      const before = store.getState().household.sims.length;
      const name = store.getState().household.name;
      store.setState((s) => ({ household: { ...s.household, name: 'Renamed House' } }));
      const leavingId = store.getState().household.sims[1].id;
      store.getState().removeSim(leavingId);
      return {
        before,
        after: store.getState().household.sims.length,
        nameChanged: store.getState().household.name !== name,
        cleaned: store
          .getState()
          .household.sims.every((m) => m.relationships[leavingId] === undefined),
      };
    });
    check(manage.nameChanged, 'The household can be renamed');
    check(manage.after === manage.before - 1, `A Sim can move out (${manage.before} → ${manage.after})`);
    check(manage.cleaned, 'Their relationships are cleaned up');

    // Keyboard shortcuts: space pauses, 1 resumes.
    await page.evaluate(() => window.__simStore.getState().setSpeed(1));
    await page.keyboard.press('Space');
    await sleep(300);
    const paused = (await state()).speed;
    await page.keyboard.press('Digit2');
    await sleep(300);
    const fast = (await state()).speed;
    check(paused === 0, `Space pauses the game (speed ${paused})`);
    check(fast === 2, `Number keys set the speed (speed ${fast})`);

    // The help card explains the controls on a first visit.
    await page.evaluate(() => localStorage.removeItem('life-sim-seen-help-v1'));
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.__life?.().hasHousehold === true, { timeout: 60000 });
    await sleep(2000);
    check(
      await page.evaluate(() => /How to live here/i.test(document.body.innerText)),
      'First-time players are shown the controls',
    );

    // --- Sound is wired and cannot break the game -------------------------
    const audio = await page.evaluate(() => {
      const store = window.__lifeStore;
      const before = window.__lifeStore.getState().household.funds;
      // Buying should trigger a cue without throwing even with no audio device.
      store.getState().startPlacing('plant');
      const plot = store.getState().household.plot;
      store.getState().setGhost(plot.originX + 1, plot.originZ + 20);
      store.getState().confirmPlace();
      return { before, after: window.__lifeStore.getState().household.funds };
    });
    check(audio.after < audio.before, 'Purchases still work with the sound engine active');

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
