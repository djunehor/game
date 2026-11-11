import puppeteer from 'puppeteer-core';
import * as path from 'path';
import * as fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = '/Users/djunehor/.gemini/antigravity/brain/0c219bdd-4ced-40c3-bb0a-8873ce788f9f';

async function run() {
  console.log('LOG: Starting browser visual playtest...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=metal',
      '--enable-webgl',
      '--window-size=1280,800',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[BROWSER CONSOLE ${msg.type()}]`, msg.text());
  });

  page.on('requestfailed', request => {
    console.error(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('response', response => {
    if (!response.ok()) {
      console.error(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });

  console.log('LOG: Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // 1. Capture Briefing / Start Screen
  const briefingPath = path.join(ARTIFACT_DIR, 'screenshot_briefing.png');
  await page.screenshot({ path: briefingPath });
  console.log(`LOG: Saved briefing screenshot to ${briefingPath}`);

  // 2. Click DEPLOY OPERATIVE button
  console.log('LOG: Clicking DEPLOY OPERATIVE...');
  await page.click('#btn-deploy');

  // Wait for 3D world to render
  await new Promise(r => setTimeout(r, 1500));

  // 3. Capture in-game screenshot
  const gameplayDesktopPath = path.join(ARTIFACT_DIR, 'screenshot_gameplay_desktop.png');
  await page.screenshot({ path: gameplayDesktopPath });
  console.log(`LOG: Saved desktop gameplay screenshot to ${gameplayDesktopPath}`);

  // 4. Simulate movement and shooting
  console.log('LOG: Simulating player keyboard and mouse inputs...');
  await page.keyboard.down('KeyW');
  await new Promise(r => setTimeout(r, 800));
  await page.keyboard.up('KeyW');

  // Shoot weapon
  await page.mouse.click(640, 400);
  await new Promise(r => setTimeout(r, 200));
  await page.mouse.click(640, 400);
  await new Promise(r => setTimeout(r, 200));
  await page.mouse.click(640, 400);

  // Inspect HUD state
  const hudState = await page.evaluate(() => {
    return {
      health: document.getElementById('health-val')?.innerText,
      ammoClip: document.getElementById('ammo-clip')?.innerText,
      ammoReserve: document.getElementById('ammo-reserve')?.innerText,
      weaponStatus: document.getElementById('weapon-status')?.innerText,
      objective: document.getElementById('objective-text')?.innerText,
    };
  });

  console.log('LOG: HUD state after shooting and moving:', JSON.stringify(hudState, null, 2));

  // 5. Test Mobile Viewport Responsiveness
  console.log('LOG: Testing mobile viewport responsiveness (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await new Promise(r => setTimeout(r, 600));

  // If start screen is visible on reload, click deploy
  const startVisible = await page.evaluate(() => {
    const start = document.getElementById('start-screen');
    return start && !start.classList.contains('hidden');
  });

  if (startVisible) {
    await page.click('#btn-deploy');
    await new Promise(r => setTimeout(r, 1200));
  }

  const mobileControlsVisible = await page.evaluate(() => {
    const mobileControls = document.getElementById('mobile-controls');
    if (!mobileControls) return false;
    const style = window.getComputedStyle(mobileControls);
    return style.display !== 'none';
  });

  console.log('LOG: Mobile controls display visible:', mobileControlsVisible);

  const gameplayMobilePath = path.join(ARTIFACT_DIR, 'screenshot_gameplay_mobile.png');
  await page.screenshot({ path: gameplayMobilePath });
  console.log(`LOG: Saved mobile gameplay screenshot to ${gameplayMobilePath}`);

  await browser.close();
  console.log('LOG: Browser playtest finished successfully.');
}

run().catch(err => {
  console.error('LOG: Playtest encountered error:', err);
  process.exit(1);
});
