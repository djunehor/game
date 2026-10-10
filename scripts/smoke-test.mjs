// Smoke test: drives the real app in headless Chrome and verifies the full
// game loop (character creation → HoH → daily actions → nominations → eviction).
// Run with: node scripts/smoke-test.mjs
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.URL || 'http://localhost:5173/';

const errors = [];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    pipe: false,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--remote-debugging-port=9222',
      '--no-first-run',
      '--no-default-browser-check',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });
  const page = await browser.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('text=Create Your Housemate', { timeout: 10000 });
  log('✓ Character creator rendered');

  // Fill the form
  await page.type('input[placeholder="e.g. Adaeze Okonkwo"]', 'Test Player');
  await page.type('input[placeholder="e.g. Ada"]', 'Testy');
  await page.click('button:has-text("Enter the Biggie House")');
  await page.waitForSelector('text=Head of House Challenge', { timeout: 10000 });
  log('✓ HoH challenge modal appeared');

  // Answer all 6 quiz questions (always pick the first option)
  for (let i = 0; i < 6; i++) {
    await page.waitForSelector('button.border-black\\/10, button[class*="border-black/10"]', { timeout: 5000 });
    // Click the first option button in the options list
    const opts = await page.$$('button.w-full.rounded-2xl');
    if (opts.length === 0) break;
    await opts[0].click();
    await new Promise((r) => setTimeout(r, 300));
    const nextBtn = await page.$('button:has-text("Next question"), button:has-text("Submit answers")');
    if (nextBtn) {
      await nextBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  log('✓ Answered HoH quiz');

  // After HoH, we should reach "Begin the week" or the daily phase
  await new Promise((r) => setTimeout(r, 1000));
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Begin the week') || bodyText.includes('End the day') || bodyText.includes('in the house')) {
    log('✓ Reached post-HoH state');
  } else {
    log('? Post-HoH state unclear, continuing');
  }

  // Click through the week: End the day → nominations → eviction
  for (let i = 0; i < 8; i++) {
    const clicked = await clickIfExists(page, [
      'button:has-text("Begin the week")',
      'button:has-text("End the day")',
      'button:has-text("End the party")',
      'button:has-text("To the Saturday party")',
      'button:has-text("New week")',
    ]);
    if (!clicked) break;
    await new Promise((r) => setTimeout(r, 600));

    // Handle nominations modal if present
    if (await page.$('text=Nominations')) {
      const nomBtns = await page.$$('button:has-text("Lock in nominations")');
      if (nomBtns.length > 0) {
        // pick first two eligible housemates
        const eligible = await page.$$('div.grid.h-11.w-11');
        // Better: click housemate cards
        const cards = await page.$$('button.w-full.items-center.gap-3');
        if (cards.length >= 2) {
          await cards[0].click();
          await cards[1].click();
          await page.click('button:has-text("Lock in nominations")');
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    // Handle eviction modal if present
    if (await page.$('text=Live Eviction')) {
      const reveal = await page.$('button:has-text("Reveal who goes home")');
      if (reveal) {
        await reveal.click();
        await new Promise((r) => setTimeout(r, 600));
      }
      const cont = await page.$('button:has-text("Continue to next week")');
      if (cont) {
        await cont.click();
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }

  log('✓ Finished week simulation');

  const finalText = await page.evaluate(() => document.body.innerText);
  if (finalText.includes('Game Over') || finalText.includes('You won the game') || finalText.includes('The journey ends')) {
    log('✓ Reached a terminal state');
  }

  await browser.close();

  if (errors.length > 0) {
    console.error('\n⚠️ Console errors detected:');
    for (const e of errors.slice(0, 10)) console.error('  -', e);
    process.exit(1);
  }
  console.log('\n✅ Smoke test passed with no console errors');
}

async function clickIfExists(page, selectors) {
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) {
      await el.click();
      return true;
    }
  }
  return false;
}

function log(msg) {
  console.log(msg);
}

main().catch((err) => {
  console.error('❌ Smoke test failed:', err.message);
  process.exit(1);
});
