import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:5173/';
const ARTIFACT_DIR = '/Users/djunehor/.gemini/antigravity-ide/brain/f8563bbb-60df-460e-922b-bc7046bb0e40';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.error('PAGE ERROR:', err));

  // Pre-seed authentication and character creation in localStorage
  await page.evaluateOnNewDocument(() => {
    const profile = {
      name: 'Tola Adeleke',
      nickname: 'Tola',
      gender: 'F',
      age: 26,
      stateOfOrigin: 'Oyo',
      profession: 'Corporate Lawyer',
      trait: 'Strategic Schemer',
      avatar: '👑',
      accentColor: '#9333ea',
      skinTone: '#c98a5b',
      hairstyle: 'lowcut',
    };
    localStorage.setItem(
      'biggie-house-auth',
      JSON.stringify({
        token: 'dev-token-123',
        playerId: 'player-dev-1',
        username: 'tola_pro',
        profile,
        playerState: null,
      })
    );
  });

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Capture Guided Tour Step 1 (Welcome & Overview)
  const tourShot1 = path.join(ARTIFACT_DIR, 'guided_tour_step1.png');
  await page.screenshot({ path: tourShot1 });
  console.log('Saved tour screenshot 1:', tourShot1);

  // Click Next Step to view Step 2 (Controls)
  try {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Next')) {
        await b.click();
        await new Promise((r) => setTimeout(r, 1200));
        break;
      }
    }
  } catch (e) {}

  // Capture Guided Tour Step 2 (Controls)
  const tourShot2 = path.join(ARTIFACT_DIR, 'guided_tour_step2.png');
  await page.screenshot({ path: tourShot2 });
  console.log('Saved tour screenshot 2:', tourShot2);

  // Click Skip Tour or Finish to dismiss
  try {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Skip Tour') || text.includes('Enter Biggie')) {
        await b.click();
        await new Promise((r) => setTimeout(r, 1000));
        break;
      }
    }
  } catch (e) {}

  // Take screenshot 1: 3D House with Stations & Emote Bar
  const shot1 = path.join(ARTIFACT_DIR, 'interactive_house_stations.png');
  await page.screenshot({ path: shot1 });
  console.log('Saved screenshot 1:', shot1);

  // Click an emote button (e.g. Wave or Dance)
  try {
    const emoteBtns = await page.$$('button');
    for (const b of emoteBtns) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Wave') || text.includes('Dance')) {
        await b.click();
        await new Promise((r) => setTimeout(r, 600));
        break;
      }
    }
  } catch (e) {}

  const shot2 = path.join(ARTIFACT_DIR, 'emote_action_feedback.png');
  await page.screenshot({ path: shot2 });
  console.log('Saved screenshot 2:', shot2);

  // Move player near the Diary Room and click the Confess to Biggie station
  try {
    await page.evaluate(() => {
      // Find the Confess to Biggie station and click it
      const elements = Array.from(document.querySelectorAll('*'));
      const diaryEl = elements.find((e) => e.innerText && e.innerText.includes('Confess to Biggie'));
      if (diaryEl) {
        diaryEl.click();
      }
    });

    // Wait and click again when arrived
    await new Promise((r) => setTimeout(r, 1200));
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('*')).find(
        (e) => e.innerText && e.innerText.includes('Confess to Biggie')
      );
      if (el) el.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
  } catch (e) {}

  const shot3 = path.join(ARTIFACT_DIR, 'diary_room_confessional.png');
  await page.screenshot({ path: shot3 });
  console.log('Saved screenshot 3:', shot3);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
